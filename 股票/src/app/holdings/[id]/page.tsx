"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import EditHoldingDialog from "@/components/EditHoldingDialog";
import StockMonitorHelper from "@/components/StockMonitorHelper";
import PositionIncreaseDiscussion from "@/components/PositionIncreaseDiscussion";
import PositionCalculator from "@/components/PositionCalculator";

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  sector?: string;
  shares: number;
  costPrice: string;
  currentPrice: string | null;
  latestAnalysis: any;
  analyses: any[];
  createdAt: string;
  updatedAt: string;
}

export default function HoldingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [holding, setHolding] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingPrice, setRefreshingPrice] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchHolding = async (fetchPrice = true) => {
    try {
      const response = await fetch(`/api/holdings/${id}`);

      if (!response.ok) {
        console.error("获取持仓详情失败:", response.status);
        toast.error("获取持仓详情失败");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setHolding(data.holding);

        // 【优化】异步获取实时股价，不阻塞主要内容显示
        if (fetchPrice && data.holding) {
          // 使用 setTimeout 将股价获取放到下一个事件循环，避免阻塞渲染
          setTimeout(() => {
            fetchCurrentPrice(data.holding.stockCode, data.holding.stockName, false).then(price => {
              if (price) {
                setHolding((prev) => {
                  if (!prev) return prev;
                  return { ...prev, currentPrice: price };
                });
              }
            });
          }, 0);
        }
      } else {
        toast.error("获取持仓详情失败");
      }
    } catch (error) {
      console.error("获取持仓详情失败:", error);
      toast.error("获取持仓详情失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPrice = async (stockCode: string, stockName: string, updateDb = true): Promise<string | null> => {
    try {
      const response = await fetch("/api/stocks/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCode,
          stockName,
        }),
      });

      if (!response.ok) {
        console.error("获取股价失败:", response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.currentPrice) {
        // 根据 updateDb 参数决定是否更新数据库
        if (updateDb) {
          try {
            const updateResponse = await fetch(`/api/holdings/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                currentPrice: data.currentPrice,
              }),
            });
            if (!updateResponse.ok) {
              console.error("更新股价到数据库失败:", updateResponse.status);
            }
          } catch (error) {
            console.error("更新股价到数据库出错:", error);
          }
        }
        return data.currentPrice;
      }
      return null;
    } catch (error) {
      console.error("获取股价失败:", error);
      return null;
    }
  };

  const refreshAnalysis = async () => {
    if (!holding) return;

    setRefreshing(true);
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
        toast.success("分析已刷新");
        await fetchHolding();
      } else {
        toast.error("刷新失败");
      }
    } catch (error) {
      console.error("刷新失败:", error);
      toast.error("刷新失败");
    } finally {
      setRefreshing(false);
    }
  };

  const refreshPrice = async () => {
    if (!holding) return;

    setRefreshingPrice(true);
    try {
      const price = await fetchCurrentPrice(holding.stockCode, holding.stockName);
      if (price) {
        setHolding((prev) => {
          if (!prev) return prev;
          return { ...prev, currentPrice: price };
        });
        toast.success("股价已更新");
      } else {
        toast.warning("未能获取到股价");
      }
    } catch (error) {
      console.error("获取股价失败:", error);
      toast.error("获取股价失败");
    } finally {
      setRefreshingPrice(false);
    }
  };

  const deleteHolding = async () => {
    if (!confirm(`确定要删除 ${holding?.stockName} 的持仓吗？`)) return;

    try {
      const response = await fetch(`/api/holdings/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("删除成功");
        router.push("/");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  useEffect(() => {
    fetchHolding();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!holding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">持仓不存在</h2>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  const shares = holding.shares || 0;
  const costPrice = parseFloat(holding.costPrice) || 0;
  const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : costPrice;

  const totalCost = shares * costPrice;
  const currentValue = shares * currentPrice;
  const profit = currentValue - totalCost;
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  const isIncomplete = !holding.shares || holding.shares === 0 || !holding.costPrice || holding.costPrice === "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{holding.stockName}</h1>
                  <span className="text-sm text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {holding.stockCode}
                  </span>
                  {holding.sector && (
                    <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                      {holding.sector}
                    </span>
                  )}
                </div>
                {isIncomplete && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>信息不完整，请补充</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshAnalysis} disabled={refreshing} variant="outline" className="gap-2">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                刷新分析
              </Button>
              <Button onClick={refreshPrice} disabled={refreshingPrice} variant="outline" className="gap-2">
                <TrendingUp className={`w-4 h-4 ${refreshingPrice ? "animate-pulse" : ""}`} />
                {refreshingPrice ? "获取中..." : "刷新价格"}
              </Button>
              <Button onClick={() => setShowEditDialog(true)} variant="outline" className="gap-2">
                <Edit2 className="w-4 h-4" />
                编辑
              </Button>
              <Button onClick={deleteHolding} variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* 总览 Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* 持仓信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>持仓信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">持仓数量</p>
                    <p className="text-2xl font-bold font-mono">{shares.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">股</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">成本价</p>
                    <p className="text-2xl font-bold font-mono">¥{costPrice.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">当前价</p>
                    <p className="text-2xl font-bold font-mono">¥{currentPrice.toFixed(4)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">盈亏</p>
                    <div className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {profit >= 0 ? '+' : ''}¥{profit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center gap-1 text-sm mt-1 ${profit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">持仓成本</p>
                    <p className="text-xl font-bold font-mono">¥{totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">当前市值</p>
                    <p className="text-xl font-bold font-mono">¥{currentValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 最新分析 */}
            {holding.latestAnalysis && (
              <div className="space-y-6">
                {/* 盯盘助手 */}
                <StockMonitorHelper
                  stockCode={holding.stockCode}
                  stockName={holding.stockName}
                  stockData={{
                    currentPrice: holding.currentPrice || undefined,
                    changePercent: profitPercent,
                    changeAmount: (currentPrice - costPrice) * holding.shares,
                  }}
                />

                {/* 加仓成本计算器 */}
                <PositionCalculator
                  currentShares={shares}
                  currentCostPrice={costPrice}
                  currentPrice={currentPrice}
                  stockName={holding.stockName}
                  stockCode={holding.stockCode}
                />

                {/* AI圆桌讨论：是否加仓 */}
                <PositionIncreaseDiscussion
                  holdingId={holding.id}
                  stockCode={holding.stockCode}
                  stockName={holding.stockName}
                  sector={holding.sector}
                />

                {/* 趋势分析卡片 */}
                {holding.latestAnalysis.content?.trends && (
                  <Card>
                    <CardHeader>
                      <CardTitle>趋势分析</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* 短期趋势 */}
                        {holding.latestAnalysis.content.trends.shortTerm && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-l-4 border-blue-500">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-blue-600" />
                              <h4 className="font-semibold text-blue-700">短期趋势</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {holding.latestAnalysis.content.trends.shortTerm}
                            </p>
                          </div>
                        )}

                        {/* 中期趋势 */}
                        {holding.latestAnalysis.content.trends.mediumTerm && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-l-4 border-purple-500">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-purple-600" />
                              <h4 className="font-semibold text-purple-700">中期趋势</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {holding.latestAnalysis.content.trends.mediumTerm}
                            </p>
                          </div>
                        )}

                        {/* 长期趋势 */}
                        {holding.latestAnalysis.content.trends.longTerm && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-green-600" />
                              <h4 className="font-semibold text-green-700">长期趋势</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {holding.latestAnalysis.content.trends.longTerm}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 资讯资讯卡片 */}
                {holding.latestAnalysis.content?.news && holding.latestAnalysis.content.news.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>相关资讯</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="all">全部</TabsTrigger>
                          <TabsTrigger value="positive" className="text-green-600">
                            利好消息
                          </TabsTrigger>
                          <TabsTrigger value="negative" className="text-red-600">
                            利空消息
                          </TabsTrigger>
                          <TabsTrigger value="neutral" className="text-slate-600">
                            中性消息
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-4">
                          <div className="space-y-3">
                            {holding.latestAnalysis.content.news.map((news: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border-l-4 ${
                                  news.sentiment === 'positive'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                    : news.sentiment === 'negative'
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-400'
                                }`}
                              >
                                <a
                                  href={news.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium hover:text-blue-600 transition-colors text-sm"
                                >
                                  {news.title}
                                </a>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {news.summary}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {news.publishTime?.split('T')[0] || ''}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      news.sentiment === 'positive'
                                        ? 'bg-green-100 text-green-700'
                                        : news.sentiment === 'negative'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {news.sentiment === 'positive'
                                      ? '利好'
                                      : news.sentiment === 'negative'
                                      ? '利空'
                                      : '中性'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="positive" className="mt-4">
                          <div className="space-y-3">
                            {holding.latestAnalysis.content.news
                              .filter((n: any) => n.sentiment === 'positive')
                              .map((news: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg"
                                >
                                  <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-green-700 transition-colors text-sm"
                                  >
                                    {news.title}
                                  </a>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {news.summary}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {news.publishTime?.split('T')[0] || ''}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="negative" className="mt-4">
                          <div className="space-y-3">
                            {holding.latestAnalysis.content.news
                              .filter((n: any) => n.sentiment === 'negative')
                              .map((news: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg"
                                >
                                  <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-red-700 transition-colors text-sm"
                                  >
                                    {news.title}
                                  </a>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {news.summary}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {news.publishTime?.split('T')[0] || ''}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="neutral" className="mt-4">
                          <div className="space-y-3">
                            {holding.latestAnalysis.content.news
                              .filter((n: any) => n.sentiment === 'neutral')
                              .map((news: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 bg-slate-50 dark:bg-slate-900 border-l-4 border-slate-400 rounded-r-lg"
                                >
                                  <a
                                    href={news.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-blue-600 transition-colors text-sm"
                                  >
                                    {news.title}
                                  </a>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {news.summary}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {news.publishTime?.split('T')[0] || ''}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 编辑对话框 */}
      {showEditDialog && (
        <EditHoldingDialog
          holding={holding}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={(id, data) => {
            // 立即更新前端状态
            setHolding((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                shares: data.shares,
                costPrice: data.costPrice.toString(),
              };
            });
            setShowEditDialog(false);
          }}
        />
      )}
    </div>
  );
}
