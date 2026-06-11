"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  shares: number;
  costPrice: string;
  currentPrice: string | null;
  latestAnalysis: any;
  stockData?: {
    turnoverRate?: number;
    turnoverAnalysis?: string;
    changePercent?: number;
  };
}

interface HoldingsGridProps {
  holdings: Holding[];
  onUpdate: () => void;
}

export default function HoldingsGrid({ holdings, onUpdate }: HoldingsGridProps) {
  const router = useRouter();

  const handleCardClick = (id: string) => {
    router.push(`/holdings/${id}`);
  };

  const getProfitInfo = (holding: Holding) => {
    const shares = holding.shares || 0;
    const costPrice = parseFloat(holding.costPrice) || 0;
    // 如果没有当前价，使用成本价计算
    const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : costPrice;

    const profit = (currentPrice - costPrice) * shares;
    const profitPercent = costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;

    return { profit, profitPercent, currentPrice };
  };

  // 解析换手率分析结果，提取关键信息
  const parseTurnoverAnalysis = (analysis: string | null) => {
    if (!analysis) return null;

    const result = {
      phase: null as '低位堆量·吸筹' | '缩量洗盘' | '真突破·主升' | '高位爆量·出货' | '阴跌出货·减仓' | '震荡观望' | null,
      volumeStatus: null as '地量' | '缩量' | '温和放量' | '放量' | '爆量' | null,
      summary: '',
    };

    // 提取阶段标注
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 按收益率从高到低排序 */}
      {[...holdings]
        .map((holding) => {
          const { profit, profitPercent, currentPrice } = getProfitInfo(holding);
          return { holding, profit, profitPercent, currentPrice };
        })
        .sort((a, b) => b.profitPercent - a.profitPercent)
        .map(({ holding, profit, profitPercent, currentPrice }) => {
        const isIncomplete = !holding.shares || holding.shares === 0 || !holding.costPrice || holding.costPrice === "0";

        return (
          <Card
            key={holding.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
            style={{
              borderLeftColor: profit >= 0 ? '#22c55e' : '#ef4444'
            }}
            onClick={() => handleCardClick(holding.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg font-bold">
                      {holding.stockName}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground font-mono">
                      {holding.stockCode}
                    </span>
                  </div>
                  {isIncomplete && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>信息不完整，请补充</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 持仓数量和成本价 */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">持仓数量</span>
                <span className="font-medium font-mono">{holding.shares.toLocaleString()} 股</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">成本价</span>
                <span className="font-medium font-mono">¥{parseFloat(holding.costPrice).toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">当前价</span>
                <span className="font-medium font-mono">
                  ¥{currentPrice.toFixed(4)}
                </span>
              </div>

              {/* 收益信息 */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">盈亏</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold font-mono ${profit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {profit >= 0 ? '+' : ''}¥{profit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${profit >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 换手率信息 */}
              {holding.stockData && holding.stockData.turnoverRate !== undefined && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">换手率</span>
                    <span className={`font-medium font-mono ${
                      holding.stockData.turnoverRate >= 5 ? 'text-red-600' : 
                      holding.stockData.turnoverRate >= 3 ? 'text-amber-600' : 
                      'text-green-600'
                    }`}>
                      {holding.stockData.turnoverRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              {/* 换手率分析 */}
              {holding.stockData && holding.stockData.turnoverAnalysis && (() => {
                const parsed = parseTurnoverAnalysis(holding.stockData.turnoverAnalysis);
                return (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">换手率分析</p>
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
                    </div>
                  </div>
                );
              })()}

              {/* 最新分析摘要 */}
              {holding.latestAnalysis && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {holding.latestAnalysis.content?.suggestions?.reason || "暂无分析"}
                  </p>
                </div>
              )}

              {/* 风险清单 */}
              {holding.stockData && holding.stockData.turnoverAnalysis && (() => {
                const risks = parseRiskList(holding.stockData.turnoverAnalysis);
                if (risks.length === 0) return null;

                return (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-red-600 font-semibold mb-2">⚠️ 重大风险</p>
                    <div className="space-y-1">
                      {risks.slice(0, 2).map((risk, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span className="line-clamp-1">{risk.type}: {risk.condition.substring(0, 20)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
