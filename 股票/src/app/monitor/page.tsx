"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle, MinusCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import HoldingsMonitor from "@/components/HoldingsMonitor";
import MonitorHeader from "@/components/MonitorHeader";

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
  totalMarketCap?: number;
  circulateMarketCap?: number;
}

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  type: "stock" | "etf";
  shares?: number;
  costPrice?: string;
  currentPrice: string | null;
  stockData?: StockData;
}

// 监控的标的清单
const MONITOR_HOLDINGS: Holding[] = [
  { id: "1", stockCode: "002706", stockName: "良信股份", type: "stock", currentPrice: null },
  { id: "2", stockCode: "589030", stockName: "科创芯片设计ETF", type: "etf", currentPrice: null },
  { id: "3", stockCode: "159740", stockName: "恒生科技ETF", type: "etf", currentPrice: null },
  { id: "4", stockCode: "600276", stockName: "恒瑞医药", type: "stock", currentPrice: null },
  { id: "5", stockCode: "601238", stockName: "广汽集团", type: "stock", currentPrice: null },
  { id: "6", stockCode: "601318", stockName: "中国平安", type: "stock", currentPrice: null },
];

export default function MonitorPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // 获取所有监控标的的实时数据
  const fetchMonitorData = async (showToast: boolean = false) => {
    setRefreshing(true);
    if (showToast) {
      toast.info("正在获取实时数据...");
    }

    try {
      const dataPromises = MONITOR_HOLDINGS.map(async (holding) => {
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
              ...holding,
              currentPrice: data.currentPrice,
              stockData: data,
            };
          }
          return holding;
        } catch (error) {
          console.error(`获取 ${holding.stockName} 数据失败:`, error);
          return holding;
        }
      });

      const results = await Promise.all(dataPromises);
      setHoldings(results);
      setLastUpdateTime(new Date());

      if (showToast) {
        toast.success("数据更新完成");
      }
    } catch (error) {
      console.error("获取监控数据失败:", error);
      if (showToast) {
        toast.error("获取数据失败，请重试");
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchMonitorData();
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    fetchMonitorData(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* 顶部组合总览 */}
        <MonitorHeader
          holdings={holdings}
          refreshing={refreshing}
          lastUpdateTime={lastUpdateTime}
          onRefresh={handleRefresh}
        />

        {/* 个股卡片列表 */}
        <HoldingsMonitor holdings={holdings} />
      </div>
    </div>
  );
}
