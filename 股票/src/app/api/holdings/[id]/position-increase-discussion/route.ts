import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils, SearchClient, getDb } from "coze-coding-dev-sdk";
import { holdings, positionIncreaseDiscussions } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import type { AIDiscussionParticipant, AIDiscussionsData, PositionIncreaseSuggestion } from "@/storage/database/shared/schema";
import * as schema from "@/storage/database/shared/schema";

// AI模型配置 - 四位专家级分析师
const AI_MODELS = [
  {
    name: "DeepSeek V3",
    model: "deepseek-v3-2-251201",
    avatar: "🤖",
    personality: "你是DeepSeek V3，一个注重数据分析和逻辑推理的AI分析师。你的分析风格严谨，擅长从技术面、资金面、基本面多维度评估，用数据说话。"
  },
  {
    name: "DeepSeek R1",
    model: "deepseek-r1-250528",
    avatar: "🧠",
    personality: "你是DeepSeek R1，一个专精深度研究和学术分析的AI分析师。你擅长挖掘行业深层逻辑、产业链关系和长期投资价值，注重基本面深度研究。"
  },
  {
    name: "Kimi",
    model: "kimi-k2-5-260127",
    avatar: "🌙",
    personality: "你是Kimi，一个擅长长上下文理解和宏观视角的AI分析师。你注重行业趋势、政策环境和市场情绪的综合分析，善于发现潜在机会和风险。"
  },
  {
    name: "豆包Pro",
    model: "doubao-seed-2-0-pro-260215",
    avatar: "🎯",
    personality: "你是豆包Pro，一个注重风险控制和实战经验的AI分析师。你更加谨慎务实，强调风险管理和仓位控制的重要性，擅长发现潜在风险点。"
  }
];

interface StockInfo {
  stockCode: string;
  stockName: string;
  sector?: string;
  currentPrice: number;
  costPrice: number;
  shares: number;
  profit: number;
  profitPercent: number;
}

// 获取最新市场资讯
async function fetchLatestMarketInfo(
  searchClient: SearchClient,
  stockInfo: StockInfo
): Promise<string> {
  try {
    // 获取当前日期，强调搜索最新数据
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // 构建搜索查询，强调获取最新数据
    const queries = [
      `${stockInfo.stockName} ${stockInfo.stockCode} 最新消息 新闻 ${currentYear}年${currentMonth}月`,
      `${stockInfo.stockName} 股价走势 技术分析 最新行情 ${currentYear}`,
      `${stockInfo.sector || ""} 板块 最新动态 政策 ${currentYear}`
    ];

    console.log(`[Search] 开始获取最新市场数据...`);

    // 并行搜索
    const searchPromises = queries.map(q => 
      searchClient.webSearch(q, 5, true).catch(e => {
        console.error(`[Search] 搜索失败: ${q}`, e);
        return { web_items: [] };
      })
    );

    const results = await Promise.all(searchPromises);

    // 合并搜索结果
    const allItems = results.flatMap(r => r.web_items || []);
    
    if (allItems.length === 0) {
      return "";
    }

    // 格式化搜索结果
    const formattedResults = allItems
      .slice(0, 10) // 最多取10条
      .map((item, idx) => {
        const parts = [`[${idx + 1}] ${item.title}`];
        if (item.snippet) parts.push(item.snippet);
        if (item.summary) parts.push(item.summary);
        return parts.join(" | ");
      })
      .join("\n");

    console.log(`[Search] 获取到 ${allItems.length} 条最新资讯`);

    return `\n【最新市场资讯 - ${currentYear}年${currentMonth}月】\n${formattedResults}`;
  } catch (error) {
    console.error("[Search] 获取市场资讯失败:", error);
    return "";
  }
}

