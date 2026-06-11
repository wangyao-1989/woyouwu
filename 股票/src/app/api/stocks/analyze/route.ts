import { NextRequest, NextResponse } from "next/server";
import { SearchClient, Config, LLMClient, HeaderUtils } from "coze-coding-dev-sdk";
import { holdingManager } from "@/storage/database/holdingManager";
import type { AnalysisContent } from "@/storage/database/shared/schema";

export async function POST(request: NextRequest) {
  try {
    const { stockCode, stockName, analysisType = "on_demand" } = await request.json();

    if (!stockCode || !stockName) {
      return NextResponse.json(
        { error: "股票代码和名称不能为空" },
        { status: 400 }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 第一步：使用 web-search 检索股票相关资讯
    const searchConfig = new Config();
    const searchClient = new SearchClient(searchConfig, customHeaders);

    const searchQueries = [
      `${stockCode} ${stockName} 最新资讯`,
      `${stockCode} ${stockName} 利好利空消息`,
      `${stockCode} ${stockName} 行业动态`,
    ];

    const allNews: Array<{
      title: string;
      url?: string;
      summary: string;
      sentiment: "positive" | "negative" | "neutral";
      publishTime?: string;
    }> = [];

    for (const query of searchQueries) {
      const searchResponse = await searchClient.advancedSearch(query, {
        searchType: "web",
        count: 5,
        timeRange: "1w", // 最近一周的资讯
        needSummary: true,
      });

      if (searchResponse.web_items) {
        for (const item of searchResponse.web_items) {
          allNews.push({
            title: item.title,
            url: item.url,
            summary: item.summary || item.snippet,
            sentiment: "neutral", // 后续由 LLM 判断
            publishTime: item.publish_time,
          });
        }
      }
    }

    // 第二步：使用 LLM 分析资讯并给出建议
    const llmConfig = new Config();
    const llmClient = new LLMClient(llmConfig);

    const analysisPrompt = `你是一位资深的股票分析师，擅长基本面分析、技术分析和市场情绪分析。请基于以下资讯，对股票 ${stockCode} (${stockName}) 进行深度研究分析。

【资讯列表】
${allNews.map((news, idx) => `${idx + 1}. ${news.title}\n   摘要: ${news.summary}\n   时间: ${news.publishTime || "未知"}\n`).join("\n")}

【分析要求】
请以专业的视角，进行以下维度的深度分析：

1. **行业分析**：
   - 识别所属行业及其市场地位
   - 分析行业发展趋势和周期性特征
   - 评估行业竞争格局和政策影响

2. **资讯情感分析**：
   - 逐一分析每条资讯的情感倾向（利好/利空/中性）
   - 评估资讯的权威性和影响力
   - 识别关键驱动因素和风险点

3. **多维度趋势研判**：
   - **短期趋势**（1-3个月）：基于市场情绪、资金流向、短期催化剂
   - **中期趋势**（3-12个月）：基于基本面变化、业绩预期、行业景气度
   - **长期趋势**（1-3年）：基于公司战略、行业格局、宏观经济

4. **投资建议**：
   - 明确操作建议（买入/卖出/持有）
   - 提供详细且逻辑清晰的决策理由
   - 评估投资风险等级（低/中/高）
   - 列出关键监控指标和风险提示

【返回格式】
请严格按照以下 JSON 格式返回分析结果：
{
  "industry": "行业名称",
  "news": [
    {
      "title": "资讯标题",
      "url": "资讯链接",
      "summary": "精炼摘要",
      "sentiment": "positive|negative|neutral",
      "publishTime": "YYYY-MM-DD"
    }
  ],
  "suggestions": {
    "action": "buy|sell|hold",
    "reason": "详细的决策理由，包括支撑逻辑、关键数据、风险考量",
    "riskLevel": "low|medium|high"
  },
  "trends": {
    "shortTerm": "短期趋势分析，包含具体判断依据和预期",
    "mediumTerm": "中期趋势分析，包含基本面评估和业绩预期",
    "longTerm": "长期趋势分析，包含战略价值和成长逻辑"
  }
}

【注意事项】
- 确保所有分析基于提供的资讯内容，避免无依据的猜测
- 提供具体的数据支撑和逻辑推理过程
- 平衡乐观与风险，客观评估投资价值
- 使用专业但易懂的语言进行表述

请开始你的深度分析：`;

    const llmResponse = await llmClient.invoke(
      [{ role: "user", content: analysisPrompt }],
      {
        model: "deepseek-v3-2-251201",
        temperature: 0.5,
      },
      undefined,
      customHeaders
    );

    // 解析 LLM 返回的 JSON
    let analysisResult: AnalysisContent;
    try {
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(llmResponse.content);
      }
    } catch (e) {
      // 如果解析失败，创建基本结构
      analysisResult = {
        stockCode,
        stockName,
        news: allNews.slice(0, 10),
        suggestions: {
          action: "hold",
          reason: "无法生成详细分析，建议观望",
          riskLevel: "medium",
        },
        trends: {
          shortTerm: "信息不足，无法判断",
          mediumTerm: "信息不足，无法判断",
          longTerm: "信息不足，无法判断",
        },
      };
    }

    // 确保 stockCode 和 stockName 正确
    analysisResult.stockCode = stockCode;
    analysisResult.stockName = stockName;

    // 第三步：使用快速接口获取实时股价
    let currentPrice: string | null = null;

    try {
      // 调用快速股价接口
      const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/stocks/price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCode,
          stockName,
        }),
      });

      const priceData = await priceResponse.json();
      if (priceData.success && priceData.currentPrice) {
        currentPrice = priceData.currentPrice;
      }
    } catch (error) {
      console.error("获取股价失败:", error);
    }

    // 第四步：保存分析结果到数据库
    // 先获取或创建持仓记录
    let holding = await holdingManager.getHoldingByCode(stockCode);

    if (!holding) {
      // 创建新持仓记录
      holding = await holdingManager.createHolding({
        stockCode,
        stockName,
        shares: 0,
        costPrice: "0",
      });
    }

    // 如果获取到了股价，更新持仓的 currentPrice
    if (currentPrice) {
      await holdingManager.updateHolding(holding.id, {
        currentPrice,
      });
    }

    // 保存分析记录
    await holdingManager.createAnalysisRecord({
      holdingId: holding.id,
      analysisType,
      content: analysisResult,
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      holdingId: holding.id,
      currentPrice,
    });
  } catch (error) {
    console.error("股票分析失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "分析失败，请重试",
      },
      { status: 500 }
    );
  }
}
