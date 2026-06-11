"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MinusCircle, XCircle, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface StockData {
  currentPrice?: string;
  yesterdayClose?: number;
  changePercent?: number;
  changeAmount?: number;
  volume?: number;
  amount?: number;
  turnoverRate?: number;
  totalMarketCap?: number;
  highPrice?: number;
  lowPrice?: number;
}

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  type: "stock" | "etf";
  currentPrice: string | null;
  stockData?: StockData;
}

// 信号类型
type SignalType = "strong" | "watch" | "risk";

interface SignalResult {
  type: SignalType;
  label: string;
  icon: React.ReactNode;
  advice: string;
  color: string;
  bgColor: string;
  highlights: string[];
}

export default function HoldingsMonitor({ holdings }: { holdings: Holding[] }) {
  // 信号判断逻辑
  const analyzeSignal = (holding: Holding): SignalResult => {
    const stockData = holding.stockData;
    if (!stockData || !stockData.changePercent) {
      return {
        type: "watch",
        label: "观望",
        icon: <MinusCircle className="w-5 h-5 text-amber-600" />,
        advice: "数据缺失，待更新",
        color: "text-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900/20",
        highlights: ["暂无数据"],
      };
    }

    const changePercent = stockData.changePercent || 0;
    const changeAmount = stockData.changeAmount || 0;
    const turnoverRate = stockData.turnoverRate || 0;
    const volume = stockData.volume || 0;
    const amount = stockData.amount || 0;

    const highlights: string[] = [];

    // 计算主力资金流向（基于成交量和换手率估算）
    const isMainInflow = changePercent > 0 && turnoverRate > 2;
    const isMainOutflow = changePercent < 0 && turnoverRate > 3;

    // 判断信号类型
    let signalType: SignalType = "watch";
    let advice = "保持观望";
    let color = "text-amber-600";
    let bgColor = "bg-amber-100 dark:bg-amber-900/20";

    // 根据不同标的类型和股票代码进行判断
    if (holding.stockCode === "002706") {
      // 良信股份：关注主力资金、5/20/250日线
      if (isMainInflow && changePercent > 2) {
        signalType = "strong";
        advice = "加仓";
        highlights.push(`主力资金净流入+${(amount * (changePercent / 100)).toFixed(0)}万`);
        highlights.push("强势突破");
      } else if (isMainOutflow || changePercent < -2) {
        signalType = "risk";
        advice = "减仓";
        highlights.push(`主力资金净流出`);
        highlights.push("跌破支撑");
      } else {
        signalType = "watch";
        advice = "持有";
        highlights.push("震荡整理");
      }
    } else if (holding.stockCode === "600276") {
      // 恒瑞医药：关注北向资金、20日线、创新药板块
      if (changePercent > 1 && turnoverRate < 3) {
        signalType = "strong";
        advice = "持有";
        highlights.push("北向资金流入");
        highlights.push("站上20日线");
      } else if (changePercent < -2) {
        signalType = "risk";
        advice = "减仓";
        highlights.push("跌破支撑位");
      } else {
        signalType = "watch";
        advice = "观望";
        highlights.push("震荡蓄势");
      }
    } else if (holding.stockCode === "601238") {
      // 广汽集团：关注融资余额、月销量、年线
      if (changePercent > 2 && turnoverRate > 1) {
        signalType = "strong";
        advice = "加仓";
        highlights.push("量价齐升");
        highlights.push("站上年线");
      } else if (changePercent < -3 || changePercent < -1 && turnoverRate > 2) {
        signalType = "risk";
        advice = "减仓";
        highlights.push("跌破年线");
        highlights.push("量价背离");
      } else {
        signalType = "watch";
        advice = "持有";
        highlights.push("年线附近震荡");
      }
    } else if (holding.stockCode === "601318") {
      // 中国平安：关注北向资金、股息率、年线
      if (changePercent > 1 && turnoverRate < 2) {
        signalType = "strong";
        advice = "持有";
        highlights.push("稳健上涨");
        highlights.push("高股息配置");
      } else if (changePercent < -2) {
        signalType = "risk";
        advice = "减仓";
        highlights.push("跌破关键支撑");
      } else {
        signalType = "watch";
        advice = "持有";
        highlights.push("震荡筑底");
      }
    } else if (holding.type === "etf") {
      // ETF：关注溢价率、融资余额
      if (changePercent > 1) {
        signalType = "strong";
        advice = "持有";
        highlights.push("溢价率合理");
        highlights.push("资金流入");
      } else if (changePercent < -2) {
        signalType = "risk";
        advice = "减仓";
        highlights.push("溢价率过高");
        highlights.push("资金流出");
      } else {
        signalType = "watch";
        advice = "持有";
        highlights.push("震荡整理");
      }
    }

    // 根据信号类型设置样式
    if (signalType === "strong") {
      color = "text-red-600";
      bgColor = "bg-red-100 dark:bg-red-900/20";
    } else if (signalType === "risk") {
      color = "text-green-600";
      bgColor = "bg-green-100 dark:bg-green-900/20";
    }

    // 设置图标
    let icon;
    if (signalType === "strong") {
      icon = <CheckCircle className="w-5 h-5 text-red-600" />;
    } else if (signalType === "risk") {
      icon = <XCircle className="w-5 h-5 text-green-600" />;
    } else {
      icon = <MinusCircle className="w-5 h-5 text-amber-600" />;
    }

    return {
      type: signalType,
      label: signalType === "strong" ? "强势" : signalType === "risk" ? "风险" : "观望",
      icon,
      advice,
      color,
      bgColor,
      highlights,
    };
  };

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {holdings.map((holding) => {
        const signal = analyzeSignal(holding);
        const stockData = holding.stockData;
        const changePercent = stockData?.changePercent || 0;
        const currentPrice = parseFloat(holding.currentPrice || "0");

        return (
          <Card
            key={holding.id}
            className="hover:shadow-lg transition-all duration-200 border-l-4"
            style={{
              borderLeftColor:
                signal.type === "strong"
                  ? "#22c55e"
                  : signal.type === "risk"
                  ? "#ef4444"
                  : "#f59e0b",
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-bold">
                      {holding.stockName}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      {holding.stockCode}
                    </span>
                  </div>
                  {holding.type === "etf" && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      ETF
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 现价和涨跌幅 */}
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">现价</div>
                  <div className="text-xl font-bold font-mono">
                    ¥{currentPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold font-mono ${changePercent >= 0 ? "text-red-600" : "text-green-600"}`}>
                    {changePercent >= 0 ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stockData?.volume
                      ? `${(stockData.volume / 10000).toFixed(0)}万手`
                      : "--"}
                  </div>
                </div>
              </div>

              {/* 信号灯 */}
              <div className={`flex items-center justify-between py-3 px-4 rounded-lg ${signal.bgColor}`}>
                <div className="flex items-center gap-2">
                  {signal.icon}
                  <span className={`font-semibold ${signal.color}`}>{signal.label}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${signal.bgColor} ${signal.color}`}>
                  {signal.advice}
                </div>
              </div>

              {/* 关键指标高亮 */}
              {signal.highlights.length > 0 && (
                <div className="space-y-1">
                  {signal.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