// 获取单个AI的观点
async function getAIOpinion(
  client: LLMClient,
  model: typeof AI_MODELS[0],
  stockInfo: StockInfo,
  latestMarketInfo: string,
  otherOpinions?: string
): Promise<AIDiscussionParticipant> {
  
  // 判断是否为ETF：代码以15/16/17/18/19（深市ETF）或51/56/58/59（沪市ETF）开头
  const isETF = /^(15|16|17|18|19|51|56|58|59)\d{4}$/.test(stockInfo.stockCode);
  const productType = isETF ? "ETF基金" : "股票";
  
  const prompt = `${model.personality}

你现在需要评估是否适合加仓以下投资标的：

【重要提示】
- 股票名称可能因系统显示限制而不完整（如"科创芯片设计ET..."），请以股票代码为准进行识别
- 请通过股票代码 ${stockInfo.stockCode} 判断具体产品，而非依赖名称

【最新市场资讯】
${latestMarketInfo || "暂无最新资讯"}

【投资标的信息】
- 产品类型：${productType}
- 股票代码：${stockInfo.stockCode}（请以此代码识别具体产品）
- 股票名称：${stockInfo.stockName}（仅供参考，可能不完整）
- 所属板块：${stockInfo.sector || "未知"}
- 当前价格：¥${stockInfo.currentPrice.toFixed(2)}
- 持仓成本：¥${stockInfo.costPrice.toFixed(2)}
- 持仓数量：${stockInfo.shares}股
- 当前盈亏：${stockInfo.profit >= 0 ? "+" : ""}¥${stockInfo.profit.toFixed(2)} (${stockInfo.profitPercent >= 0 ? "+" : ""}${stockInfo.profitPercent.toFixed(2)}%)

【分析要求】
⚠️ 必须基于上述【最新市场资讯】进行分析，严禁使用过时的历史数据！
请结合最新市场动态给出判断。

${otherOpinions ? `【其他AI的观点】\n${otherOpinions}\n\n请结合以上观点，给出你的独立判断。你可以同意、反对或保持中立，并给出理由。` : "请独立分析是否适合加仓。"}

【要求】
1. 给出明确的观点：同意加仓(agree)、反对加仓(disagree)或中立(neutral)
2. 给出信心指数(0-100)
3. 列出3-5个关键论点
4. 如果有担忧，列出担忧点
5. 如果需要反驳其他AI，给出反驳论点

请以JSON格式回复：
{
  "opinion": "agree/disagree/neutral",
  "confidence": 0-100,
  "reasoning": "详细分析理由",
  "keyPoints": ["论点1", "论点2", "论点3"],
  "concerns": ["担忧1", "担忧2"],
  "counterArguments": "反驳其他AI的论点（如果有）"
}`;

  try {
    const messages = [{ role: "user" as const, content: prompt }];
    
    // KIMI模型有特殊限制：temperature 只能是 1.0(thinking) 或 0.6(non-thinking)
    const temperature = model.model.startsWith('kimi') ? 0.6 : 0.7;
    
    const response = await client.invoke(messages, { 
      model: model.model,
      temperature
    });

    // 解析JSON响应
    const content = response.content;
    
    // DeepSeek R1 是思考模型，可能输出 <think>...</think> 后再输出 JSON
    // 需要更智能地提取 JSON
    let jsonStr = "";
    
    // 尝试移除思考标签后的内容
    const thinkEndMatch = content.match(/<\/think>\s*([\s\S]*)/);
    const cleanContent = thinkEndMatch ? thinkEndMatch[1].trim() : content;
    
    // 使用更精确的正则匹配最后一个完整的 JSON 对象
    // 从后向前找最后一个 }
    let braceCount = 0;
    let jsonEnd = -1;
    let jsonStart = -1;
    
    for (let i = cleanContent.length - 1; i >= 0; i--) {
      if (cleanContent[i] === '}') {
        braceCount++;
        if (jsonEnd === -1) jsonEnd = i;
      } else if (cleanContent[i] === '{') {
        braceCount--;
        if (braceCount === 0 && jsonEnd !== -1) {
          jsonStart = i;
          break;
        }
      }
    }
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = cleanContent.substring(jsonStart, jsonEnd + 1);
    }
    
    if (!jsonStr) {
      // 降级方案：尝试匹配任意 JSON
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }
    
    if (!jsonStr) {
      throw new Error("无法从响应中提取JSON");
    }

    const result = JSON.parse(jsonStr);

    return {
      name: model.name,
      model: model.model,
      avatar: model.avatar,
      opinion: result.opinion || "neutral",
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      reasoning: result.reasoning || "无法获取分析理由",
      keyPoints: result.keyPoints || [],
      concerns: result.concerns || [],
      counterArguments: result.counterArguments
    };
  } catch (error) {
    console.error(`${model.name} 分析失败:`, error);
    return {
      name: model.name,
      model: model.model,
      avatar: model.avatar,
      opinion: "neutral",
      confidence: 0,
      reasoning: "分析失败，无法获取有效响应",
      keyPoints: [],
      concerns: ["API调用失败"]
    };
  }
}

