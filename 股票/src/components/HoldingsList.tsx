"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import HoldingCard from "@/components/HoldingCard";
import ManualAdd from "@/components/ManualAdd";

interface Holding {
  id: string;
  stockCode: string;
  stockName: string;
  shares: number;
  costPrice: string;
  currentPrice: string | null;
  latestAnalysis: any;
}

interface HoldingsListProps {
  holdings: Holding[];
  onUpdate: () => void;
}

export default function HoldingsList({ holdings, onUpdate }: HoldingsListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (updating) {
      fetchHoldings();
      setUpdating(false);
    }
  }, [updating]);

  const fetchHoldings = async () => {
    try {
      const response = await fetch("/api/holdings");
      const data = await response.json();
      if (data.success) {
        // 通知父组件更新
        onUpdate();
      }
    } catch (error) {
      console.error("获取持仓列表失败:", error);
    }
  };

  const handleRefreshAnalysis = async (holding: Holding) => {
    setRefreshingId(holding.id);

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

      const data = await response.json();

      if (data.success) {
        toast.success(`${holding.stockName} 分析已更新`);
        onUpdate();
      } else {
        toast.error(data.error || "分析失败");
      }
    } catch (error) {
      console.error("分析失败:", error);
      toast.error("分析失败，请重试");
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: string, stockName: string) => {
    if (!confirm(`确定要删除 ${stockName} 的持仓记录吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/holdings/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${stockName} 已删除`);
        onUpdate();
      } else {
        toast.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败，请重试");
    }
  };

  if (showAddModal) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">添加新持仓</h2>
            <ManualAdd onSuccess={() => { onUpdate(); setShowAddModal(false); }} />
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowAddModal(false)}
            >
              返回列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">我的持仓</h2>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          添加持仓
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {holdings.map((holding) => (
          <HoldingCard
            key={holding.id}
            holding={holding}
            onRefresh={() => handleRefreshAnalysis(holding)}
            onDelete={() => handleDelete(holding.id, holding.stockName)}
            onUpdate={() => {
              setUpdating(true);
              onUpdate();
            }}
            refreshing={refreshingId === holding.id}
          />
        ))}
      </div>
    </div>
  );
}
