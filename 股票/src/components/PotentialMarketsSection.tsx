"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight, Sparkles, Flame, Target } from "lucide-react";
import { useRouter } from "next/navigation";

interface PotentialMarket {
  id: string;
  name: string;
  description: string;
  attentionScore: number;
  potentialScore: number;
  marketType?: string; // 市场类型
  icon?: string;
  tags: string[];
  createdAt: string;
}

export default function PotentialMarketsSection() {
  const router = useRouter();
  const [markets, setMarkets] = useState<PotentialMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"hot" | "potential">("hot");

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
      console.error("获取潜力市场失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          市场分析
        </h2>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-32 bg-muted/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          市场分析
        </h2>
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">暂无市场数据</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 根据标签页筛选市场
  const filteredMarkets = markets.filter(m => m.marketType === activeTab);

  // 只显示前 3 个
  const displayMarkets = filteredMarkets.slice(0, 3);

  return (
    <div className="py-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            市场分析
          </h2>
          {/* 标签切换 - 热门板块在前 */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={activeTab === "hot" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("hot")}
              className="gap-2 h-8"
            >
              <Flame className="w-3.5 h-3.5" />
              热门板块
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {markets.filter(m => m.marketType === "hot").length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === "potential" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("potential")}
              className="gap-2 h-8"
            >
              <Target className="w-3.5 h-3.5" />
              潜力市场
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {markets.filter(m => m.marketType === "potential").length}
              </Badge>
            </Button>
          </div>
        </div>
        {filteredMarkets.length > 3 && (
          <Button
            variant="ghost"
            onClick={() => router.push("/markets")}
            className="gap-2 text-sm"
          >
            查看全部
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 卡片网格 */}
      <div className="grid gap-4 md:grid-cols-3">
        {displayMarkets.length === 0 ? (
          <Card className="col-span-3">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无{activeTab === "potential" ? "潜力市场" : "热门板块"}数据</p>
            </CardContent>
          </Card>
        ) : (
          displayMarkets.map((market) => (
            <Card
              key={market.id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden group ${
                market.marketType === "hot"
                  ? "border-l-4 border-l-red-500"
                  : "border-l-4 border-l-primary"
              }`}
              onClick={() => router.push(`/markets/${market.id}`)}
            >
              {/* 卡片头部 - 标题+标签 */}
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base font-bold truncate">
                        {market.name}
                      </CardTitle>
                      {market.marketType === "hot" && (
                        <Badge variant="destructive" className="text-[10px] h-5 shrink-0">
                          热门
                        </Badge>
                      )}
                    </div>
                    {/* 标签行 */}
                    {market.tags && market.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {market.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-[10px] h-5 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                        {market.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            +{market.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* 卡片内容 */}
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {/* 描述 - 提前显示 */}
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {market.description}
                </p>

                {/* 评分区域 - 水平布局 */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  {/* 潜力评分 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        潜力评分
                      </span>
                      <span className={`text-sm font-bold ${
                        market.marketType === "hot" ? "text-red-600" : "text-primary"
                      }`}>
                        {market.potentialScore}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          market.marketType === "hot" ? "bg-red-500" : "bg-primary"
                        }`}
                        style={{ width: `${market.potentialScore}%` }}
                      />
                    </div>
                  </div>

                  {/* 关注度 */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        关注度
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        {market.attentionScore}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-muted-foreground/50 transition-all duration-500"
                        style={{ width: `${market.attentionScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 悬停提示 */}
                <div className="flex items-center justify-end text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  点击查看详情
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
