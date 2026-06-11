"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Activity, AlertCircle, CheckCircle, MinusCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface StockData {
  currentPrice?: string;
  yesterdayClose?: number;
  todayOpen?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: number;
  amount?: number;
  changeAmount?: number;
  changePercent?: number;
  turnoverRate?: number;
}

interface StockMonitorHelperProps {
  stockCode: string;
  stockName: string;
  stockData?: StockData;
}

export default function StockMonitorHelper({ stockCode, stockName, stockData }: StockMonitorHelperProps) {
  // 使用 useMemo 缓存计算结果，避免每次渲染都重新计算
  const monitorData = useMemo(() => {
    const currentPrice = parseFloat(stockData?.currentPrice || "0");
    const changePercent = stockData?.changePercent || 0;

    // 模拟数据（实际应从API获取，这里使用固定值避免随机闪烁）
    const ma5 = currentPrice * 0.98;
    const ma20 = currentPrice * 0.95;
    const ma250 = currentPrice * 0.90;
    const distanceToYear = ((currentPrice - ma250) / ma250) * 100;

    // 模拟资金数据
    const mainInflow = 1234.56;
    const largeOrderInflow = 567.89;
    const consecutiveDays = 3;
    const northboundChange = 234.5;

    // 模拟融资数据
    const marginBalance = 123456;
    const marginChange = 2345;
    const marginDays = 5;

    // 计算信号 - 分别计算各维度
    const dimensions = {
      funding: { score: 0, reasons: [] as string[] },
      technical: { score: 0, reasons: [] as string[] },
      sentiment: { score: 0, reasons: [] as string[] }
    };

    // 资金面评分
    if (mainInflow > 0) {
      dimensions.funding.score += 2;
      dimensions.funding.reasons.push(`主力净流入${mainInflow.toFixed(0)}万`);
    }
    if (largeOrderInflow > 0) {
      dimensions.funding.score += 1;
      dimensions.funding.reasons.push("特大单净流入");
    }
    if (consecutiveDays >= 3) {
      dimensions.funding.score += 2;
      dimensions.funding.reasons.push(`主力连续${consecutiveDays}日流入`);
    }

    // 技术面评分
    if (currentPrice > ma20) {
      dimensions.technical.score += 2;
      dimensions.technical.reasons.push("站上20日线");
    }
    if (currentPrice > ma5) {
      dimensions.technical.score += 1;
      dimensions.technical.reasons.push("站上5日线");
    }
    if (changePercent > 0 && changePercent < 5) {
      dimensions.technical.score += 1;
      dimensions.technical.reasons.push("温和上涨");
    }

    // 情绪面评分
    if (marginChange > 0) {
      dimensions.sentiment.score += 1;
      dimensions.sentiment.reasons.push("融资余额增加");
    }
    if (northboundChange > 0) {
      dimensions.sentiment.score += 2;
      dimensions.sentiment.reasons.push("北向资金流入");
    }

    // 总分计算
    let totalScore = dimensions.funding.score + dimensions.technical.score + dimensions.sentiment.score;
    const allReasons = [
      ...dimensions.funding.reasons,
      ...dimensions.technical.reasons,
      ...dimensions.sentiment.reasons
    ];

    // 找出最强的维度
    const maxDimension = Object.entries(dimensions).reduce((max, [key, val]) => 
      val.score > max.score ? { name: key, ...val } : max
    , { name: '', score: 0, reasons: [] as string[] });

    const dimensionLabels: Record<string, string> = {
      funding: '资金面',
      technical: '技术面',
      sentiment: '情绪面'
    };

    // 根据得分判断信号
    let signalResult = {
      signal: "中",
      advice: "持有",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      reasons: allReasons,
      strongDimension: "",
      strongReasons: [] as string[]
    };

    if (totalScore >= 4) {
      signalResult = { 
        signal: "强", 
        advice: "技术面偏强", 
        color: "text-red-600", 
        bgColor: "bg-red-100 dark:bg-red-900/20", 
        reasons: allReasons,
        strongDimension: dimensionLabels[maxDimension.name] || "",
        strongReasons: maxDimension.reasons
      };
    } else if (totalScore >= 1) {
      signalResult = { signal: "中", advice: "持有观望", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20", reasons: allReasons, strongDimension: "", strongReasons: [] };
    } else if (totalScore >= -1) {
      signalResult = { signal: "弱", advice: "谨慎观望", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/20", reasons: allReasons, strongDimension: "", strongReasons: [] };
    } else {
      signalResult = { signal: "风险", advice: "注意风险", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20", reasons: allReasons, strongDimension: "", strongReasons: [] };
    }

    return {
      currentPrice,
      changePercent,
      ma5,
      ma20,
      ma250,
      distanceToYear,
      mainInflow,
      largeOrderInflow,
      consecutiveDays,
      northboundChange,
      marginBalance,
      marginChange,
      marginDays,
      signalResult,
      dimensions
    };
  }, [stockData]);

  const {
    currentPrice,
    changePercent,
    ma5,
    ma20,
    ma250,
    distanceToYear,
    mainInflow,
    largeOrderInflow,
    consecutiveDays,
    northboundChange,
    marginBalance,
    marginChange,
    marginDays,
    signalResult
  } = monitorData;

  return (
    <div className="space-y-4">
      {/* 顶部：股价全景卡 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">股价全景</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-6">
            {[
              { label: "现价", value: `¥${currentPrice.toFixed(2)}`, color: "" },
              { label: "涨跌幅", value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`, color: changePercent >= 0 ? "text-red-600" : "text-green-600" },
              { label: "5日线", value: `¥${ma5.toFixed(2)}`, color: "text-blue-600" },
              { label: "20日线", value: `¥${ma20.toFixed(2)}`, color: "text-purple-600" },
              { label: "年线", value: `¥${ma250.toFixed(2)}`, color: "text-orange-600" },
              { label: "距年线", value: `${distanceToYear >= 0 ? '+' : ''}${distanceToYear.toFixed(1)}%`, color: distanceToYear >= 0 ? "text-red-600" : "text-green-600" }
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 中间三列 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 左列：资金监测卡 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              资金监测
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "主力净流入", value: `${mainInflow >= 0 ? '+' : ''}${mainInflow.toFixed(0)}万`, color: mainInflow >= 0 ? "text-red-600" : "text-green-600" },
                { label: "特大单净流入", value: `${largeOrderInflow >= 0 ? '+' : ''}${largeOrderInflow.toFixed(0)}万`, color: largeOrderInflow >= 0 ? "text-red-600" : "text-green-600" },
                { label: "连续流入", value: `${consecutiveDays}天`, color: "text-blue-600" },
                { label: "北向变动", value: `${northboundChange >= 0 ? '+' : ''}${northboundChange.toFixed(0)}万`, color: northboundChange >= 0 ? "text-red-600" : "text-green-600" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-base font-bold font-mono ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 中列：融资情绪卡 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              融资情绪
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "融资余额", value: `¥${marginBalance.toFixed(0)}`, color: "text-blue-600" },
                { label: "环比变化", value: `${marginChange >= 0 ? '+' : ''}${marginChange.toFixed(0)}`, color: marginChange >= 0 ? "text-red-600" : "text-green-600" },
                { label: "连续天数", value: `${marginDays}天`, color: "text-purple-600" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-base font-bold font-mono ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 右列：信号状态卡 */}
        <Card className={`border-l-4 ${
          signalResult.signal === '强' ? 'border-l-red-500' :
          signalResult.signal === '中' ? 'border-l-blue-500' :
          signalResult.signal === '弱' ? 'border-l-amber-500' :
          'border-l-green-500'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {signalResult.signal === '强' && <CheckCircle className="w-4 h-4 text-red-600" />}
              {signalResult.signal === '中' && <Activity className="w-4 h-4 text-blue-600" />}
              {signalResult.signal === '弱' && <MinusCircle className="w-4 h-4 text-amber-600" />}
              {signalResult.signal === '风险' && <AlertCircle className="w-4 h-4 text-green-600" />}
              技术信号
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-center py-3 px-4 rounded-lg ${signalResult.bgColor}`}>
              <div className={`text-3xl font-bold ${signalResult.color}`}>{signalResult.signal}</div>
              <div className={`text-sm font-semibold mt-1 ${signalResult.color}`}>{signalResult.advice}</div>
              
              {/* 显示最强维度 */}
              {signalResult.strongDimension && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <div className="text-xs text-muted-foreground">优势维度</div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">
                    {signalResult.strongDimension}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {signalResult.strongReasons.slice(0, 2).map((reason, idx) => (
                      <span key={idx} className="text-xs bg-red-200 dark:bg-red-800/50 px-1.5 py-0.5 rounded">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 提示信息 */}
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              <span>此为技术面信号参考，建议结合下方「AI圆桌讨论」综合判断后决策</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部：决策依据明细 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">信号依据明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {signalResult.reasons.map((reason, index) => (
              <Badge key={index} variant="outline" className="text-sm h-6 px-3">
                {reason}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
