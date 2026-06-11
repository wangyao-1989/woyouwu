"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Plus, RefreshCw, TrendingUp, TrendingDown, DollarSign, Clock, Activity } from "lucide-react";
import { toast } from "sonner";
import HoldingsGrid from "@/components/HoldingsGrid";
import UploadSection from "@/components/UploadSection";
import ManualAdd from "@/components/ManualAdd";
import PotentialMarketsSection from "@/components/PotentialMarketsSection";

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
  totalMarketCap?: number;
  circulateMarketCap?: number;
  pe?: number;
  pb?: number;
  turnoverAnalysis?: any; // 换手率分析结果
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

export default function Home() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const holdingsRef = useRef<Holding[]>([]); // 使用 ref 存储最新的 holdings
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // 【优化】默认关闭自动刷新
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // 【优化】改为30秒刷新一次

  // 防止并发调用 fetchHoldings
  const [isFetching, setIsFetching] = useState(false);

  // 添加状态追踪日志
  useEffect(() => {
    console.log("状态变化:", { loading, holdingsLength: holdings.length, refreshingPrices });
  }, [loading, holdings.length, refreshingPrices]);

  // 更新 ref
  useEffect(() => {
    holdingsRef.current = holdings;
  }, [holdings]);

  // 自动刷新股价定时器
  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }

    console.log(`启用自动刷新，间隔: ${autoRefreshInterval} 秒`);

    const intervalId = setInterval(async () => {
      if (refreshingPrices || holdingsRef.current.length === 0) {
        return;
      }

      console.log("自动刷新股价...");

      setRefreshingPrices(true);

      try {
        const currentHoldings = holdingsRef.current;
        const priceUpdates = currentHoldings.map(async (holding) => {
          try {
            const response = await fetch("/api/stocks/price", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                stockCode: holding.stockCode,
                stockName: holding.stockName,
              }),
            });

            const data = await response.json();
            if (data.success && data.currentPrice) {
              return {
                id: holding.id,
                currentPrice: data.currentPrice,
                stockData: data
              };
            }
            return null;
          } catch (error) {
            console.error(`获取 ${holding.stockName} 股价失败:`, error);
            return null;
          }
        });

        const results = await Promise.all(priceUpdates);

        // 【优化】移除自动获取换手率分析
        const turnoverResults: any[] = [];

        const updatedHoldings = currentHoldings.map((holding) => {
          const update = results.find((r) => r && r.id === holding.id);
          const turnoverResult = turnoverResults.find((r) => r && r.id === holding.id);

          if (update) {
            return {
              ...holding,
              currentPrice: update.currentPrice,
              stockData: {
                ...update.stockData,
                turnoverAnalysis: turnoverResult?.turnoverAnalysis || holding.stockData?.turnoverAnalysis || null,
              }
            };
          }
          return holding;
        });

        if (updatedHoldings && updatedHoldings.length > 0) {
          setHoldings(updatedHoldings);
        }
      } catch (error) {
        console.error("自动刷新股价失败:", error);
      } finally {
        setRefreshingPrices(false);
      }
    }, autoRefreshInterval * 1000);

    return () => {
      console.log("清除自动刷新定时器");
      clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, autoRefreshInterval, refreshingPrices]);

  const fetchHoldings = async () => {
    // 防止并发调用
    if (isFetching) {
      console.log("fetchHoldings 已经在执行中，跳过");
      return;
    }

    console.log("fetchHoldings 开始执行");
    setIsFetching(true);
    setLoading(true);

    try {
      const response = await fetch("/api/holdings");
      const data = await response.json();

      console.log("API返回数据:", data);

      if (data.success) {
        console.log("持仓数量:", data.holdings.length);
        console.log("持仓列表:", data.holdings);

        // 验证数据有效性
        if (data.holdings && Array.isArray(data.holdings) && data.holdings.length >= 0) {
          // 先设置持仓数据
          setHoldings(data.holdings);
          console.log("已设置 holdings，长度:", data.holdings.length);

          // 然后获取股价
          if (data.holdings.length > 0) {
            console.log("开始获取股价...");
            await fetchCurrentPrices(data.holdings, false);
            console.log("股价获取完成");
          } else {
            console.log("持仓列表为空，跳过股价获取");
          }
        } else {
          console.error("API返回的持仓数据格式不正确:", data.holdings);
          toast.error("获取持仓数据格式错误");
        }
      } else {
        console.error("API返回失败:", data);
        toast.error("获取持仓数据失败");
      }
    } catch (error) {
      console.error("获取持仓列表失败:", error);
      toast.error("获取持仓列表失败");
    } finally {
      console.log("fetchHoldings 完成，设置 loading = false");
      setIsFetching(false);
      setLoading(false);
    }
  };

  const fetchCurrentPrices = async (holdingsList: Holding[], showToast: boolean = true) => {
    console.log("fetchCurrentPrices 开始执行，股票数量:", holdingsList.length);

    setRefreshingPrices(true);
    if (showToast) {
      toast.info("正在获取实时股价，请稍候...");
    }

    try {
      const priceUpdates = holdingsList.map(async (holding) => {
        try {
          console.log(`获取 ${holding.stockName} 的股价...`);
          const response = await fetch("/api/stocks/price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stockCode: holding.stockCode,
              stockName: holding.stockName,
            }),
          });

          const data = await response.json();
          console.log(`${holding.stockName} 股价结果:`, data);

          if (data.success && data.currentPrice) {
            return { 
              id: holding.id, 
              currentPrice: data.currentPrice,
              stockData: data
            };
          }
          return null;
        } catch (error) {
          console.error(`获取 ${holding.stockName} 股价失败:`, error);
          return null;
        }
      });

      const results = await Promise.all(priceUpdates);
      console.log("股价更新结果:", results);

      // 【优化】移除自动获取换手率分析，改为手动触发
      // 换手率分析会调用 LLM，耗时较长，不应在每次刷新股价时都调用
      const turnoverResults: any[] = [];

      // 更新持仓的当前价和stockData
      const updatedHoldings = holdingsList.map((holding) => {
        const priceUpdate = results.find((r) => r && r.id === holding.id);
        const turnoverResult = turnoverResults.find((r) => r && r.id === holding.id);

        if (priceUpdate) {
          const updated = { 
            ...holding, 
            currentPrice: priceUpdate.currentPrice,
            stockData: {
              ...priceUpdate.stockData,
              turnoverAnalysis: turnoverResult?.turnoverAnalysis || holding.stockData?.turnoverAnalysis || null,
            }
          };
          return updated;
        }
        return holding;
      });

      console.log("更新后的持仓列表:", updatedHoldings);

      // 添加保护：确保只有在有数据时才更新
      if (updatedHoldings && updatedHoldings.length > 0) {
        setHoldings(updatedHoldings);
        console.log("已更新 holdings");
      } else {
        console.warn("更新后的持仓列表为空，不更新状态");
      }
    } catch (error) {
      console.error("获取股价失败:", error);
      // 即使失败，也不清空 holdings
    } finally {
      setRefreshingPrices(false);
      if (showToast) {
        toast.success("股价已更新");
      }
      console.log("fetchCurrentPrices 完成");
    }
  };

  const refreshAllAnalysis = async () => {
    setRefreshing(true);
    let successCount = 0;
    let failCount = 0;

    for (const holding of holdings) {
      try {
        const response = await fetch("/api/stocks/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stockCode: holding.stockCode,
            stockName: holding.stockName,
            analysisType: "on_demand",
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    // 重新获取持仓列表
    await fetchHoldings();

    setRefreshing(false);

    if (successCount > 0) {
      toast.success(`成功更新 ${successCount} 只股票的分析`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} 只股票更新失败`);
    }
  };

  // 计算总览数据
  const summary = holdings.reduce(
    (acc, h) => {
      const shares = h.shares || 0;
      const costPrice = parseFloat(h.costPrice) || 0;
      const currentPrice = h.currentPrice ? parseFloat(h.currentPrice) : costPrice;

      const totalCost = shares * costPrice;
      const currentValue = shares * currentPrice;
      const profit = currentValue - totalCost;
      const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return {
        totalCost: acc.totalCost + totalCost,
        currentValue: acc.currentValue + currentValue,
        totalProfit: acc.totalProfit + profit,
        stocksCount: acc.stocksCount + 1,
      };
    },
    { totalCost: 0, currentValue: 0, totalProfit: 0, stocksCount: 0 }
  );

  const totalProfitPercent = summary.totalCost > 0 ? (summary.totalProfit / summary.totalCost) * 100 : 0;

  useEffect(() => {
    fetchHoldings();
  }, []);

  if (showAddModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">添加新持仓</h2>
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  返回
                </Button>
              </div>
              <ManualAdd onSuccess={() => { fetchHoldings(); setShowAddModal(false); }} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (showUploadModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">上传持仓截图</h2>
                <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
                  返回
                </Button>
              </div>
              <UploadSection onSuccess={() => { fetchHoldings(); setShowUploadModal(false); }} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  智能股票管家
                </h1>
                <p className="text-xs text-muted-foreground">
                  持仓总览
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {holdings.length > 0 && (
                <Button
                  onClick={refreshAllAnalysis}
                  disabled={refreshing}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  一键刷新
                </Button>
              )}
              <Button onClick={() => setShowUploadModal(true)} variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                上传截图
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                添加持仓
              </Button>
              <Button
                onClick={() => router.push('/monitor')}
                variant="outline"
                className="gap-2"
              >
                <Activity className="w-4 h-4" />
                持仓监控
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : holdings.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">欢迎使用智能股票管家</h2>
              <p className="text-muted-foreground mb-8">
                上传持仓截图或手动添加股票，AI 将自动为您识别并分析
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setShowUploadModal(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  上传截图
                </Button>
                <Button onClick={() => setShowAddModal(true)} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  手动添加
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 总览卡片 */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">持仓数量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.stocksCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">只股票</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">持仓成本</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{summary.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">总成本</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">持仓市值</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{summary.currentValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">当前市值</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">持仓收益</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {summary.totalProfit >= 0 ? '+' : ''}¥{summary.totalProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center ${totalProfitPercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalProfitPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-medium ml-1">{totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.totalProfit >= 0 ? '盈利' : '亏损'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 持仓概览 */}
            <div>
              <h2 className="text-2xl font-bold mb-4">持仓概览 ({holdings.length})</h2>
              {holdings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无持仓数据</p>
              ) : (
                <HoldingsGrid holdings={holdings} onUpdate={fetchHoldings} />
              )}
            </div>

            {/* 潜力市场 */}
            <PotentialMarketsSection />
          </div>
        )}
      </main>
    </div>
  );
}
