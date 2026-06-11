import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils, getDb } from "coze-coding-dev-sdk";
import { potentialMarkets, marketCompanies } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@/storage/database/shared/schema";

// 深度分析接口
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const db = await getDb(schema);

    // 1. 获取市场信息
    const marketResult = await db
      .select()
      .from(potentialMarkets)
      .where(eq(potentialMarkets.id, id))
      .limit(1);

    if (marketResult.length === 0) {
      return NextResponse.json({ error: "市场不存在" }, { status: 404 });
    }

    const market = marketResult[0];

    // 2. 获取相关企业信息
    const companiesResult = await db
      .select()
      .from(marketCompanies)
      .where(eq(marketCompanies.marketId, id));

    const companiesList = companiesResult.map(c => ({
      name: c.stockName,
      code: c.stockCode,
      link: c.link,
      marketCap: c.marketCap
    }));

    // 3. 构建分析提示词
    const marketTypeText = market.marketType === "hot" ? "热门市场" : "潜力市场";
    const systemPrompt = `你是一位专业的股票投资分析师，擅长分析板块投资价值。请根据以下信息，对板块进行深度分析。

分析内容应包含以下维度：
1. **市场定义与背景**：这个板块是什么？为什么${marketTypeText}？
2. **基本面分析**：
   - 核心驱动因素（政策、技术、需求等）
   - 行业景气度
   - 市场规模与增长预期
3. **当前阶段判断**：
   - 这个板块目前处于什么阶段？（底部启动/上升期/高潮期/回调期/调整期）
   - 估值水平如何？（低估/合理/高估）
   - 关注度是否合理？
4. **投资建议**：
   - 适合什么类型的投资者？
   - 投资策略（追高/等待回调/长期持有/波段操作）
   - 风险提示
5. **产业链分析**：
   - 根据企业列表，分析产业链各环节的投资机会
   - 哪些环节更具潜力？

输出格式要求：
- 使用 Markdown 格式
- 每个维度使用二级标题（##）
- 关键结论加粗
- 使用表格展示产业链企业分析（包含：环节、代表企业、投资评级）
- 最后给出总结评级：买入/增持/持有/减持/卖出

请保持客观专业，避免过度乐观或悲观。`;

    const userPrompt = `请分析以下板块：

板块名称：${market.name}
板块类型：${marketTypeText}
关注度：${market.attentionScore}/100
潜力评分：${market.potentialScore}/100
描述：${market.description}
标签：${Array.isArray(market.tags) ? market.tags.join("、") : market.tags}

产业链企业：
${companiesList.map(c => `- ${c.name}（${c.code}）- ${c.link}${c.marketCap ? ` - 市值 ${c.marketCap}亿` : ""}`).join("\n")}`;

    // 4. 调用 LLM 生成分析
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    const stream = client.stream(messages, {
      model: "deepseek-v3-2-251201", // 使用 DeepSeek V3.2 进行深度推理
      temperature: 0.7,
    });

    // 5. 收集流式响应
    let analysisContent = "";
    const encoder = new TextEncoder();

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              analysisContent += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();

          // 6. 保存分析结果到数据库
          if (analysisContent) {
            try {
              const dbSave = await getDb(schema);
              await dbSave
                .update(potentialMarkets)
                .set({
                  analysis: {
                    content: analysisContent,
                    generatedAt: new Date().toISOString(),
                  },
                  updatedAt: new Date(),
                })
                .where(eq(potentialMarkets.id, id));
            } catch (dbError) {
              console.error("Failed to save analysis:", dbError);
            }
          }
        }
      },
    });

    return new NextResponse(streamResponse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      { error: "生成分析失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 获取已生成的分析
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb(schema);

    const result = await db
      .select()
      .from(potentialMarkets)
      .where(eq(potentialMarkets.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "市场不存在" }, { status: 404 });
    }

    const market = result[0];
    const analysis = market.analysis as { content?: string; generatedAt?: string } | null;

    if (!analysis?.content) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      content: analysis.content,
      generatedAt: analysis.generatedAt,
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "获取分析失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
