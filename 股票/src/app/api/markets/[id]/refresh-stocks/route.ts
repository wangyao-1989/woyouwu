import { NextRequest, NextResponse } from "next/server";
import { SearchClient, Config, HeaderUtils, LLMClient } from "coze-coding-dev-sdk";
import { marketManager } from "@/storage/database/marketManager";

interface ParsedStock {
  stockCode: string;
  stockName: string;
  description: string;
  link: string;
  relevanceScore: number; // 相关性评分 1-10
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const market = await marketManager.getMarketById(id);

    if (!market) {
      return NextResponse.json(
        { success: false, error: "板块不存在" },
        { status: 404 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const searchClient = new SearchClient(new Config(), customHeaders);
    const llmClient = new LLMClient(new Config(), customHeaders);

    console.log(`[RefreshStocks] 开始刷新板块: ${market.name}`);

    // 1. 使用 Web Search 搜索概念股
    const searchQuery = `${market.name}概念股龙头 A股 相关上市公司名单`;
    console.log(`[RefreshStocks] 搜索查询: ${searchQuery}`);

    const searchResponse = await searchClient.webSearch(searchQuery, 10, true);

    if (!searchResponse.web_items || searchResponse.web_items.length === 0) {
      return NextResponse.json({
        success: false,
        error: "未找到相关股票信息",
      });
    }

    console.log(`[RefreshStocks] 找到 ${searchResponse.web_items.length} 条搜索结果`);

    // 2. 使用 LLM 从搜索结果中提取股票信息
    const searchContent = searchResponse.web_items
      .map((item, index) => `[${index + 1}] ${item.title}\n${item.snippet}\n${item.summary || ""}`)
      .join("\n\n");

    const extractPrompt = `你是一个专业的A股分析师。请从以下搜索结果中，提取与"${market.name}"概念**高度相关**的A股上市公司。

【重要规则】
1. **相关性要求**：只提取主营业务直接涉及"${market.name}"的公司，不要提取只是"布局"、"涉足"的公司
2. **纯度优先**：优先选择核心业务就是${market.name}的公司，而非多元化公司
3. **必须是A股**：股票代码必须是6位数字，以000、001、002、003、300、301、600、601、603、605、688开头
4. **产业链环节**：根据公司业务判断其在产业链中的位置（如：raw_material原料供应、production生产制造、design研发设计、sales销售渠道、service配套服务、chip芯片、equipment设备等）

【板块描述】
${market.description}

【搜索结果】
${searchContent}

请返回JSON格式（只返回JSON，不要其他文字）：
{
  "stocks": [
    {
      "stockCode": "股票代码",
      "stockName": "股票名称",
      "description": "公司描述（30字以内，说明与${market.name}的关系）",
      "link": "产业链环节（英文）",
      "relevanceScore": 10
    }
  ]
}

注意：relevanceScore表示相关性评分（1-10分），10分表示核心业务，5分以下表示边缘业务。只返回relevanceScore >= 6的公司。`;

    console.log(`[RefreshStocks] 调用 LLM 提取股票信息...`);

    const llmResponse = await llmClient.invoke(
      [{ role: "user", content: extractPrompt }],
      {
        model: "deepseek-v3-2-251201",
        temperature: 0.3,
      }
    );

    let parsedStocks: ParsedStock[] = [];
    
    try {
      // 提取 JSON
      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        parsedStocks = result.stocks || [];
      }
    } catch (parseError) {
      console.error("[RefreshStocks] JSON 解析失败:", parseError);
      return NextResponse.json({
        success: false,
        error: "无法解析股票信息",
      });
    }

    console.log(`[RefreshStocks] 提取到 ${parsedStocks.length} 只股票`);

    if (parsedStocks.length === 0) {
      return NextResponse.json({
        success: false,
        error: "未提取到有效股票信息",
      });
    }

    // 3. 删除旧的股票记录
    const existingCompanies = await marketManager.getCompaniesByMarket(id);
    for (const company of existingCompanies) {
      await marketManager.deleteCompany(company.id);
    }
    console.log(`[RefreshStocks] 已删除 ${existingCompanies.length} 条旧记录`);

    // 4. 插入新的股票记录（按相关性排序）
    const sortedStocks = parsedStocks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const createdCompanies = [];

    for (const stock of sortedStocks.slice(0, 8)) { // 最多保留8只
      try {
        const company = await marketManager.createCompany({
          marketId: id,
          stockCode: stock.stockCode,
          stockName: stock.stockName,
          description: stock.description,
          link: stock.link || "production",
          marketCap: "0",
        });
        createdCompanies.push({
          ...company,
          relevanceScore: stock.relevanceScore,
        });
        console.log(`[RefreshStocks] 创建: ${stock.stockName}(${stock.stockCode}) - 相关性:${stock.relevanceScore}`);
      } catch (createError) {
        console.error(`[RefreshStocks] 创建失败: ${stock.stockName}`, createError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功更新 ${createdCompanies.length} 只股票`,
      market: market.name,
      stocks: createdCompanies,
      searchSummary: searchResponse.summary,
    });

  } catch (error) {
    console.error("[RefreshStocks] 刷新股票失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "刷新股票失败",
      },
      { status: 500 }
    );
  }
}
