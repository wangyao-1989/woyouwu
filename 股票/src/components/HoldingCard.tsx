"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, Edit } from "lucide-react";
import EditHoldingDialog from "./EditHoldingDialog";

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  shares: number;
  costPrice: string;
  currentPrice: string | null;
  latestAnalysis: any;
}

interface HoldingCardProps {
  holding: Holding;
  onRefresh: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  refreshing: boolean;
}

export default function HoldingCard({ holding, onRefresh, onDelete, onUpdate, refreshing }: HoldingCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const analysis = holding.latestAnalysis?.content as any;
  const isMissingInfo = holding.shares === 0 || parseFloat(holding.costPrice) === 0;

  const getActionBadge = (action: string) => {
    switch (action) {
      case "buy":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            买入
          </Badge>
        );
      case "sell":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <TrendingDown className="w-3 h-3 mr-1" />
            卖出
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Minus className="w-3 h-3 mr-1" />
            持有
          </Badge>
        );
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">低风险</Badge>;
      case "high":
        return <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">高风险</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">中风险</Badge>;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">利好</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">利空</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">中性</Badge>;
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{holding.stockName}</CardTitle>
              <p className="text-sm text-muted-foreground">{holding.stockCode}</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 持仓信息 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">持仓数量</p>
              <p className="font-semibold">{holding.shares} 股</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">成本价</p>
              <p className="font-semibold">¥{holding.costPrice}</p>
            </div>
          </div>

          {/* 缺失信息提示 */}
          {isMissingInfo && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    持仓信息不完整
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                    请补充持仓数量和成本价
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    补充信息
                  </Button>
                </div>
              </div>
            </div>
          )}

          {analysis ? (
            <div className="space-y-3 pt-3 border-t">
              {/* 分析建议 */}
              {analysis.suggestions && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">操作建议:</span>
                  <div className="flex items-center gap-2">
                    {getActionBadge(analysis.suggestions.action)}
                    {getRiskBadge(analysis.suggestions.riskLevel)}
                  </div>
                </div>
              )}

              {/* 理由 */}
              {analysis.suggestions?.reason && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {analysis.suggestions.reason}
                  </p>
                </div>
              )}

              {/* 行业信息 */}
              {analysis.industry && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">所属行业</p>
                  <Badge variant="secondary">{analysis.industry}</Badge>
                </div>
              )}

              {/* 最新资讯 */}
              {analysis.news && analysis.news.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">最新资讯</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {analysis.news.slice(0, 3).map((news: any, idx: number) => (
                      <div key={idx} className="text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium line-clamp-1">{news.title}</p>
                          {getSentimentBadge(news.sentiment)}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                          {news.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 趋势分析 */}
              {analysis.trends && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">趋势分析</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <p className="text-muted-foreground mb-1">短期</p>
                      <p className="font-medium">{analysis.trends.shortTerm}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <p className="text-muted-foreground mb-1">中期</p>
                      <p className="font-medium">{analysis.trends.mediumTerm}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                      <p className="text-muted-foreground mb-1">长期</p>
                      <p className="font-medium">{analysis.trends.longTerm}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 更新时间 */}
              {holding.latestAnalysis && (
                <p className="text-xs text-muted-foreground text-right">
                  更新时间: {new Date(holding.latestAnalysis.createdAt).toLocaleString("zh-CN")}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">暂无分析数据</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="mt-3 gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                获取分析
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EditHoldingDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        holding={holding}
        onSave={() => {
          onUpdate();
          setEditDialogOpen(false);
        }}
      />
    </>
  );
}
