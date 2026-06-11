"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react";

interface StockData {
  changePercent?: number;
}

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  currentPrice: string | null;
  stockData?: StockData;
}

interface MonitorHeaderProps {
  holdings: Holding[];
  refreshing: boolean;
  lastUpdateTime: Date | null;
  onRefresh: () => void;
}

export default function MonitorHeader({
  holdings,
  refreshing,
  lastUpdateTime,
  onRefresh,
}: MonitorHeaderProps) {
  // 计算组合统计数据
  const stats = holdings.reduce(
    (acc, holding) => {
      if (holding.stockData) {
        const changePercent = holding.stockData.changePercent || 0;
        acc.totalChangePercent += changePercent;

        if (changePercent > 0) {
          acc.gainCount++;
          acc.gainAmount += changePercent;
        } else if (changePercent < 0) {
          acc.lossCount++;
        }
      }
      acc.totalCount++;
      return acc;
    },
    {
      totalCount: 0,
      gainCount: 0,
      lossCount: 0,
      totalChangePercent: 0,
      gainAmount: 0,
    }
  );

  const avgChangePercent = stats.totalCount > 0
    ? stats.totalChangePercent / stats.totalCount
    : 0;

  // 计算整体健康度
  const healthScore = stats.totalCount > 0
    ? (stats.gainCount / stats.totalCount) * 100
    : 0;

  // 生成操作建议
  const generateAdvice = () => {
    if (stats.lossCount >= 2) {
      return {
        text: "建议降低整体仓位",
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/20",
      };
    } else if (stats.gainCount >= 4) {
      return {
        text: "市场强势，可适当加仓",
        icon: TrendingUp,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/20",
      };
    } else {
      return {
        text: "保持观望，耐心等待",
        icon: Activity,
        color: "text-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900/20",
      };
    }
  };

  const advice = generateAdvice();
  const AdviceIcon = advice.icon;

  // 格式化时间
  const formatTime = (date: Date | null) => {
    if (!date) return "--:--:--";
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">持仓监控</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 今日盈亏 */}
        <div className="flex items-center justify-between py-2 px-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <span className="text-sm text-muted-foreground">今日盈亏（估算）</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                avgChangePercent >= 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {avgChangePercent >= 0 ? "+" : ""}
              {avgChangePercent.toFixed(2)}%
            </span>
            {avgChangePercent >= 0 ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-600" />
            )}
          </div>
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">强势</div>
            <div className="text-2xl font-bold text-red-600">{stats.gainCount}</div>
          </div>
          <div className="text-center py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">风险</div>
            <div className="text-2xl font-bold text-green-600">{stats.lossCount}</div>
          </div>
          <div className="text-center py-2 px-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">健康度</div>
            <div className="text-2xl font-bold text-blue-600">{healthScore.toFixed(0)}%</div>
          </div>
        </div>

        {/* 整体建议 */}
        <div className={`flex items-center gap-2 py-3 px-4 rounded-lg ${advice.bgColor}`}>
          <AdviceIcon className={`w-5 h-5 ${advice.color}`} />
          <span className={`font-semibold ${advice.color}`}>{advice.text}</span>
        </div>

        {/* 数据更新时间 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>数据更新时间</span>
          <span className="font-mono">{formatTime(lastUpdateTime)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
