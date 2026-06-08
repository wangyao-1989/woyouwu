import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface AnalyzedResume {
  name: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  workExperience: any[];
  education: any[];
  projects: any[];
  skills: string[];
  languages?: any[];
  certifications?: any[];
  sectionTitles?: {
    contact: string;
    about: string;
    work: string;
    education: string;
    projects: string;
    skills: string;
    languagesAndCertifications: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText, language = 'zh' } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 根据语言选择设置提示词
    const languageSettings = language === 'en' ? {
      language: 'English',
      sectionTitles: {
        contact: 'Contact Info',
        about: 'About Me',
        work: 'Work Experience',
        education: 'Education',
        projects: 'Projects',
        skills: 'Professional Skills',
        languagesAndCertifications: 'Languages & Certifications',
      },
      promptLanguage: 'Return all content in English',
    } : {
      language: 'Chinese',
      sectionTitles: {
        contact: '联系方式',
        about: '关于我',
        work: '工作经历',
        education: '教育背景',
        projects: '项目经历',
        skills: '专业技能',
        languagesAndCertifications: '语言与证书',
      },
      promptLanguage: '返回中文内容',
    };

    const systemPrompt = `你是一个专业的简历分析助手。你的任务是从用户输入的简历文本中提取结构化信息，并生成格式化的简历内容。

${languageSettings.promptLanguage}。${language === 'en' ? ' Generate full English resume.' : ''}

**重要：章节标题识别规则**
1. **优先使用用户输入的原始章节标题**：仔细分析用户简历文本中的章节标题，保留原始措辞
2. **特别关注组合标题**：如果用户输入了类似"EDUCATION & CERTIFICATIONS"、"EDUCATION AND CERTIFICATIONS"、"EDUCATION/CERTIFICATIONS"等组合标题，必须保留完整的原始标题
3. **识别关键词**：章节标题通常出现在每段内容开头，如：
   - "EDUCATION & CERTIFICATIONS"
   - "WORK EXPERIENCE" 或 "工作经历"
   - "PROFESSIONAL SUMMARY" 或 "个人简介"
   - "TECHNICAL SKILLS" 或 "专业技能"
4. **默认标题仅作备用**：只有在用户没有明确提供章节标题时，才使用以下默认标题

默认标题（备用）：
- contact: "${languageSettings.sectionTitles.contact}"
- about: "${languageSettings.sectionTitles.about}"
- work: "${languageSettings.sectionTitles.work}"
- education: "${languageSettings.sectionTitles.education}"
- projects: "${languageSettings.sectionTitles.projects}"
- skills: "${languageSettings.sectionTitles.skills}"
- languagesAndCertifications: "${languageSettings.sectionTitles.languagesAndCertifications}"

请按照以下JSON格式返回分析结果：
{
  "name": "${language === 'en' ? 'Full Name' : '姓名'}",
  "email": "email@example.com",
  "phone": "phone number",
  "address": "address",
  "summary": "${language === 'en' ? 'Professional Summary' : '个人简介'}",
  "workExperience": [
    {
      "company": "${language === 'en' ? 'Company Name' : '公司名称'}",
      "position": "${language === 'en' ? 'Position Title' : '职位'}",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "description": "${language === 'en' ? 'Job Description' : '工作描述'}"
    }
  ],
  "education": [
    {
      "school": "${language === 'en' ? 'School Name' : '学校名称'}",
      "major": "${language === 'en' ? 'Major' : '专业'}",
      "degree": "${language === 'en' ? 'Degree' : '学历'}",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "description": "${language === 'en' ? 'Education Description' : '教育描述'}"
    }
  ],
  "projects": [
    {
      "name": "${language === 'en' ? 'Project Name' : '项目名称'}",
      "role": "${language === 'en' ? 'Role' : '担任角色'}",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "description": "${language === 'en' ? 'Project Description' : '项目描述'}"
    }
  ],
  "skills": [
    "${language === 'en' ? 'Strategic Sourcing: Global Category Management, TCO Optimization, RFQ/RFP Negotiation' : '技能分类1: 具体技能1, 具体技能2, 具体技能3'}",
    "${language === 'en' ? 'Project & Technical: ESI (Early Supplier Introduction), PPAP/APQP, VA/VE' : '技能分类2: 具体技能4, 具体技能5, 具体技能6'}"
  ],
  "languages": [
    {
      "name": "${language === 'en' ? 'Language Name' : '语言名称'}",
      "level": "${language === 'en' ? 'Proficiency Level' : '熟练程度'}"
    }
  ],
  "certifications": [
    {
      "name": "${language === 'en' ? 'Certificate Name' : '证书名称'}",
      "issuer": "${language === 'en' ? 'Issuing Organization' : '颁发机构'}",
      "date": "YYYY-MM"
    }
  ],
  "sectionTitles": {
    "contact": "${languageSettings.sectionTitles.contact}",
    "about": "${languageSettings.sectionTitles.about}",
    "work": "${languageSettings.sectionTitles.work}",
    "education": "${languageSettings.sectionTitles.education}",
    "projects": "${languageSettings.sectionTitles.projects}",
    "skills": "${languageSettings.sectionTitles.skills}",
    "languagesAndCertifications": "${languageSettings.sectionTitles.languagesAndCertifications}"
  }
}

注意事项：
1. ${language === 'en' ? 'Generate all content in English' : '返回所有中文内容'}
2. 如果某些信息在文本中没有提及，对应字段返回空字符串或空数组
3. 时间格式统一为 YYYY-MM-DD，如果只有年份或月份，补全为 YYYY-MM-01
4. 工作描述和教育描述保留原文的主要内容
5. **提取技能段落（CRITICAL）**：
   - 保持技能段落的原始格式，不要拆分成独立的词组
   - 如果用户输入的是分类式技能（如"Strategic Sourcing: Global Category Management, TCO Optimization"），则每个分类段落作为 skills 数组的一个元素
   - 示例输入：
     'Strategic Sourcing: Global Category Management, TCO Optimization, RFQ/RFP Negotiation.
      Project & Technical: ESI (Early Supplier Introduction), PPAP/APQP, VA/VE.
      Operations & Systems: ERP Mastery (SAP, SP System), PR/PO Management, Demand Planning.
      Leadership: Cross-functional Team Leadership, Stakeholder Management, Supplier Performance Evaluation.
      Data Analytics: Advanced Excel, Power BI Dashboards, Time-Series Analysis.'
   - 应提取为：["Strategic Sourcing: Global Category Management, TCO Optimization, RFQ/RFP Negotiation.", "Project & Technical: ESI (Early Supplier Introduction), PPAP/APQP, VA/VE.", ...]
   - 每个完整的分类段落作为数组的一个元素，保持原文格式（包括分类标题、冒号、逗号分隔等）
6. 提取所有语言能力：包括语言名称和熟练程度（如：Native、Fluent、IELTS 7.0、CET6等）
   - 示例输入："Languages: English (IELTS 7.0, CET6); Mandarin (Native)."
   - 应提取为：[{"name": "English", "level": "IELTS 7.0, CET6"}, {"name": "Mandarin", "level": "Native"}]
7. 提取所有证书认证：包括证书名称、颁发机构和获得时间
   - 示例输入："Technical: National Computer Rank Examination Level 2 (Advanced Excel/Database)"
   - 应提取为：[{"name": "National Computer Rank Examination Level 2 (Advanced Excel/Database)", "issuer": "NCRE", "date": ""}]
   - 识别关键词：Certificate、Certification、License、Rank Examination、Technical、Professional等
   - 特别注意：如果简历中有 "LANGUAGES & CERTIFICATIONS" 或 "语言与证书" 章节，其中提到的非语言能力的内容（如：Technical、Professional、证书、认证等）都应识别为证书
8. 章节标题必须使用${language === 'en' ? '英文' : '中文'}
9. **章节标题识别规则（CRITICAL）**：
   - 必须首先扫描用户输入的简历文本，识别实际的章节标题
   - 如果发现明确的章节标题（如"EDUCATION & CERTIFICATIONS"），必须保留原始标题
   - 特别注意组合标题：如果education章节标题包含"CERTIFICATION"、"&"、"AND"、"AND CERTIFICATIONS"等关键词，说明用户希望将education和certifications合并显示，必须保留完整的原始标题（如"EDUCATION & CERTIFICATIONS"）
   - 示例：如果用户输入"EDUCATION & CERTIFICATIONS"作为章节标题，则sectionTitles.education应返回"EDUCATION & CERTIFICATIONS"，而不是"Education"
   - 只有在无法识别用户提供的章节标题时，才使用默认标题
10. 只返回纯JSON格式，不要有任何其他文字说明
11. 确保 JSON 格式正确，可以被 JSON.parse() 解析
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: resumeText },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.3,
      model: 'doubao-seed-1-8-251228',
    });

    // 尝试解析 JSON 响应
    let parsedData: AnalyzedResume | { error: string; rawContent?: string };
    try {
      // 清理可能的 markdown 代码块标记
      let cleanContent = response.content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      parsedData = JSON.parse(cleanContent);
      
      // 智能合并逻辑：如果education标题包含CERTIFICATION、&或AND，则将certifications和languages都合并到education中
      // 如果education标题包含LANGUAGES，则将languages合并到education中
      if (parsedData && 'sectionTitles' in parsedData && parsedData.sectionTitles && parsedData.sectionTitles.education) {
        const educationTitle = parsedData.sectionTitles.education.toUpperCase();
        const hasCertificationKeyword = educationTitle.includes('CERTIFICATION') || 
                                        educationTitle.includes('&') || 
                                        educationTitle.includes('AND');
        const hasLanguagesKeyword = educationTitle.includes('LANGUAGES');
        
        console.log('检测到education标题:', educationTitle);
        console.log('是否包含certification关键词:', hasCertificationKeyword);
        console.log('是否包含languages关键词:', hasLanguagesKeyword);
        
        // 如果标题包含"&"或"AND"，说明这是一个组合标题（如 EDUCATION & CERTIFICATIONS），应该合并所有相关内容
        const shouldCombineAll = educationTitle.includes('&') || educationTitle.includes('AND');
        
        if (shouldCombineAll || hasLanguagesKeyword) {
          // 先合并languages
          if ('languages' in parsedData && parsedData.languages && parsedData.languages.length > 0) {
            console.log('执行education和languages合并');
            console.log('合并前languages数量:', parsedData.languages.length);
            console.log('合并前languages内容:', JSON.stringify(parsedData.languages));
            
            // 将languages内容追加到education数组的描述中
            parsedData.education.forEach((edu: any, index: number) => {
              if ('languages' in parsedData && parsedData.languages && parsedData.languages.length > 0) {
                // 为每个education条目追加所有languages
                const langDescriptions = parsedData.languages.map((lang: any) => {
                  const parts = [];
                  if (lang.name) parts.push(lang.name);
                  if (lang.level) parts.push(lang.level);
                  return parts.join(' - ');
                }).join('; ');
                
                console.log(`Education ${index} 合并languages前description:`, edu.description);
                
                if (langDescriptions) {
                  if (edu.description) {
                    edu.description = edu.description + '\n\nLanguages: ' + langDescriptions;
                  } else {
                    edu.description = 'Languages: ' + langDescriptions;
                  }
                }
                
                console.log(`Education ${index} 合并languages后description:`, edu.description);
              }
            });
            
            // 清空languages数组，避免在预览和PDF中重复显示
            parsedData.languages = [];
            
            console.log('languages合并完成，languages已清空');
          }
        }
        
        if (shouldCombineAll || hasCertificationKeyword) {
          // 再合并certifications
          if ('certifications' in parsedData && parsedData.certifications && parsedData.certifications.length > 0) {
            console.log('执行education和certifications合并');
            console.log('合并前certifications数量:', parsedData.certifications.length);
            console.log('合并前certifications内容:', JSON.stringify(parsedData.certifications));
            console.log('合并前education内容:', JSON.stringify(parsedData.education));
            
            // 将certifications内容追加到education数组的描述中
            parsedData.education.forEach((edu: any, index: number) => {
              if ('certifications' in parsedData && parsedData.certifications && parsedData.certifications.length > 0) {
                // 为每个education条目追加所有certifications
                const certDescriptions = parsedData.certifications.map((cert: any) => {
                  const parts = [];
                  if (cert.name) parts.push(cert.name);
                  if (cert.issuer) parts.push(cert.issuer);
                  if (cert.date) parts.push(cert.date);
                  return parts.join(' - ');
                }).join('; ');
                
                console.log(`Education ${index} 合并certifications前description:`, edu.description);
                
                if (certDescriptions) {
                  if (edu.description) {
                    edu.description = edu.description + '\n\nCertifications: ' + certDescriptions;
                  } else {
                    edu.description = 'Certifications: ' + certDescriptions;
                  }
                }
                
                console.log(`Education ${index} 合并certifications后description:`, edu.description);
              }
            });
            
            // 清空certifications数组，避免在预览和PDF中重复显示
            parsedData.certifications = [];
            
            console.log('certifications合并完成，certifications已清空');
            console.log('合并后education内容:', JSON.stringify(parsedData.education));
          }
        }
      }
      
      if (!('error' in parsedData)) {
        console.log('=== 最终返回的数据 ===');
        console.log('education数组:', parsedData.education);
        console.log('languages数组:', parsedData.languages);
        console.log('certifications数组:', parsedData.certifications);
      }
    } catch (parseError) {
      // 如果 JSON 解析失败，返回原始文本
      parsedData = {
        error: 'JSON解析失败',
        rawContent: response.content,
      };
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      { error: '简历分析失败', message: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}