// 计算最终决策
function calculateFinalDecision(participants: AIDiscussionParticipant[]): {
  decision: "agree" | "disagree" | "neutral";
  confidence: number;
  consensus: boolean;
  consensusType: "strong" | "weak" | "none";
  finalVote: { agree: number; disagree: number; neutral: number };
} {
  const finalVote = {
    agree: participants.filter(p => p.opinion === "agree").length,
    disagree: participants.filter(p => p.opinion === "disagree").length,
    neutral: participants.filter(p => p.opinion === "neutral").length
  };

  const totalWeight = participants.reduce((sum, p) => sum + p.confidence, 0);
  
  const agreeWeight = participants
    .filter(p => p.opinion === "agree")
    .reduce((sum, p) => sum + p.confidence, 0);
  
  const disagreeWeight = participants
    .filter(p => p.opinion === "disagree")
    .reduce((sum, p) => sum + p.confidence, 0);

  const agreeScore = totalWeight > 0 ? (agreeWeight / totalWeight) * 100 : 0;
  const disagreeScore = totalWeight > 0 ? (disagreeWeight / totalWeight) * 100 : 0;

  // 4人讨论的共识判断逻辑
  // 强共识：3票及以上同意/反对
  // 弱共识：2票同意/反对（且另一方不超过1票）
  // 无共识：2票对2票或更分散
  let consensusType: "strong" | "weak" | "none" = "none";
  let consensus = false;

  if (finalVote.agree >= 3 || finalVote.disagree >= 3) {
    consensusType = "strong";
    consensus = true;
  } else if ((finalVote.agree === 2 && finalVote.disagree <= 1) || 
             (finalVote.disagree === 2 && finalVote.agree <= 1)) {
    consensusType = "weak";
    consensus = true;
  }

  // 决策逻辑
  let decision: "agree" | "disagree" | "neutral" = "neutral";
  let confidence = 0;

  if (finalVote.agree >= 3) {
    decision = "agree";
    confidence = Math.round(agreeScore);
  } else if (finalVote.disagree >= 3) {
    decision = "disagree";
    confidence = Math.round(disagreeScore);
  } else if (finalVote.agree === 2 && finalVote.disagree <= 1) {
    decision = "agree";
    confidence = Math.round(agreeScore * 0.8); // 弱共识时降低信心
  } else if (finalVote.disagree === 2 && finalVote.agree <= 1) {
    decision = "disagree";
    confidence = Math.round(disagreeScore * 0.8);
  } else {
    // 2票对2票或其他情况，取加权平均
    confidence = Math.round(Math.abs(agreeScore - disagreeScore));
    decision = agreeScore > disagreeScore ? "agree" : 
               disagreeScore > agreeScore ? "disagree" : "neutral";
  }

  return { decision, confidence, consensus, consensusType, finalVote };
}

