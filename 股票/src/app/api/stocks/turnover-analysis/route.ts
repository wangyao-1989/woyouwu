import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

/**
 * 换手率分析API
 *
 * 分析换手率背后的含义：
 * - 真突破 vs 假突破
 * - 洗盘 vs 出货
 * - 机构吸筹 vs 没人要
 */
export async function POST(request: NextRequest) {
  try {
    const { stockCode, stockName, turnoverRate, currentPrice, changePercent, volume, amount } = await request.json();

    if (!stockCode || !stockName) {
      return NextResponse.json(
        { error: "股票代码和名称不能为空" },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const llmConfig = new Config();
    const llmClient = new LLMClient(llmConfig, customHeaders);

    const prompt = `你是**专业的量价分析专家**，擅长通过换手率分析资金流向和主力意图。

请对以下股票进行换手率深度分析：

## 股票基本信息
- 股票代码：${stockCode}
- 股票名称：${stockName}
- 当前价格：${currentPrice || '未知'}
- 涨跌幅：${changePercent || 0}%
- 换手率：${turnoverRate || 0}%
- 成交量：${volume || 0}手
- 成交额：${amount || 0}万元

## 阶段自动标注逻辑

请根据以下规则判断当前股票所处的阶段：

### 标注规则
1. **低位堆量·吸筹**
   - 条件：股价低于年线20% + 换手率连续5日2%~5% + 量比是地量的2倍
   - 特征：底部持续温和放量，主力资金缓慢吸纳

2. **缩量洗盘**
   - 条件：股价下跌 + 换手率萎缩至30%以下 + 主力资金未明显流出
   - 特征：量能大幅萎缩，清洗浮筹

3. **真突破·主升**
   - 条件：股价突破年线 + 换手率5%~8% + 量比>2 + 收盘站稳
   - 特征：放量突破关键阻力，开启主升浪

4. **高位爆量·出货**
   - 条件：换手率>15% + 涨幅>50%
   - 特征：高位巨量换手，主力资金派发

5. **阴跌出货·减仓**
   - 条件：连续5日换手率>8% + 股价累计下跌>5%
   - 特征：持续放量阴跌，主力减仓

6. **震荡观望**
   - 条件：不符合以上任何条件
   - 特征：震荡整理，趋势不明

### 标注规则说明
- 大盘股（市值>500亿）：阈值×0.6
- 小盘股（市值<100亿）：阈值×1.2
- 其他情况：使用标准阈值

## 分析任务

请基于以上阶段标注逻辑，对当前股票进行分析：

### 1. 当前阶段判断
**判断结果**：[选择以上6个阶段之一]
**分析依据**：
- [根据股价位置、换手率、量能等具体数据判断]
- [说明符合哪个规则的条件]

### 2. 量价关系分析
**当前量价特征**：
- 换手率水平：[极低/低/中等/高/极高]
- 量能状态：[地量/缩量/放量/爆量]
- 量价关系：[价涨量增/价涨量缩/价跌量增/价跌量缩]

**量价解读**：
- [量价关系背后的资金意图]

### 3. 主力资金动向
**主力资金状态**：
- [吸筹/洗盘/拉升/出货/观望]

**资金流向判断**：
- [基于换手率和股价变化判断主力行为]

### 4. 操作建议
**短线操作**：
- [具体建议：买入/持有/减仓/观望]

**中长线操作**：
- [具体建议：买入/持有/减仓/观望]

**关键观察点**：
- [需要重点关注的技术指标或数据]

## 输出要求

请按以下格式输出分析结果：

### 换手率解读
换手率：${turnoverRate || 0}%
- **量能状态**：[地量/缩量/温和放量/放量/爆量]
- **换手水平**：[极低/低/中等/高/极高]
- **市场解读**：[换手率反映的市场状态]

### 阶段标注
**当前阶段**：[低位堆量·吸筹/缩量洗盘/真突破·主升/高位爆量·出货/阴跌出货·减仓/震荡观望]
**判断依据**：
- 股价位置：[相对于年线/关键压力位的位置]
- 换手率：[数值及判断]
- 量能：[量比及判断]
- [其他关键依据]

### 量价关系
**量价特征**：[价涨量增/价涨量缩/价跌量增/价跌量缩]
**资金意图**：[量价关系背后的主力意图]

### 主力动向
**资金状态**：[吸筹/洗盘/拉升/出货/观望]
**流向判断**：[主力资金的具体行为]

### 操作建议
**短线**：[买入/持有/减仓/观望]
**中长线**：[买入/持有/减仓/观望]
**关键观察**：[需要重点关注的事项]

### 重大风险清单（一票否决权）

以下情况出现任意一条，无论盈亏，执行减仓/离场纪律：

| 风险类型 | 具体触发条件 | 应对方案 |
|---------|------------|---------|
| 技术面破位 | • 放量跌破年线（250日线），且3个交易日内无法收回<br>• 放量跌破重要支撑位，且无力反抽 | 无条件减仓50%以上或清仓 |
| 基本面证伪 | • 核心业务逻辑被公告证伪<br>• 季度财报毛利率连续两季下滑且无改善<br>• 重大利好消息被证实为谣言 | 重新评估投资逻辑，逻辑破坏则离场 |
| 资金面恶化 | • 北向资金连续3个月大幅减持<br>• 机构持仓连续两季大幅下降<br>• 主力资金持续大幅流出 | 与主力资金反向，需高度警惕 |
| 管理层/战略风险 | • 核心战略方向出现重大摇摆<br>• 董秘回复关键业务时出现前后矛盾<br>• 高管频繁离职或被调查 | 信任是持仓的基础，动摇即离场 |

**要求**：
- 严格基于提供的阶段标注规则进行判断
- 明确给出阶段标注结果
- 提供量化的分析依据
- 给出可操作建议
- 风险清单必须明确列出`;

    const messages = [
      { role: "system" as const, content: "你是专业的量价分析专家，擅长通过换手率分析资金流向和主力意图。严肃、客观、基于数据。" },
      { role: "user" as const, content: prompt }
    ];

    const stream = llmClient.stream(messages, {
      model: "deepseek-v3-2-251201",
      temperature: 0.7,
    });

    let analysis = "";
    for await (const chunk of stream) {
      if (chunk.content) {
        analysis += chunk.content.toString();
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      stockCode,
      stockName,
      turnoverRate,
      currentPrice,
      changePercent,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("换手率分析失败:", error);
    return NextResponse.json(
      { error: "换手率分析失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 获取换手率分析结果
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get("stockCode");

    if (!stockCode) {
      return NextResponse.json(
        { error: "股票代码不能为空" },
        { status: 400 }
      );
    }

    // 这里可以从数据库中获取已保存的分析结果
    // 暂时返回空，表示需要重新生成
    return NextResponse.json({
      success: true,
      exists: false,
      stockCode,
    });
  } catch (error) {
    console.error("获取换手率分析失败:", error);
    return NextResponse.json(
      { error: "获取换手率分析失败" },
      { status: 500 }
    );
  }
}
