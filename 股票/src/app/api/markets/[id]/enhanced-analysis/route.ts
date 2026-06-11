import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils, SearchClient, getDb } from "coze-coding-dev-sdk";
import { potentialMarkets, marketCompanies } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import * as schema from "@/storage/database/shared/schema";
import { findRelatedStocks } from "@/data/relatedStocks";

// 定义相关性股票信息类型
interface RelatedStockInfo {
  aStock: { name: string; code: string };
  usStock: { name: string; code: string } | null;
  hkStock: { name: string; code: string } | null;
  concept: string;
}

/**
 * 增强版市场分析API
 * 
 * 功能：
 * 1. 获取市场和企业信息
 * 2. 获取相关性股票数据（美股、港股）
 * 3. 搜索最新行业资讯和新闻
 * 4. 多AI角色讨论分析（技术、基本面、市场）
 * 5. 生成综合分析报告
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

    console.log(`[EnhancedAnalysis] 开始分析市场 ${id}`);

    // ========== 阶段1：数据收集 ==========
    console.log(`[EnhancedAnalysis] 阶段1：数据收集`);

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

    // 1.2 获取相关企业信息
    const companiesResult = await db
      .select()
      .from(marketCompanies)
      .where(eq(marketCompanies.marketId, id));

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

    console.log(`[EnhancedAnalysis] 相关性股票信息:`, relatedStocksInfo);

    // 1.4 搜索最新行业资讯
    console.log(`[EnhancedAnalysis] 开始搜索 ${market.name} 的最新资讯`);
    const searchQuery = `${market.name} 最新新闻 行业动态 股价分析`;
    const searchResponse = await searchClient.advancedSearch(searchQuery, {
      timeRange: "3d",
      count: 5,
      needSummary: true,
    });

    const latestNews = searchResponse.web_items || [];
    console.log(`[EnhancedAnalysis] 搜索到 ${latestNews.length} 条资讯`);

    // ========== 阶段2：多AI角色分析 ==========
    console.log(`[EnhancedAnalysis] 阶段2：多AI角色分析`);

    // 2.1 技术分析师视角
    const technicalAnalysisPrompt = `你是一位专业的技术分析师，擅长分析股票价格走势和技术指标。

请从技术分析角度评估以下板块：

## 市场信息
- 板块名称：${market.name}
- 市场类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}
- 关注度：${market.attentionScore}/100
- 潜力评分：${market.potentialScore}/100
- 描述：${market.description}

## 相关企业
${companiesResult.slice(0, 5).map(c => `- ${c.stockName}（${c.stockCode}）`).join('\n')}

## 相关性股票（美股/港股）
${relatedStocksInfo.map(r => `- ${r.aStock.name}（${r.aStock.code}）<-> ${r.usStock?.name || '无美股对标'}（${r.usStock?.code || 'N/A'}）`).join('\n')}

请从技术分析角度回答：
1. 板块整体技术走势如何？（强/弱/震荡）
2. 关键支撑位和压力位在哪里？
3. 成交量变化说明了什么？
4. 技术指标（如MACD、KDJ、RSI）显示什么信号？
5. 短期（1-2周）和中期（1-3个月）技术趋势预测`;

    // 2.2 基本面分析师视角
    const fundamentalAnalysisPrompt = `你是一位专业的基本面分析师，擅长分析公司财务、行业地位和竞争优势。

请从基本面分析角度评估以下板块：

## 市场信息
- 板块名称：${market.name}
- 描述：${market.description}

## 相关企业及产业链
${companiesResult.map(c => `- ${c.stockName}（${c.stockCode}）${c.description ? ` - ${c.description}` : ''}`).join('\n')}

请从基本面分析角度回答：
1. 板块的核心竞争力是什么？
2. 主要驱动因素有哪些？（政策、技术、需求等）
3. 行业景气度如何？（高/中/低）
4. 主要风险是什么？
5. 哪些企业最具投资价值？为什么？`;

    // 2.3 市场分析师视角（包含最新资讯）
    const marketAnalysisPrompt = `你是一位专业的市场分析师，擅长分析宏观环境、政策影响和国际市场动态。

请从市场分析角度评估以下板块：

## 市场信息
- 板块名称：${market.name}
- 市场类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}
- 关注度：${market.attentionScore}/100
- 潜力评分：${market.potentialScore}/100

## 相关性股票（美股/港股）
${relatedStocksInfo.map(r => `${r.aStock.name}（${r.aStock.code}）<-> ${r.usStock?.name || '无美股对标'}（${r.usStock?.code || 'N/A'}）`).join('\n')}

## 最新资讯（近3天）
${latestNews.length > 0 ? latestNews.map((news, i) => `${i + 1}. ${news.title}\n   ${news.summary || news.snippet}`).join('\n\n') : '暂无最新资讯'}

请从市场分析角度回答：
1. 国内外相关性股票走势如何？对A股有什么影响？
2. 最新资讯中有哪些利好/利空因素？
3. 宏观环境（利率、汇率、政策等）对这个板块的影响？
4. 国际市场动态（如美股、港股）对这个板块的影响？
5. 当前这个板块处于什么阶段？（底部启动/上升期/高潮期/回调期）`;

    // 2.4 综合分析师（负责总结和给出投资建议）
    const summaryAnalysisPrompt = `你是一位资深的投资策略分析师，负责综合多个分析师的观点，给出最终的投资建议。

以下是三个分析师的观点：

## 技术分析师观点
请等待技术分析师输出...

## 基本面分析师观点
请等待基本面分析师输出...

## 市场分析师观点
请等待市场分析师输出...

## 板块基本信息
- 名称：${market.name}
- 类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}
- 关注度：${market.attentionScore}/100
- 潜力评分：${market.potentialScore}/100

请综合以上观点，给出：
1. **综合评价**：这个板块目前值不值得投资？
2. **投资建议**：买入/增持/持有/减持/卖出
3. **风险提示**：有哪些需要特别注意的风险？
4. **操作策略**：什么价格买入？止损位？目标价位？
5. **时间预期**：持有期限？（短期/中期/长期）

请给出明确、可操作的建议，不要模棱两可。`;

    // ========== 阶段3：流式输出分析结果 ==========
    console.log(`[EnhancedAnalysis] 阶段3：生成分析报告`);
    const encoder = new TextEncoder();
    const startTime = Date.now();

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          // 输出标题
          controller.enqueue(encoder.encode(`# ${market.name} 深度分析报告\n\n`));
          controller.enqueue(encoder.encode(`> 生成时间：${new Date().toLocaleString('zh-CN')}\n`));
          controller.enqueue(encoder.encode(`> 分析类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}\n\n`));
          controller.enqueue(encoder.encode(`---\n\n`));

          // 第一部分：市场概况
          controller.enqueue(encoder.encode(`## 📊 市场概况\n\n`));
          controller.enqueue(encoder.encode(`**板块名称**：${market.name}\n\n`));
          controller.enqueue(encoder.encode(`**市场类型**：${market.marketType === 'hot' ? '🔥 热门板块' : '💎 潜力市场'}\n\n`));
          controller.enqueue(encoder.encode(`**关注度**：${market.attentionScore}/100\n\n`));
          controller.enqueue(encoder.encode(`**潜力评分**：${market.potentialScore}/100\n\n`));
          controller.enqueue(encoder.encode(`**描述**：${market.description}\n\n`));
          controller.enqueue(encoder.encode(`---\n\n`));

          // 第二部分：最新资讯
          controller.enqueue(encoder.encode(`## 📰 最新资讯（近3天）\n\n`));
          if (latestNews.length > 0) {
            for (const news of latestNews) {
              controller.enqueue(encoder.encode(`### ${news.title}\n\n`));
              controller.enqueue(encoder.encode(`${news.summary || news.snippet}\n\n`));
              controller.enqueue(encoder.encode(`*来源：${news.site_name} | 发布时间：${news.publish_time || '未知'}*\n\n`));
            }
          } else {
            controller.enqueue(encoder.encode(`暂无最新资讯\n\n`));
          }
          controller.enqueue(encoder.encode(`---\n\n`));

          // 第三部分：相关性股票对比
          controller.enqueue(encoder.encode(`## 🌍 国内外相关性股票对比\n\n`));
          if (relatedStocksInfo.length > 0) {
            for (const related of relatedStocksInfo) {
              controller.enqueue(encoder.encode(`### ${related.aStock.name}（${related.aStock.code}）\n\n`));
              if (related.usStock) {
                controller.enqueue(encoder.encode(`- **美股对标**：${related.usStock.name}（${related.usStock.code}）\n\n`));
              }
              if (related.hkStock) {
                controller.enqueue(encoder.encode(`- **港股对标**：${related.hkStock.name}（${related.hkStock.code}）\n\n`));
              }
              controller.enqueue(encoder.encode(`- **所属概念**：${related.concept}\n\n`));
            }
          } else {
            controller.enqueue(encoder.encode(`暂无相关性股票数据\n\n`));
          }
          controller.enqueue(encoder.encode(`---\n\n`));

          // 第四部分：技术分析
          controller.enqueue(encoder.encode(`## 📈 技术分析\n\n`));
          controller.enqueue(encoder.encode(`正在进行技术分析...\n\n`));
          
          const techStream = llmClient.stream([
            { role: "system", content: "你是一位专业的技术分析师，擅长分析股票价格走势和技术指标。" },
            { role: "user", content: technicalAnalysisPrompt }
          ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

          let techAnalysis = "";
          for await (const chunk of techStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
              techAnalysis += text;
            }
          }
          controller.enqueue(encoder.encode(`\n\n---\n\n`));

          // 第五部分：基本面分析
          controller.enqueue(encoder.encode(`## 🏢 基本面分析\n\n`));
          controller.enqueue(encoder.encode(`正在进行基本面分析...\n\n`));

          const fundStream = llmClient.stream([
            { role: "system", content: "你是一位专业的基本面分析师，擅长分析公司财务、行业地位和竞争优势。" },
            { role: "user", content: fundamentalAnalysisPrompt }
          ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

          let fundAnalysis = "";
          for await (const chunk of fundStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
              fundAnalysis += text;
            }
          }
          controller.enqueue(encoder.encode(`\n\n---\n\n`));

          // 第六部分：市场分析
          controller.enqueue(encoder.encode(`## 🌐 市场分析（含最新资讯）\n\n`));
          controller.enqueue(encoder.encode(`正在进行市场分析...\n\n`));

          const marketStream = llmClient.stream([
            { role: "system", content: "你是一位专业的市场分析师，擅长分析宏观环境、政策影响和国际市场动态。" },
            { role: "user", content: marketAnalysisPrompt }
          ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

          let marketAnalysis = "";
          for await (const chunk of marketStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
              marketAnalysis += text;
            }
          }
          controller.enqueue(encoder.encode(`\n\n---\n\n`));

          // 第七部分：综合投资建议
          controller.enqueue(encoder.encode(`## 💰 综合投资建议\n\n`));
          controller.enqueue(encoder.encode(`正在综合分析...\n\n`));

          const finalPrompt = summaryAnalysisPrompt
            .replace('请等待技术分析师输出...', techAnalysis)
            .replace('请等待基本面分析师输出...', fundAnalysis)
            .replace('请等待市场分析师输出...', marketAnalysis);

          const finalStream = llmClient.stream([
            { role: "system", content: "你是一位资深的投资策略分析师，负责综合多个分析师的观点，给出最终的投资建议。" },
            { role: "user", content: finalPrompt }
          ], { model: "deepseek-v3-2-251201", temperature: 0.7 });

          let finalAnalysis = "";
          for await (const chunk of finalStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
              finalAnalysis += text;
            }
          }

          // 保存完整分析到数据库
          const fullAnalysis = `# ${market.name} 深度分析报告\n\n` +
            `> 生成时间：${new Date().toLocaleString('zh-CN')}\n` +
            `> 分析类型：${market.marketType === 'hot' ? '热门板块' : '潜力市场'}\n\n` +
            `---\n\n` +
            `## 📊 市场概况\n\n` +
            `**板块名称**：${market.name}\n\n` +
            `**市场类型**：${market.marketType === 'hot' ? '🔥 热门板块' : '💎 潜力市场'}\n\n` +
            `**关注度**：${market.attentionScore}/100\n\n` +
            `**潜力评分**：${market.potentialScore}/100\n\n` +
            `**描述**：${market.description}\n\n` +
            `---\n\n` +
            `## 📰 最新资讯（近3天）\n\n` +
            (latestNews.length > 0 ? latestNews.map((news, i) =>
              `### ${news.title}\n\n` +
              `${news.summary || news.snippet}\n\n` +
              `*来源：${news.site_name} | 发布时间：${news.publish_time || '未知'}*\n\n`
            ).join('') : '暂无最新资讯\n\n') +
            `---\n\n` +
            `## 🌍 国内外相关性股票对比\n\n` +
            (relatedStocksInfo.length > 0 ? relatedStocksInfo.map(related =>
              `### ${related.aStock.name}（${related.aStock.code}）\n\n` +
              (related.usStock ? `- **美股对标**：${related.usStock.name}（${related.usStock.code}）\n\n` : '') +
              (related.hkStock ? `- **港股对标**：${related.hkStock.name}（${related.hkStock.code}）\n\n` : '') +
              `- **所属概念**：${related.concept}\n\n`
            ).join('') : '暂无相关性股票数据\n\n') +
            `---\n\n` +
            `## 📈 技术分析\n\n` +
            techAnalysis +
            `\n\n---\n\n` +
            `## 🏢 基本面分析\n\n` +
            fundAnalysis +
            `\n\n---\n\n` +
            `## 🌐 市场分析（含最新资讯）\n\n` +
            marketAnalysis +
            `\n\n---\n\n` +
            `## 💰 综合投资建议\n\n` +
            finalAnalysis;

          try {
            await db
              .update(potentialMarkets)
              .set({
                analysis: {
                  content: fullAnalysis,
                  generatedAt: new Date().toISOString(),
                  type: 'enhanced', // 标记为增强版分析
                },
                updatedAt: new Date(),
              })
              .where(eq(potentialMarkets.id, id));
            console.log(`[EnhancedAnalysis] 分析报告已保存到数据库`);
          } catch (dbError) {
            console.error("[EnhancedAnalysis] 保存分析失败:", dbError);
          }

          // 输出完成信息
          const duration = Math.round((Date.now() - startTime) / 1000);
          controller.enqueue(encoder.encode(`\n\n---\n\n`));
          controller.enqueue(encoder.encode(`> ⏱️ 分析耗时：${duration}秒\n`));
          controller.enqueue(encoder.encode(`> 📊 技术分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`> 🏢 基本面分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`> 🌐 市场分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`> 💰 综合分析师：DeepSeek V3.2\n`));
          controller.enqueue(encoder.encode(`> 📰 资讯来源：Web Search（近3天）\n`));
          controller.enqueue(encoder.encode(`> 🌍 相关性股票：${relatedStocksInfo.length}个\n\n`));
          controller.enqueue(encoder.encode(`✅ 分析完成！\n\n`));

        } catch (error) {
          console.error("[EnhancedAnalysis] 分析过程出错:", error);
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
    console.error("[EnhancedAnalysis] 生成分析失败:", error);
    return NextResponse.json(
      { error: "生成分析失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