// 生成最终建议
async function generateFinalSuggestion(
  client: LLMClient,
  stockInfo: StockInfo,
  discussionsData: AIDiscussionsData,
  decision: "agree" | "disagree" | "neutral",
  confidence: number
): Promise<PositionIncreaseSuggestion> {
  
  const { finalVote, participants } = discussionsData;
  
  // 判断是否为ETF
  const isETF = /^(15|16|17|18|19|51|56|58|59)\d{4}$/.test(stockInfo.stockCode);
  const productType = isETF ? "ETF基金" : "股票";

  const prompt = `你是一个专业的投资顾问，需要综合多位AI分析师的意见，给出最终的加仓建议。

【重要提示】
- 产品名称可能因系统显示限制而不完整，请以股票代码为准进行识别
- 请通过股票代码 ${stockInfo.stockCode} 判断具体产品

【投资标的信息】
- 产品类型：${productType}
- 股票代码：${stockInfo.stockCode}（请以此代码识别具体产品）
- 股票名称：${stockInfo.stockName}（仅供参考，可能不完整）
- 当前价格：¥${stockInfo.currentPrice.toFixed(2)}
- 持仓成本：¥${stockInfo.costPrice.toFixed(2)}

【AI讨论结果】
投票结果：${finalVote.agree}票同意，${finalVote.disagree}票反对，${finalVote.neutral}票中立
最终决策：${decision === "agree" ? "建议加仓" : decision === "disagree" ? "不建议加仓" : "观望"}
是否达成共识：${discussionsData.consensus ? "是" : "否"}

【各方观点】
${participants.map(p => `
${p.avatar} ${p.name} (${p.opinion === "agree" ? "同意" : p.opinion === "disagree" ? "反对" : "中立"}) - 信心${p.confidence}%
理由：${p.reasoning}
关键论点：${p.keyPoints.join("、")}
${p.concerns?.length ? `担忧：${p.concerns.join("、")}` : ""}
`).join("\n")}

请给出最终建议，以JSON格式回复：
{
  "decision": "${decision}",
  "suggestion": "具体的加仓建议，包括时机、仓位等",
  "confidence": ${confidence},
  "positionSize": "建议仓位比例，如10%-20%",
  "entryPoints": ["入场时机1", "入场时机2"],
  "stopLoss": "止损价位或策略",
  "targetPrice": "目标价位",
  "riskWarning": "风险提示"
}`;

  try {
    const messages = [{ role: "user" as const, content: prompt }];
    const response = await client.invoke(messages, { 
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.5 
    });

    const content = response.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("无法解析建议");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      decision: result.decision || decision,
      suggestion: result.suggestion || "暂无具体建议",
      confidence: result.confidence || confidence,
      positionSize: result.positionSize,
      entryPoints: result.entryPoints,
      stopLoss: result.stopLoss,
      targetPrice: result.targetPrice,
      riskWarning: result.riskWarning
    };
  } catch (error) {
    console.error("生成建议失败:", error);
    return {
      decision,
      suggestion: decision === "agree" ? "综合分析后建议适当加仓，注意控制风险" :
                  decision === "disagree" ? "综合分析后不建议加仓，建议观望" :
                  "意见分歧较大，建议谨慎操作",
      confidence
    };
  }
}

