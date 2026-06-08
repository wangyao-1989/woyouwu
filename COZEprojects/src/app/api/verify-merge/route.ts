import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { analyzedData } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建验证提示词
    const verificationPrompt = `你是一个简历验证专家。请分析以下简历数据，判断education和certifications的合并是否正确。

原始要求：用户在输入简历时，education章节标题为"EDUCATION & CERTIFICATIONS"，表示这两个部分应该合并在一起显示，而不是分成两个独立的板块。

请检查以下内容：

1. sectionTitles.education的标题是什么？
2. 如果标题包含"CERTIFICATION"、"&"或"AND"，则certifications应该被合并到education中
3. 检查certifications数组是否为空（如果应该合并的话）
4. 检查education数组中的description是否包含certifications的内容

简历数据：
${JSON.stringify(analyzedData, null, 2)}

请按照以下格式返回分析结果（纯JSON）：
{
  "educationTitle": "education章节的标题",
  "hasCertificationKeyword": true/false,
  "certificationsArrayLength": certifications数组的长度,
  "educationContainsCertifications": true/false,
  "isMerged": true/false,
  "issues": ["列出所有问题，如果没有问题则为空数组"],
  "recommendation": "给出改进建议"
}`;

    const messages = [
      { role: 'user' as const, content: verificationPrompt },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.3,
      model: 'doubao-seed-1-8-251228',
    });

    // 尝试解析 JSON 响应
    let parsedData;
    try {
      // 清理可能的 markdown 代码块标记
      let cleanContent = response.content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      // 如果 JSON 解析失败，返回原始文本
      parsedData = {
        error: 'JSON解析失败',
        rawContent: response.content,
      };
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: '验证失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}
