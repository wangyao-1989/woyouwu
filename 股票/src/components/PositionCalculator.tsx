"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, TrendingDown, Minus, Info, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PositionCalculatorProps {
  currentShares: number;
  currentCostPrice: number;
  currentPrice: number;
  stockName: string;
  stockCode?: string;
}

export default function PositionCalculator({
  currentShares,
  currentCostPrice,
  currentPrice,
  stockName,
  stockCode = ""
}: PositionCalculatorProps) {
  const [addShares, setAddShares] = useState<string>("");
  const [addPrice, setAddPrice] = useState<string>(currentPrice.toFixed(4));
  const [commissionRate, setCommissionRate] = useState<string>("0.0001854");
  const [showSettings, setShowSettings] = useState(false);

  // 判断是否为沪市股票（需要收过户费）
  const isShanghaiStock = stockCode.startsWith('6') || stockCode.startsWith('5');

  // 计算结果
  const result = useMemo(() => {
    const shares = parseFloat(addShares) || 0;
    const price = parseFloat(addPrice) || 0;
    const rate = parseFloat(commissionRate) || 0.0001854;

    if (shares <= 0 || price <= 0) {
      return null;
    }

    // 成交金额
    const tradeAmount = shares * price;
    
    // 计算手续费
    // 1. 佣金（最低5元）
    let commission = tradeAmount * rate;
    const minCommission = 5; // 最低佣金5元
    commission = Math.max(commission, minCommission);
    
    // 2. 印花税（买入不收，卖出收0.1%）
    const stampDuty = 0;
    
    // 3. 过户费（沪市收，深市不收）费率0.001%
    const transferFee = isShanghaiStock ? tradeAmount * 0.00001 : 0;
    
    // 总手续费
    const totalFee = commission + stampDuty + transferFee;

    // 当前持仓成本
    const currentTotalCost = currentShares * currentCostPrice;
    
    // 加仓成本（含手续费）
    const addCost = tradeAmount + totalFee;
    
    // 新的总成本
    const newTotalCost = currentTotalCost + addCost;
    
    // 新的总股数
    const newTotalShares = currentShares + shares;
    
    // 新的成本价
    const newCostPrice = newTotalCost / newTotalShares;
    
    // 成本变化
    const costChange = newCostPrice - currentCostPrice;
    const costChangePercent = (costChange / currentCostPrice) * 100;

    // 不含手续费的成本价（用于对比）
    const newCostPriceWithoutFee = (currentTotalCost + tradeAmount) / newTotalShares;
    const feeImpact = newCostPrice - newCostPriceWithoutFee;

    return {
      currentTotalCost,
      tradeAmount,
      addCost,
      newTotalCost,
      newTotalShares,
      newCostPrice,
      costChange,
      costChangePercent,
      shares,
      price,
      // 手续费明细
      fees: {
        commission,
        stampDuty,
        transferFee,
        totalFee,
        minCommissionApplied: tradeAmount * rate < minCommission
      },
      feeImpact,
      newCostPriceWithoutFee
    };
  }, [addShares, addPrice, commissionRate, currentShares, currentCostPrice, isShanghaiStock]);

  // 快捷设置加仓数量
  const quickSetShares = (multiplier: number) => {
    const quickShares = Math.floor(currentShares * multiplier);
    setAddShares(quickShares.toString());
  };

  // 快捷设置加仓价格
  const quickSetPrice = (ratio: number) => {
    const quickPrice = currentPrice * ratio;
    setAddPrice(quickPrice.toFixed(4));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            加仓成本计算器
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 费率设置 */}
        {showSettings && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
            <div className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">费率设置</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="commissionRate" className="text-xs">佣金费率</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.0000001"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  当前费率：{(parseFloat(commissionRate) * 100).toFixed(4)}%（万{(parseFloat(commissionRate) * 10000).toFixed(2)}）
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">其他费率（自动计算）</div>
                <div className="text-xs space-y-1">
                  <div>• 最低佣金：5元</div>
                  <div>• 过户费：{isShanghaiStock ? '0.001%（沪市）' : '免（深市）'}</div>
                  <div>• 印花税：买入免收</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 当前持仓信息 */}
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg mb-4">
          <div className="text-sm text-muted-foreground mb-2">当前持仓</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">持有股数</div>
              <div className="text-lg font-bold font-mono">{currentShares.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">成本价</div>
              <div className="text-lg font-bold font-mono">¥{currentCostPrice.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">持仓成本</div>
              <div className="text-lg font-bold font-mono">
                ¥{(currentShares * currentCostPrice).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* 加仓输入 */}
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div className="space-y-2">
            <Label htmlFor="addShares">加仓股数</Label>
            <Input
              id="addShares"
              type="number"
              placeholder="输入加仓股数"
              value={addShares}
              onChange={(e) => setAddShares(e.target.value)}
            />
            <div className="flex gap-1 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetShares(0.25)}
              >
                1/4仓
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetShares(0.5)}
              >
                半仓
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetShares(1)}
              >
                等量
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetShares(2)}
              >
                双倍
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="addPrice">加仓价格</Label>
            <Input
              id="addPrice"
              type="number"
              step="0.0001"
              placeholder="输入加仓价格"
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
            />
            <div className="flex gap-1 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetPrice(0.95)}
              >
                -5%
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetPrice(0.98)}
              >
                -2%
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetPrice(1)}
              >
                现价
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-6"
                onClick={() => quickSetPrice(1.02)}
              >
                +2%
              </Button>
            </div>
          </div>
        </div>

        {/* 计算结果 */}
        {result && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-3">计算结果</div>
            
            {/* 主要结果 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">新成本价（含手续费）</div>
                  <div className="text-2xl font-bold font-mono text-blue-600">
                    ¥{result.newCostPrice.toFixed(4)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    result.costChange > 0 ? 'text-red-600' : 
                    result.costChange < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {result.costChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        成本升高
                      </>
                    ) : result.costChange < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        成本降低
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4" />
                        成本不变
                      </>
                    )}
                    <span className="font-mono">
                      {result.costChange >= 0 ? '+' : ''}{result.costChange.toFixed(4)} 
                      ({result.costChangePercent >= 0 ? '+' : ''}{result.costChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                  {result.feeImpact > 0 && (
                    <div className="text-xs text-amber-600 mt-1">
                      手续费使成本增加 ¥{result.feeImpact.toFixed(4)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">新持仓股数</div>
                  <div className="text-2xl font-bold font-mono">
                    {result.newTotalShares.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    新增 {result.shares.toLocaleString()} 股
                  </div>
                </div>
              </div>
            </div>

            {/* 手续费明细 */}
            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                <Info className="w-4 h-4" />
                交易手续费明细
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">成交金额</div>
                  <div className="font-mono font-semibold">
                    ¥{result.tradeAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    佣金
                    {result.fees.minCommissionApplied && (
                      <span className="text-amber-600 ml-1">(最低5元)</span>
                    )}
                  </div>
                  <div className="font-mono font-semibold">
                    ¥{result.fees.commission.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">过户费</div>
                  <div className="font-mono font-semibold">
                    {result.fees.transferFee > 0 ? `¥${result.fees.transferFee.toFixed(2)}` : '免'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground text-red-600">手续费合计</div>
                  <div className="font-mono font-semibold text-red-600">
                    ¥{result.fees.totalFee.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* 详细数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <div className="text-xs text-muted-foreground">原持仓成本</div>
                <div className="font-mono font-semibold">
                  ¥{result.currentTotalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <div className="text-xs text-muted-foreground">加仓金额+费用</div>
                <div className="font-mono font-semibold">
                  ¥{result.addCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <div className="text-xs text-muted-foreground">新总成本</div>
                <div className="font-mono font-semibold">
                  ¥{result.newTotalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <div className="text-xs text-muted-foreground">加仓均价</div>
                <div className="font-mono font-semibold">
                  ¥{result.price.toFixed(4)}
                </div>
              </div>
            </div>

            {/* 策略提示 */}
            {result.costChange < 0 && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
                💡 此操作可降低持仓成本，成本下降 {Math.abs(result.costChangePercent).toFixed(2)}%
              </div>
            )}
            {result.costChange > 0 && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm text-amber-700 dark:text-amber-400">
                ⚠️ 此操作会提高持仓成本，成本上升 {result.costChangePercent.toFixed(2)}%
              </div>
            )}
          </div>
        )}

        {/* 无输入时的提示 */}
        {!result && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            请输入加仓股数和价格，系统将自动计算新的持仓成本（含手续费）
          </div>
        )}
      </CardContent>
    </Card>
  );
}
