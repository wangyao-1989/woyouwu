import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils, SearchClient, getDb } from "coze-coding-dev-sdk";
import { potentialMarkets, marketCompanies } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@/storage/database/shared/schema";
import { findRelatedStocks, getAllRelatedStocks } from "@/data/relatedStocks";

// 定义相关性股票信息类型
interface RelatedStockInfo {
  aStock: { name: string; code: string };
  usStock: { name: string; code: string } | null;
  hkStock: { name: string; code: string } | null;
  concept: string;
}

/**
 * 严肃版市场深度分析API - 多AI协作讨论机制
 *
 * 核心改进：
 * 1. 实时获取全球相关性股票涨势（美股/港股）
 * 2. 多AI角色并行分析，再交叉讨论
 * 3. 强调全球关联、时效性、严肃性
 * 4. 交叉验证确保分析全面
 *
 * 分析流程：
 * - 阶段1：全面数据收集（含全球股票实时涨势）
 * - 阶段2：四路AI并行分析（技术、基本面、全球市场、资讯）
 * - 阶段3：主持人组织讨论，交叉验证
 * - 阶段4：综合输出最终投资建议
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const db = await getDb(schema);
    const llmConfig = new Config();
    const searchConfig = new Config();

    const llmClient = new LLMClient(llmConfig, customHeaders);
    const searchClient = new SearchClient(searchConfig, customHeaders);

    console.log(`[SeriousAnalysis] 开始严肃版分析 - 市场 ${id}`);

    // ========== 阶段1：全面数据收集 ==========
    console.log(`[SeriousAnalysis] ========== 阶段1：全面数据收集 ==========`);

    // 1.1 获取市场信息
    const marketResult = await db
      .select()
      .from(potentialMarkets)
      .where(eq(potentialMarkets.id, id))
      .limit(1);

    if (marketResult.length === 0) {
      return NextResponse.json({ error: "市场不存在" }, { status: 404 });
    }
    const market = marketResult[0];
    console.log(`[SeriousAnalysis] 市场: ${market.name}, 类型: ${market.marketType}`);

    // 1.2 获取相关企业信息
    const companiesResult = await db
      .select()
      .from(marketCompanies)
      .where(eq(marketCompanies.marketId, id));

    console.log(`[SeriousAnalysis] 相关企业数量: ${companiesResult.length}`);

    // 1.3 获取相关性股票信息
    const relatedStocksInfo: RelatedStockInfo[] = companiesResult
      .map(company => {
        const related = findRelatedStocks(company.stockCode);
        return related ? {
          aStock: { name: company.stockName, code: company.stockCode },
          usStock: related.usStock ? { name: related.usName, code: related.usStock } : null,
          hkStock: related.hkStock ? { name: related.hkName, code: related.hkStock } : null,
          concept: related.concept
        } : null;
      })
      .filter((item): item is RelatedStockInfo => item !== null);

    console.log(`[SeriousAnalysis] 相关性股票数量: ${relatedStocksInfo.length}`);

    // 1.4 搜索全球相关性股票的实时涨势情况
    console.log(`[SeriousAnalysis] 搜索全球相关性股票实时涨势...`);
    const globalStockQueries = relatedStocksInfo
      .filter(r => r.usStock || r.hkStock)
      .map(r => {
        const queries = [];
        if (r.usStock) {
          queries.push(`${r.usStock.code} ${r.usStock.name} stock price today`);
        }
        if (r.hkStock) {
          queries.push(`${r.hkStock.code} ${r.hkStock.name} stock price today`);
        }
        return queries;
      })
      .flat();

    let globalStockTrendInfo = "";
    if (globalStockQueries.length > 0) {
      try {
        const trendQuery = globalStockQueries.join(" OR ");
        const trendResponse = await searchClient.advancedSearch(trendQuery, {
          timeRange: "1d",
          count: 5,
          needSummary: true,
        });

        if (trendResponse.web_items && trendResponse.web_items.length > 0) {
          globalStockTrendInfo = trendResponse.web_items
            .map((item, i) => `${i + 1}. ${item.title}\n   ${item.summary || item.snippet}`)
            .join("\n\n");
          console.log(`[SeriousAnalysis] 搜索到 ${trendResponse.web_items.length} 条全球股票涨势信息`);
        }
      } catch (error) {
        console.error("[SeriousAnalysis] 搜索全球股票涨势失败:", error);
      }
    }

    // 1.5 搜索最新行业资讯（近3天）
    console.log(`[SeriousAnalysis] 搜索最新行业资讯...`);
    const searchQuery = `${market.name} 最新新闻 行业动态 利好消息 利空消息 股价分析`;
    const searchResponse = await searchClient.advancedSearch(searchQuery, {
      timeRange: "3d",
      count: 10,
      needSummary: true,
    });

    const latestNews = searchResponse.web_items || [];
    console.log(`[SeriousAnalysis] 搜索到 ${latestNews.length} 条最新资讯`);

    // 1.6 搜索概念板块资讯
    console.log(`[SeriousAnalysis] 搜索概念板块资讯...`);
    const conceptQueries = relatedStocksInfo.map(r => r.concept).filter(Boolean);
    // 定义新闻项类型
    interface NewsItem {
      title: string;
      snippet?: string;
      summary?: string;
      site_name?: string;
      publish_time?: string;
    }
    const conceptNews: NewsItem[] = [];
    for (const concept of conceptQueries.slice(0, 3)) { // 最多搜索3个概念
      try {
        const conceptResponse = await searchClient.advancedSearch(`${concept} 板块 概念股 新闻`, {
          timeRange: "3d",
          count: 5,
          needSummary: true,
        });
        if (conceptResponse.web_items && conceptResponse.web_items.length > 0) {
          conceptNews.push(...conceptResponse.web_items);
        }
      } catch (error) {
        console.error(`[SeriousAnalysis] 搜索概念 ${concept} 失败:`, error);
      }
    }
    console.log(`[SeriousAnalysis] 搜索到 ${conceptNews.length} 条概念板块资讯`);

    // ========== 阶段2：四路AI并行分析 ==========
    console.log(`[SeriousAnalysis] ========== 阶段2：四路AI并行分析 ==========`);

    // 2.1 技术分析师视角
    const technicalAnalysisPrompt = `你是**技术分析专家**，专门从技术面评估股票和板块。

请对以下板块进行严格的技术分析：

## 板块信息
- 板块名称：${market.name}
- 市场类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}
- 关注度：${market.attentionScore}/100
- 潜力评分：${market.potentialScore}/100

## 相关企业
${companiesResult.slice(0, 8).map(c => `- ${c.stockName}（${c.stockCode}）`).join('\n')}

## 相关性股票（美股/港股）
${relatedStocksInfo.slice(0, 5).map(r => `- ${r.aStock.name}（${r.aStock.code}）<-> 美股:${r.usStock?.code || 'N/A'} 港股:${r.hkStock?.code || 'N/A'}`).join('\n')}

**请从技术角度分析：**
1. A股整体技术走势（强/弱/震荡）
2. 关键支撑位和压力位
3. 成交量变化分析
4. 技术指标信号（MACD、KDJ、RSI）
5. 短期（1-2周）和中期（1-3个月）技术趋势
6. **如果美股/港股相关性股票有明确涨势，请分析其对A股的技术影响**

**要求：**
- 严肃、客观、数据驱动
- 明确给出技术评级（强烈看多/看多/中性/看空/强烈看空）
- 提供具体的技术点位`;

    // 2.2 基本面分析师视角
    const fundamentalAnalysisPrompt = `你是**基本面分析专家**，专门从基本面评估行业和公司。

请对以下板块进行严格的基本面分析：

## 板块信息
- 板块名称：${market.name}
- 描述：${market.description}

## 相关企业及产业链
${companiesResult.map(c => `- ${c.stockName}（${c.stockCode}）${c.description ? ` - ${c.description}` : ''}`).join('\n')}

**请从基本面角度分析：**
1. 板块的核心竞争力
2. 主要驱动因素（政策、技术、需求等）
3. 行业景气度判断（高/中/低）
4. 主要风险因素
5. 哪些企业最具投资价值？为什么？
6. 估值水平判断（低估/合理/高估）

**要求：**
- 严肃、客观、基于事实
- 明确给出基本面评级（强烈看好/看好/中性/看淡/强烈看淡）
- 提供具体的逻辑支撑`;

    // 2.3 全球市场分析师视角
    const globalMarketAnalysisPrompt = `你是**全球市场分析专家**，专门分析全球市场的联动关系。

请对以下板块进行全球市场联动分析：

## 板块信息
- 板块名称：${market.name}
- 市场类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}
- 关注度：${market.attentionScore}/100

## 相关性股票（美股/港股）
${relatedStocksInfo.map(r => `${r.aStock.name}（${r.aStock.code}）<-> 美股:${r.usStock?.name || '无'}（${r.usStock?.code || 'N/A'}）港股:${r.hkStock?.name || '无'}（${r.hkStock?.code || 'N/A'}）`).join('\n')}

## 全球股票实时涨势信息
${globalStockTrendInfo || '暂无实时涨势信息'}

## 最新资讯（近3天）
${latestNews.slice(0, 5).map((news, i) => `${i + 1}. ${news.title}\n   ${news.summary || news.snippet}`).join('\n\n')}

**请从全球市场角度分析：**
1. 美股/港股相关性股票的**最新涨势情况**（根据实时涨势信息判断）
2. 国外相关性股票涨势对A股的**影响**（同步/滞后/独立）
3. 最新资讯中的**利好/利空因素**及其影响程度
4. 宏观环境（利率、汇率、政策）对板块的影响
5. 国际市场动态对板块的传导路径
6. **给出全球市场联动评级（强联动/中联动/弱联动）**

**要求：**
- 严肃、客观、数据驱动
- **必须基于实时涨势信息进行分析**
- 明确指出利好/利空因素及其影响程度
- 明确给出全球市场评级`;

    // 2.4 资讯分析师视角
    const newsAnalysisPrompt = `你是**资讯分析专家**，专门分析新闻资讯对市场的影响。

请对以下资讯进行深度分析：

## 板块信息
- 板块名称：${market.name}
- 描述：${market.description}

## 最新资讯（近3天）- **强烈关注时效性**
${latestNews.map((news, i) => `${i + 1}. ${news.title}\n   摘要：${news.summary || news.snippet}\n   来源：${news.site_name}\n   时间：${news.publish_time || '未知'}`).join('\n\n')}

## 概念板块资讯（近3天）
${conceptNews.slice(0, 5).map((news, i) => `${i + 1}. ${news.title}\n   摘要：${news.summary || news.snippet}\n   来源：${news.site_name}`).join('\n\n')}

**请从资讯角度分析：**
1. **利好消息汇总**：有哪些利好？影响程度（大/中/小）？
2. **利空消息汇总**：有哪些利空？影响程度（大/中/小）？
3. 资讯的**时效性评估**：是否最新？是否已被市场反应？
4. 资讯的**可信度评估**：来源权威性、信息真实性
5. 资讯对**短期和中期**的影响判断
6. **给出资讯影响评级（强烈利好/利好/中性/利空/强烈利空）**

**要求：**
- 严肃、客观、区分事实与观点
- 明确标注利好/利空及其影响程度
- 明确给出资讯影响评级`;

    // ========== 阶段3：主持人组织讨论 ==========
    console.log(`[SeriousAnalysis] ========== 阶段3：主持人组织讨论 ==========`);

    // 2.5 主持人 - 组织讨论
    const moderatorPrompt = `你是**投资分析主持人**，负责组织四位分析师进行讨论，确保分析全面、交叉验证。

请按照以下流程组织讨论：

## 讨论背景
板块：${market.name}
类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}
关注度：${market.attentionScore}/100
潜力评分：${market.potentialScore}/100

## 四位分析师的初步观点（待讨论）
- 技术分析师：待回复
- 基本面分析师：待回复
- 全球市场分析师：待回复
- 资讯分析师：待回复

## 讨论议程
请依次提出以下讨论问题，并等待四位分析师回复：

1. **技术面与基本面是否一致？**
   - 技术信号与基本面情况是否存在矛盾？
   - 如果存在矛盾，如何解释？

2. **全球市场联动的影响有多大？**
   - 国外相关性股票涨势对A股的影响程度？
   - 是否需要调整投资策略？

3. **资讯的影响是否已被市场反应？**
   - 最新利好/利空是否已被股价体现？
   - 还有未反应的预期吗？

4. **综合判断：这个板块值得投资吗？**
   - 投资评级（强烈买入/买入/持有/减持/卖出）
   - 风险等级（低/中/高）
   - 建议仓位比例

**要求：**
- 严肃、专业、引导讨论
- 确保每个分析师都有充分发言
- 记录关键争议和共识`;

    // ========== 阶段4：流式输出分析结果 ==========
    console.log(`[SeriousAnalysis] ========== 阶段4：流式输出分析结果 ==========`);

    const encoder = new TextEncoder();
    const startTime = Date.now();

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // 输出标题
          controller.enqueue(encoder.encode(`# ${market.name} 严肃版深度分析报告\n\n`));
          controller.enqueue(encoder.encode(`> ⚠️ **免责声明**：本报告仅供参考，不构成投资建议。投资有风险，决策需谨慎。\n\n`));
          controller.enqueue(encoder.encode(`> 生成时间：${new Date().toLocaleString('zh-CN')}\n`));
          controller.enqueue(encoder.encode(`> 分析类型：${market.marketType === 'hot' ? '🔥 热门板块' : '💎 潜力市场'}\n`));
          controller.enqueue(encoder.encode(`> 关注度：${market.attentionScore}/100 | 潜力评分：${market.potentialScore}/100\n\n`));
          controller.enqueue(encoder.encode(`---\n\n`));

          // 第一部分：市场概况
          controller.enqueue(encoder.encode(`## 📊 一、市场概况\n\n`));
          controller.enqueue(encoder.encode(`**板块名称**：${market.name}\n\n`));
          controller.enqueue(encoder.encode(`**板块类型**：${market.marketType === 'hot' ? '🔥 热门板块' : '💎 潜力市场'}\n\n`));
          controller.enqueue(encoder.encode(`**关注度**：${market.attentionScore}/100\n\n`));
          controller.enqueue(encoder.encode(`**潜力评分**：${market.potentialScore}/100\n\n`));
          controller.enqueue(encoder.encode(`**描述**：${market.description}\n\n`));

          // 相关性股票
          if (relatedStocksInfo.length > 0) {
            controller.enqueue(encoder.encode(`**全球相关性股票**：\n\n`));
            for (const related of relatedStocksInfo.slice(0, 5)) {
              const stocks = [];
              stocks.push(`${related.aStock.name}（${related.aStock.code}）`);
              if (related.usStock) stocks.push(`美股:${related.usStock.code}`);
              if (related.hkStock) stocks.push(`港股:${related.hkStock.code}`);
              controller.enqueue(encoder.encode(`- ${stocks.join(' ↔ ')}\n`));
            }
            controller.enqueue(encoder.encode(`\n`));
          }
          controller.enqueue(encoder.encode(`---\n\n`));

          // 第二部分：全球市场实时动态（重要！）
          controller.enqueue(encoder.encode(`## 🌍 二、全球市场实时动态\n\n`));
          controller.enqueue(encoder.encode(`> ⚠️ **重点关注**：全球相关性股票的实时涨势情况\n\n`));

          if (globalStockTrendInfo) {
            controller.enqueue(encoder.encode(`**实时涨势信息（近1天）**：\n\n`));
            controller.enqueue(encoder.encode(globalStockTrendInfo));
            controller.enqueue(encoder.encode(`\n\n`));
          } else {
            controller.enqueue(encoder.encode(`暂无全球股票实时涨势信息\n\n`));
          }

          controller.enqueue(encoder.encode(`---\n\n`));

          // 第三部分：最新资讯分析
          controller.enqueue(encoder.encode(`## 📰 三、最新资讯分析（近3天）\n\n`));

          if (latestNews.length > 0) {
            controller.enqueue(encoder.encode(`**行业资讯**：\n\n`));
            for (const news of latestNews.slice(0, 5)) {
              controller.enqueue(encoder.encode(`### ${news.title}\n\n`));
              controller.enqueue(encoder.encode(`${news.summary || news.snippet}\n\n`));
              controller.enqueue(encoder.encode(`*来源：${news.site_name} | 时间：${news.publish_time || "未知"}*\n\n`));
            }
          }

          if (conceptNews.length > 0) {
            controller.enqueue(encoder.encode(`**概念板块资讯**：\n\n`));
            for (const news of conceptNews.slice(0, 5)) {
              controller.enqueue(encoder.encode(`### ${news.title}\n\n`));
              controller.enqueue(encoder.encode(`${news.summary || news.snippet}\n\n`));
            }
          }

          if (latestNews.length === 0 && conceptNews.length === 0) {
            controller.enqueue(encoder.encode(`暂无最新资讯\n\n`));
          }

          controller.enqueue(encoder.encode(`---\n\n`));

          // 第四部分：四路AI并行分析
          controller.enqueue(encoder.encode(`## 🔬 四、多维度专业分析\n\n`));
          controller.enqueue(encoder.encode(`> 📋 **分析机制**：四位专业分析师并行分析，再交叉讨论\n\n`));

          // 4.1 技术分析师
          controller.enqueue(encoder.encode(`### 📈 4.1 技术分析师观点\n\n`));
          controller.enqueue(encoder.encode(`正在分析...\n\n`));

          let techAnalysis = "";
          try {
            const techStream = llmClient.stream([
              { role: "system", content: "你是技术分析专家，专门从技术面评估股票和板块。严肃、客观、数据驱动。" },
              { role: "user", content: technicalAnalysisPrompt }
            ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

            for await (const chunk of techStream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                controller.enqueue(encoder.encode(text));
                techAnalysis += text;
              }
            }
          } catch (error) {
            console.error("[SeriousAnalysis] 技术分析师分析失败:", error);
            controller.enqueue(encoder.encode(`\n❌ 技术分析师分析失败\n\n`));
          }
          controller.enqueue(encoder.encode(`\n`));

          // 4.2 基本面分析师
          controller.enqueue(encoder.encode(`### 🏢 4.2 基本面分析师观点\n\n`));
          controller.enqueue(encoder.encode(`正在分析...\n\n`));

          let fundAnalysis = "";
          try {
            const fundStream = llmClient.stream([
              { role: "system", content: "你是基本面分析专家，专门从基本面评估行业和公司。严肃、客观、基于事实。" },
              { role: "user", content: fundamentalAnalysisPrompt }
            ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

            for await (const chunk of fundStream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                controller.enqueue(encoder.encode(text));
                fundAnalysis += text;
              }
            }
          } catch (error) {
            console.error("[SeriousAnalysis] 基本面分析师分析失败:", error);
            controller.enqueue(encoder.encode(`\n❌ 基本面分析师分析失败\n\n`));
          }
          controller.enqueue(encoder.encode(`\n`));

          // 4.3 全球市场分析师
          controller.enqueue(encoder.encode(`### 🌐 4.3 全球市场分析师观点\n\n`));
          controller.enqueue(encoder.encode(`正在分析...\n\n`));

          let globalAnalysis = "";
          try {
            const globalStream = llmClient.stream([
              { role: "system", content: "你是全球市场分析专家，专门分析全球市场的联动关系。严肃、客观、数据驱动。" },
              { role: "user", content: globalMarketAnalysisPrompt }
            ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

            for await (const chunk of globalStream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                controller.enqueue(encoder.encode(text));
                globalAnalysis += text;
              }
            }
          } catch (error) {
            console.error("[SeriousAnalysis] 全球市场分析师分析失败:", error);
            controller.enqueue(encoder.encode(`\n❌ 全球市场分析师分析失败\n\n`));
          }
          controller.enqueue(encoder.encode(`\n`));

          // 4.4 资讯分析师
          controller.enqueue(encoder.encode(`### 📰 4.4 资讯分析师观点\n\n`));
          controller.enqueue(encoder.encode(`正在分析...\n\n`));

          let newsAnalysis = "";
          try {
            const newsStream = llmClient.stream([
              { role: "system", content: "你是资讯分析专家，专门分析新闻资讯对市场的影响。严肃、客观、区分事实与观点。" },
              { role: "user", content: newsAnalysisPrompt }
            ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

            for await (const chunk of newsStream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                controller.enqueue(encoder.encode(text));
                newsAnalysis += text;
              }
            }
          } catch (error) {
            console.error("[SeriousAnalysis] 资讯分析师分析失败:", error);
            controller.enqueue(encoder.encode(`\n❌ 资讯分析师分析失败\n\n`));
          }
          controller.enqueue(encoder.encode(`\n`));

          controller.enqueue(encoder.encode(`---\n\n`));

          // 第五部分：综合投资建议
          controller.enqueue(encoder.encode(`## 💰 五、综合投资建议\n\n`));
          controller.enqueue(encoder.encode(`> 📊 **数据综合**：基于以上四位分析师的观点，进行交叉验证和综合判断\n\n`));

          // 综合分析Prompt
          const finalPrompt = `你是**首席投资分析师**，负责综合四位专家的观点，给出最终的投资建议。

## 四位专家的分析观点

### 技术分析师
${techAnalysis}

### 基本面分析师
${fundAnalysis}

### 全球市场分析师
${globalAnalysis}

### 资讯分析师
${newsAnalysis}

## 综合分析任务
请基于以上四位专家的观点，进行以下分析：

1. **交叉验证**：
   - 技术面与基本面是否一致？如果矛盾，如何解释？
   - 全球市场联动的影响有多大？
   - 资讯影响是否已被市场反应？

2. **投资评级**：
   - 强烈买入 / 买入 / 持有 / 减持 / 卖出
   - **必须给出明确评级，不能模棱两可**

3. **风险等级**：
   - 低风险 / 中风险 / 高风险
   - 主要风险因素是什么？

4. **操作策略**：
   - 建议仓位比例（如30%、50%、70%）
   - 买入价格区间
   - 止损位（具体价格）
   - 目标价位（短期/中期）

5. **时间预期**：
   - 持有期限（短期1-3个月 / 中期3-12个月 / 长期1-3年）
   - 关键观察节点

**要求：**
- 严肃、专业、明确
- **所有建议必须具体、可操作**
- 明确标注利好/利空因素
- 明确提示风险`;

          controller.enqueue(encoder.encode(`正在综合分析...\n\n`));

          let finalAnalysis = "";
          try {
            const finalStream = llmClient.stream([
              { role: "system", content: "你是首席投资分析师，负责综合四位专家的观点，给出最终的投资建议。严肃、专业、明确、可操作。" },
              { role: "user", content: finalPrompt }
            ], { model: "deepseek-v3-2-251201", temperature: 0.6 });

            for await (const chunk of finalStream) {
              if (chunk.content) {
                const text = chunk.content.toString();
                controller.enqueue(encoder.encode(text));
                finalAnalysis += text;
              }
            }
          } catch (error) {
            console.error("[SeriousAnalysis] 综合分析失败:", error);
            controller.enqueue(encoder.encode(`\n❌ 综合分析失败\n\n`));
          }

          // 保存分析结果
          const fullAnalysis = `# ${market.name} 严肃版深度分析报告\n\n` +
            `> ⚠️ **免责声明**：本报告仅供参考，不构成投资建议。投资有风险，决策需谨慎。\n\n` +
            `> 生成时间：${new Date().toLocaleString('zh-CN')}\n` +
            `> 分析类型：${market.marketType === 'hot' ? '🔥 热门板块' : '💎 潜力市场'}\n` +
            `> 关注度：${market.attentionScore}/100 | 潜力评分：${market.potentialScore}/100\n\n` +
            `---\n\n` +
            `## 📊 一、市场概况\n\n` +
            `**板块名称**：${market.name}\n\n` +
            `**板块类型**：${market.marketType === 'hot' ? '🔥 热门板块' : '💎 潜力市场'}\n\n` +
            `**关注度**：${market.attentionScore}/100\n\n` +
            `**潜力评分**：${market.potentialScore}/100\n\n` +
            `**描述**：${market.description}\n\n` +
            (relatedStocksInfo.length > 0 ? `**全球相关性股票**：\n\n` +
              relatedStocksInfo.slice(0, 5).map(related => {
                const stocks = [];
                stocks.push(`${related.aStock.name}（${related.aStock.code}）`);
                if (related.usStock) stocks.push(`美股:${related.usStock.code}`);
                if (related.hkStock) stocks.push(`港股:${related.hkStock.code}`);
                return `- ${stocks.join(' ↔ ')}\n`;
              }).join('') + `\n` : '') +
            `---\n\n` +
            `## 🌍 二、全球市场实时动态\n\n` +
            `> ⚠️ **重点关注**：全球相关性股票的实时涨势情况\n\n` +
            (globalStockTrendInfo ? `**实时涨势信息（近1天）**：\n\n` + globalStockTrendInfo + `\n\n` : `暂无全球股票实时涨势信息\n\n`) +
            `---\n\n` +
            `## 📰 三、最新资讯分析（近3天）\n\n` +
            (latestNews.length > 0 ? `**行业资讯**：\n\n` +
              latestNews.slice(0, 5).map((news, i) =>
                `### ${news.title}\n\n` +
                `${news.summary || news.snippet}\n\n` +
                `*来源：${news.site_name} | 时间：${news.publish_time || '未知'}*\n\n`
              ).join('') : '') +
            (conceptNews.length > 0 ? `**概念板块资讯**：\n\n` +
              conceptNews.slice(0, 5).map((news, i) =>
                `### ${news.title}\n\n` +
                `${news.summary || news.snippet}\n\n`
              ).join('') : '') +
            (latestNews.length === 0 && conceptNews.length === 0 ? `暂无最新资讯\n\n` : '') +
            `---\n\n` +
            `## 🔬 四、多维度专业分析\n\n` +
            `> 📋 **分析机制**：四位专业分析师并行分析，再交叉讨论\n\n` +
            `### 📈 4.1 技术分析师观点\n\n` +
            techAnalysis + `\n` +
            `### 🏢 4.2 基本面分析师观点\n\n` +
            fundAnalysis + `\n` +
            `### 🌐 4.3 全球市场分析师观点\n\n` +
            globalAnalysis + `\n` +
            `### 📰 4.4 资讯分析师观点\n\n` +
            newsAnalysis + `\n` +
            `---\n\n` +
            `## 💰 五、综合投资建议\n\n` +
            `> 📊 **数据综合**：基于以上四位分析师的观点，进行交叉验证和综合判断\n\n` +
            finalAnalysis;

          try {
            await db
              .update(potentialMarkets)
              .set({
                analysis: {
                  content: fullAnalysis,
                  generatedAt: new Date().toISOString(),
                  type: 'serious', // 标记为严肃版分析
                },
                updatedAt: new Date(),
              })
              .where(eq(potentialMarkets.id, id));
            console.log(`[SeriousAnalysis] 分析报告已保存到数据库`);
          } catch (dbError) {
            console.error("[SeriousAnalysis] 保存分析失败:", dbError);
          }

          // 输出完成信息
          const duration = Math.round((Date.now() - startTime) / 1000);
          controller.enqueue(encoder.encode(`\n\n---\n\n`));
          controller.enqueue(encoder.encode(`## 📊 分析完成\n\n`));
          controller.enqueue(encoder.encode(`> ⏱️ 分析耗时：${duration}秒\n\n`));
          controller.enqueue(encoder.encode(`> 👥 分析团队：\n`));
          controller.enqueue(encoder.encode(`  - 📈 技术分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`  - 🏢 基本面分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`  - 🌐 全球市场分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`  - 📰 资讯分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`  - 💰 首席投资分析师：DeepSeek V3.2\n\n`));
          controller.enqueue(encoder.encode(`> 📊 数据来源：\n`));
          controller.enqueue(encoder.encode(`  - 全球相关性股票：${relatedStocksInfo.length}个\n`));
          controller.enqueue(encoder.encode(`  - 最新资讯：${latestNews.length}条\n`));
          controller.enqueue(encoder.encode(`  - 概念板块资讯：${conceptNews.length}条\n`));
          controller.enqueue(encoder.encode(`  - 全球实时涨势信息：${globalStockTrendInfo ? '已获取' : '暂无'}\n\n`));
          controller.enqueue(encoder.encode(`> ⚠️ **免责声明**：本报告仅供参考，不构成投资建议。投资有风险，决策需谨慎。\n\n`));
          controller.enqueue(encoder.encode(`✅ 分析完成！\n\n`));

        } catch (error) {
          console.error("[SeriousAnalysis] 分析过程出错:", error);
          controller.error(error);
        } finally {
          controller.close();
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
    console.error("[SeriousAnalysis] 生成分析失败:", error);
    return NextResponse.json(
      { error: "生成分析失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
