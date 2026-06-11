"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface PotentialMarket {
  id: string;
  name: string;
  description: string;
  attentionScore: number;
  potentialScore: number;
  marketType?: string;
  icon?: string;
  tags: string[];
  createdAt: string;
}

export default function MarketsPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<PotentialMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "potential" | "hot">("all");

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      const response = await fetch("/api/markets");
      const data = await response.json();

      if (data.success) {
        setMarkets(data.markets);
      }
    } catch (error) {
      console.error("获取市场数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 根据标签页筛选市场
  const filteredMarkets = markets.filter(m => {
    if (activeTab === "all") return true;
    return m.marketType === activeTab;
  });

  // 按潜力评分排序
  const sortedMarkets = [...filteredMarkets].sort((a, b) => b.potentialScore - a.potentialScore);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
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
              <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  市场分析
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 标签页筛选 */}
        <div className="mb-6">
          <div className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg w-fit">
            <Button
              variant={activeTab === "all" ? "default" : "ghost"}
              onClick={() => setActiveTab("all")}
              className="gap-2"
            >
              全部市场
              <Badge variant="secondary" className="text-xs">
                {markets.length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === "potential" ? "default" : "ghost"}
              onClick={() => setActiveTab("potential")}
              className="gap-2"
            >
              潜力市场
              <Badge variant="secondary" className="text-xs">
                {markets.filter(m => m.marketType === "potential").length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === "hot" ? "default" : "ghost"}
              onClick={() => setActiveTab("hot")}
              className="gap-2"
            >
              热门板块
              <Badge variant="secondary" className="text-xs">
                {markets.filter(m => m.marketType === "hot").length}
              </Badge>
            </Button>
          </div>
        </div>

        {/* 说明文字 */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 潜力市场</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                低关注度（&lt;50%）但高潜力（&gt;85%）的早期板块，适合长期布局
              </p>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">🔥 热门板块</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                高关注度（&gt;55%）且受市场追捧的板块，需要谨慎评估风险
              </p>
            </div>
          </div>
        </div>

        {/* 市场列表 */}
        {sortedMarkets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无市场数据</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedMarkets.map((market) => (
              <Card
                key={market.id}
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
                  market.marketType === "hot"
                    ? "border-l-red-500"
                    : "border-l-purple-500"
                }`}
                onClick={() => router.push(`/markets/${market.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg font-bold">
                          {market.name}
                        </CardTitle>
                        {market.marketType === "hot" && (
                          <Badge variant="destructive" className="text-xs">热门</Badge>
                        )}
                        {market.marketType === "potential" && (
                          <Badge variant="secondary" className="text-xs">潜力</Badge>
                        )}
                      </div>
                      {market.tags && market.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {market.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {market.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{market.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 描述 */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {market.description}
                  </p>

                  {/* 评分 */}
                  <div className="space-y-3">
                    {/* 潜力评分 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">潜力评分</span>
                        <span className={`text-sm font-bold ${
                          market.marketType === "hot" ? "text-red-600" : "text-purple-600"
                        }`}>
                          {market.potentialScore}/100
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            market.marketType === "hot" ? "bg-red-600" : "bg-purple-600"
                          }`}
                          style={{ width: `${market.potentialScore}%` }}
                        />
                      </div>
                    </div>

                    {/* 关注度 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">市场关注度</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                          {market.attentionScore}/100
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-500 transition-all duration-500"
                          style={{ width: `${market.attentionScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 分析状态 */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {market.marketType === "hot" ? (
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      )}
                      <span>
                        {market.marketType === "hot"
                          ? "点击查看热门板块深度分析"
                          : "点击查看潜力市场深度分析"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