// 主处理函数
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const db = await getDb(schema);

    // 获取持仓信息
    const holdingResult = await db
      .select()
      .from(holdings)
      .where(eq(holdings.id, id))
      .limit(1);

    if (!holdingResult || holdingResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "持仓不存在" },
        { status: 404 }
      );
    }

    const holding = holdingResult[0];
    const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : parseFloat(holding.costPrice);
    const costPrice = parseFloat(holding.costPrice);
    const shares = holding.shares || 0;
    const profit = (currentPrice - costPrice) * shares;
    const profitPercent = costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;

    const stockInfo: StockInfo = {
      stockCode: holding.stockCode,
      stockName: holding.stockName,
      sector: holding.sector || undefined,
      currentPrice,
      costPrice,
      shares,
      profit,
      profitPercent
    };

    const config = new Config();
    const client = new LLMClient(config, customHeaders);
    const searchClient = new SearchClient(config, customHeaders);

    console.log(`开始多AI讨论: ${stockInfo.stockName} (${stockInfo.stockCode})`);

    // 【关键】先获取最新市场资讯
    console.log("获取最新市场资讯...");
    const latestMarketInfo = await fetchLatestMarketInfo(searchClient, stockInfo);

    // 【优化】第一轮：并行调用各AI独立分析
    console.log("第一轮：并行获取各AI分析...");
    const firstRoundPromises = AI_MODELS.map(model => 
      getAIOpinion(client, model, stockInfo, latestMarketInfo).then(opinion => {
        console.log(`${model.name} 第一轮分析完成`);
        return opinion;
      })
    );
    const participants = await Promise.all(firstRoundPromises);

    // 【优化】第二轮：并行让AI们看到其他人的观点后重新评估
    console.log("第二轮：并行重新评估...");
    const secondRoundPromises = AI_MODELS.map((model, i) => {
      const otherParticipantsOpinions = participants
        .filter((_, idx) => idx !== i)
        .map(p => `${p.avatar} ${p.name}: ${p.opinion === "agree" ? "同意加仓" : p.opinion === "disagree" ? "反对加仓" : "中立"} (${p.confidence}%)\n理由：${p.reasoning}`)
        .join("\n\n");

      return getAIOpinion(client, model, stockInfo, latestMarketInfo, otherParticipantsOpinions).then(opinion => {
        console.log(`${model.name} 第二轮分析完成`);
        return { index: i, opinion };
      });
    });
    
    const secondRoundResults = await Promise.all(secondRoundPromises);
    secondRoundResults.forEach(({ index, opinion }) => {
      participants[index] = opinion;
    });

    // 计算最终决策
    const { decision, confidence, consensus, consensusType, finalVote } = calculateFinalDecision(participants);

    // 根据共识类型生成描述
    const consensusDesc = consensusType === "strong" ? "强共识" : 
                          consensusType === "weak" ? "倾向性共识" : "意见分歧";

    const discussionsData: AIDiscussionsData = {
      participants,
      round: 2,
      summary: `${finalVote.agree}票同意，${finalVote.disagree}票反对，${finalVote.neutral}票中立（${consensusDesc}）`,
      consensus,
      consensusType,
      finalVote,
      timestamp: new Date().toISOString()
    };

    // 生成最终建议
    console.log("生成最终建议...");
    const suggestion = await generateFinalSuggestion(client, stockInfo, discussionsData, decision, confidence);

    // 尝试保存讨论记录（失败不影响返回结果）
    let savedId = `temp_${Date.now()}`;
    let savedCreatedAt = new Date();
    
    try {
      // 重新获取数据库连接（避免长时间 AI 调用导致连接超时）
      const saveDb = await getDb(schema);
      
      const savedDiscussion = await saveDb
        .insert(positionIncreaseDiscussions)
        .values({
          holdingId: id,
          stockCode: stockInfo.stockCode,
          stockName: stockInfo.stockName,
          sector: stockInfo.sector || null,
          currentPrice: stockInfo.currentPrice.toString(),
          discussions: discussionsData,
          finalDecision: decision,
          finalSuggestion: JSON.stringify(suggestion),
          confidenceScore: confidence
        })
        .returning();
      
      savedId = savedDiscussion[0].id;
      savedCreatedAt = savedDiscussion[0].createdAt;
      console.log("讨论记录已保存到数据库");
    } catch (dbError) {
      console.error("保存讨论记录失败（不影响结果返回）:", dbError);
    }

    console.log(`讨论完成，决策: ${decision}, 信心: ${confidence}%, 共识: ${consensus}`);

    return NextResponse.json({
      success: true,
      discussion: {
        id: savedId,
        stockCode: stockInfo.stockCode,
        stockName: stockInfo.stockName,
        sector: stockInfo.sector,
        discussions: discussionsData,
        decision,
        suggestion,
        confidence,
        consensus,
        finalVote,
        createdAt: savedCreatedAt
      }
    });

  } catch (error) {
    console.error("加仓讨论失败:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "讨论失败" 
      },
      { status: 500 }
    );
  }
}

// 获取历史讨论记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb(schema);

    const discussions = await db
      .select()
      .from(positionIncreaseDiscussions)
      .where(eq(positionIncreaseDiscussions.holdingId, id));

    const formattedDiscussions = discussions.map((d: any) => ({
      id: d.id,
      stockCode: d.stockCode,
      stockName: d.stockName,
      sector: d.sector,
      currentPrice: d.currentPrice,
      discussions: d.discussions,
      finalDecision: d.finalDecision,
      finalSuggestion: d.finalSuggestion ? JSON.parse(d.finalSuggestion) : null,
      confidenceScore: d.confidenceScore,
      createdAt: d.createdAt
    }));

    return NextResponse.json({
      success: true,
      discussions: formattedDiscussions
    });

  } catch (error) {
    console.error("获取讨论记录失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}
