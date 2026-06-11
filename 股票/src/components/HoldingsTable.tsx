"use client";

import { useState, useMemo } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface StockData {
  currentPrice?: string;
  yesterdayClose?: number;
  todayOpen?: number;
  highPrice?: number;
  lowPrice?: number;
  volume?: number;
  amount?: number;
  volumeRatio?: number;
  changeAmount?: number;
  changePercent?: number;
  amplitude?: number;
  turnoverRate?: number;
  turnoverAnalysis?: string;
  totalMarketCap?: number;
  circulateMarketCap?: number;
}

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  shares: number;
  costPrice: string;
  currentPrice: string | null;
  latestAnalysis: any;
  stockData?: StockData;
}

interface HoldingsTableProps {
  holdings: Holding[];
}

type SortField =
  | 'stockCode'
  | 'stockName'
  | 'shares'
  | 'costPrice'
  | 'currentPrice'
  | 'marketValue'
  | 'profitAmount'
  | 'profitPercent'
  | 'changeAmount'
  | 'changePercent'
  | 'todayProfit'
  | 'highPrice'
  | 'lowPrice'
  | 'amplitude'
  | 'turnoverRate';

interface SortConfig {
  field: SortField;
  direction: 'asc' | 'desc';
}

export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const formatNumber = (num: number, decimals: number = 2) => {
    if (isNaN(num) || num === null || num === undefined) return '-';
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const calculateMetrics = (holding: Holding) => {
    const shares = holding.shares || 0;
    const costPrice = parseFloat(holding.costPrice) || 0;
    const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : costPrice;
    const stockData = holding.stockData || {};

    const costAmount = costPrice * shares;
    const marketValue = currentPrice * shares;
    const profitAmount = marketValue - costAmount;
    const profitPercent = costAmount > 0 ? (profitAmount / costAmount) * 100 : 0;
    const changeAmount = stockData.changeAmount || 0;
    const changePercent = stockData.changePercent || 0;
    const todayProfit = changeAmount * shares;

    return {
      costPrice,
      currentPrice,
      yesterdayClose: stockData.yesterdayClose || currentPrice,
      todayOpen: stockData.todayOpen || currentPrice,
      highPrice: stockData.highPrice || currentPrice,
      lowPrice: stockData.lowPrice || currentPrice,
      costAmount,
      marketValue,
      profitAmount,
      profitPercent,
      changeAmount,
      changePercent,
      todayProfit,
      amplitude: stockData.amplitude || 0,
      turnoverRate: stockData.turnoverRate || 0,
      turnoverAnalysis: stockData.turnoverAnalysis || null,
      volumeRatio: stockData.volumeRatio || 0,
    };
  };

  // 解析风险清单
  const parseRiskList = (analysis: string | null) => {
    if (!analysis) return [];

    const risks: { type: string; condition: string; solution: string }[] = [];
    const riskSection = analysis.match(/重大风险清单[\s\S]*$/);

    if (riskSection) {
      // 提取表格中的风险信息
      const lines = riskSection[0].split('\n');
      let currentType = '';
      let currentCondition = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.includes('技术面破位')) {
          currentType = '技术面破位';
        } else if (line.includes('基本面证伪')) {
          currentType = '基本面证伪';
        } else if (line.includes('资金面恶化')) {
          currentType = '资金面恶化';
        } else if (line.includes('管理层/战略风险')) {
          currentType = '管理层/战略风险';
        } else if (line.startsWith('•') && currentType) {
          currentCondition += line + ' ';
        } else if (line.includes('无条件减仓') || line.includes('重新评估') || line.includes('与主力资金反向') || line.includes('信任是持仓的基础')) {
          if (currentType && currentCondition) {
            risks.push({
              type: currentType,
              condition: currentCondition.trim(),
              solution: line.replace('|', '').trim()
            });
            currentCondition = '';
          }
        }
      }
    }

    return risks;
  };

  // 解析换手率分析结果，提取关键信息
  const parseTurnoverAnalysis = (analysis: string | null) => {
    if (!analysis) return null;

    const result = {
      phase: null as '低位堆量·吸筹' | '缩量洗盘' | '真突破·主升' | '高位爆量·出货' | '阴跌出货·减仓' | '震荡观望' | null,
      volumeStatus: null as '地量' | '缩量' | '温和放量' | '放量' | '爆量' | null,
      summary: '',
    };

    // 提取阶段标注 - 使用更宽松的匹配
    const phases = [
      '低位堆量·吸筹',
      '缩量洗盘',
      '真突破·主升',
      '高位爆量·出货',
      '阴跌出货·减仓',
      '震荡观望'
    ];

    for (const phase of phases) {
      if (analysis.includes(phase)) {
        result.phase = phase as any;
        console.log(`解析到阶段: ${phase}`);
        break;
      }
    }

    // 提取量能状态
    const volumeStatuses = ['地量', '缩量', '温和放量', '放量', '爆量'];
    for (const status of volumeStatuses) {
      if (analysis.includes(status)) {
        result.volumeStatus = status as any;
        break;
      }
    }

    // 提取摘要（从阶段标注部分提取）
    const phaseMatch = analysis.match(/阶段标注[\s\S]*?(?=###|$)/);
    if (phaseMatch) {
      result.summary = phaseMatch[0].substring(0, 100);
    } else {
      // 备用：从换手率解读提取
      const interpretationMatch = analysis.match(/换手率解读[\s\S]*?(?=###|$)/);
      if (interpretationMatch) {
        result.summary = interpretationMatch[0].substring(0, 100);
      }
    }

    return result;
  };

  const totalMetrics = holdings.reduce(
    (acc, holding) => {
      const metrics = calculateMetrics(holding);
      return {
        totalCost: acc.totalCost + metrics.costAmount,
        totalMarketValue: acc.totalMarketValue + metrics.marketValue,
        totalProfit: acc.totalProfit + metrics.profitAmount,
        totalTodayProfit: acc.totalTodayProfit + metrics.todayProfit,
      };
    },
    { totalCost: 0, totalMarketValue: 0, totalProfit: 0, totalTodayProfit: 0 }
  );

  const totalProfitPercent = totalMetrics.totalCost > 0
    ? (totalMetrics.totalProfit / totalMetrics.totalCost) * 100
    : 0;

  // 排序后的持仓列表
  const sortedHoldings = useMemo(() => {
    if (!sortConfig) return holdings;

    return [...holdings].sort((a, b) => {
      const metricsA = calculateMetrics(a);
      const metricsB = calculateMetrics(b);

      let valueA: any;
      let valueB: any;

      switch (sortConfig.field) {
        case 'stockCode':
          valueA = a.stockCode;
          valueB = b.stockCode;
          break;
        case 'stockName':
          valueA = a.stockName;
          valueB = b.stockName;
          break;
        case 'shares':
          valueA = a.shares;
          valueB = b.shares;
          break;
        case 'costPrice':
          valueA = metricsA.costPrice;
          valueB = metricsB.costPrice;
          break;
        case 'currentPrice':
          valueA = metricsA.currentPrice;
          valueB = metricsB.currentPrice;
          break;
        case 'marketValue':
          valueA = metricsA.marketValue;
          valueB = metricsB.marketValue;
          break;
        case 'profitAmount':
          valueA = metricsA.profitAmount;
          valueB = metricsB.profitAmount;
          break;
        case 'profitPercent':
          valueA = metricsA.profitPercent;
          valueB = metricsB.profitPercent;
          break;
        case 'changeAmount':
          valueA = metricsA.changeAmount;
          valueB = metricsB.changeAmount;
          break;
        case 'changePercent':
          valueA = metricsA.changePercent;
          valueB = metricsB.changePercent;
          break;
        case 'todayProfit':
          valueA = metricsA.todayProfit;
          valueB = metricsB.todayProfit;
          break;
        case 'highPrice':
          valueA = metricsA.highPrice;
          valueB = metricsB.highPrice;
          break;
        case 'lowPrice':
          valueA = metricsA.lowPrice;
          valueB = metricsB.lowPrice;
          break;
        case 'amplitude':
          valueA = metricsA.amplitude;
          valueB = metricsB.amplitude;
          break;
        case 'turnoverRate':
          valueA = metricsA.turnoverRate;
          valueB = metricsB.turnoverRate;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [holdings, sortConfig]);

  const handleSort = (field: SortField) => {
    if (sortConfig?.field === field) {
      setSortConfig({
        field,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setSortConfig({ field, direction: 'desc' });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig?.field !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 inline" />
    );
  };

  const handleRowClick = (id: string) => {
    router.push(`/holdings/${id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>持仓明细看板</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 汇总信息 */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">总成本</p>
            <p className="text-lg font-semibold font-mono">
              ¥{formatNumber(totalMetrics.totalCost)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">总市值</p>
            <p className="text-lg font-semibold font-mono">
              ¥{formatNumber(totalMetrics.totalMarketValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">总盈亏</p>
            <p className={`text-lg font-bold font-mono ${totalMetrics.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalMetrics.totalProfit >= 0 ? '+' : ''}¥{formatNumber(totalMetrics.totalProfit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">盈亏比例</p>
            <p className={`text-lg font-bold font-mono ${totalProfitPercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalProfitPercent >= 0 ? '+' : ''}{formatNumber(totalProfitPercent)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">今日盈亏</p>
            <p className={`text-lg font-bold font-mono ${totalMetrics.totalTodayProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalMetrics.totalTodayProfit >= 0 ? '+' : ''}¥{formatNumber(totalMetrics.totalTodayProfit)}
            </p>
          </div>
        </div>

        {/* 表格 */}
        {holdings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无持仓数据</p>
            <p className="text-sm">点击上方按钮添加持仓</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('stockCode')}>
                    代码 <SortIcon field="stockCode" />
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('stockName')}>
                    名称 <SortIcon field="stockName" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('shares')}>
                    持仓 <SortIcon field="shares" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('costPrice')}>
                    成本价 <SortIcon field="costPrice" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('currentPrice')}>
                    当前价 <SortIcon field="currentPrice" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('changePercent')}>
                    涨跌幅 <SortIcon field="changePercent" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('changeAmount')}>
                    涨跌额 <SortIcon field="changeAmount" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('marketValue')}>
                    市值 <SortIcon field="marketValue" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('profitAmount')}>
                    盈亏 <SortIcon field="profitAmount" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('profitPercent')}>
                    盈亏% <SortIcon field="profitPercent" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('todayProfit')}>
                    今日盈亏 <SortIcon field="todayProfit" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('amplitude')}>
                    振幅 <SortIcon field="amplitude" />
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('turnoverRate')}>
                    换手率 <SortIcon field="turnoverRate" />
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">
                    换手率分析
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding) => {
                  const metrics = calculateMetrics(holding);
                  return (
                    <tr
                      key={holding.id}
                      onClick={() => handleRowClick(holding.id)}
                      className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-2">
                        <span className="font-mono text-xs font-medium">{holding.stockCode}</span>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-xs">{holding.stockName}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono text-xs">{formatNumber(holding.shares, 0)}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono text-xs">{formatNumber(metrics.costPrice, 4)}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-mono text-xs font-medium ${metrics.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatNumber(metrics.currentPrice, 4)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-mono text-xs font-bold ${metrics.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {metrics.changePercent >= 0 ? '+' : ''}{formatNumber(metrics.changePercent, 2)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-mono text-xs ${metrics.changeAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {metrics.changeAmount >= 0 ? '+' : ''}{formatNumber(metrics.changeAmount, 4)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono text-xs">¥{formatNumber(metrics.marketValue)}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`font-mono text-xs font-bold ${
                            metrics.profitAmount >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {metrics.profitAmount >= 0 ? '+' : ''}¥{formatNumber(metrics.profitAmount)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`font-mono text-xs font-bold ${
                            metrics.profitPercent >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {metrics.profitPercent >= 0 ? '+' : ''}{formatNumber(metrics.profitPercent)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className={`font-mono text-xs font-bold ${
                            metrics.todayProfit >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {metrics.todayProfit >= 0 ? '+' : ''}¥{formatNumber(metrics.todayProfit)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className="font-mono text-xs">{formatNumber(metrics.amplitude, 2)}%</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={`font-mono text-xs font-bold ${
                          metrics.turnoverRate >= 5 ? 'text-red-600' :
                          metrics.turnoverRate >= 3 ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                          {formatNumber(metrics.turnoverRate, 2)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-left">
                        {metrics.turnoverAnalysis ? (() => {
                          const parsed = parseTurnoverAnalysis(metrics.turnoverAnalysis);
                          const risks = parseRiskList(metrics.turnoverAnalysis);
                          return (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1 items-start">
                                {/* 阶段标注 */}
                                {parsed?.phase && (
                                  <Badge variant={
                                    parsed.phase === '低位堆量·吸筹' || parsed.phase === '真突破·主升' ? 'default' :
                                    parsed.phase === '高位爆量·出货' || parsed.phase === '阴跌出货·减仓' ? 'destructive' :
                                    'secondary'
                                  } className="text-xs">
                                    {parsed.phase}
                                  </Badge>
                                )}
                                {/* 量能状态 */}
                                {parsed?.volumeStatus && (
                                  <Badge variant="outline" className="text-xs">
                                    {parsed.volumeStatus}
                                  </Badge>
                                )}
                                <div
                                  className="text-xs text-muted-foreground max-w-xs cursor-help"
                                  title={metrics.turnoverAnalysis}
                                >
                                  {parsed?.summary || '点击查看详情'}
                                </div>
                              </div>
                              {/* 风险提示 */}
                              {risks.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-start">
                                  {risks.slice(0, 2).map((risk, index) => (
                                    <Badge key={index} variant="destructive" className="text-xs">
                                      ⚠️ {risk.type}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
