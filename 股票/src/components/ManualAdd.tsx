"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface ManualAddProps {
  onSuccess: () => void;
}

export default function ManualAdd({ onSuccess }: ManualAddProps) {
  const [stockCode, setStockCode] = useState("");
  const [stockName, setStockName] = useState("");
  const [shares, setShares] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCode || !stockName) {
      toast.error("请填写股票代码和名称");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCode: stockCode.toUpperCase(),
          stockName,
          shares: shares ? parseInt(shares) : 0,
          costPrice: costPrice ? parseFloat(costPrice) : 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("添加成功");
        setStockCode("");
        setStockName("");
        setShares("");
        setCostPrice("");
        onSuccess();
      } else {
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      console.error("添加失败:", error);
      toast.error("添加失败，请重试");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stockCode">股票代码 *</Label>
        <Input
          id="stockCode"
          placeholder="例如: 600519"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stockName">股票名称 *</Label>
        <Input
          id="stockName"
          placeholder="例如: 贵州茅台"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shares">持仓数量</Label>
          <Input
            id="shares"
            type="number"
            placeholder="0"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            min={0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPrice">成本价 (元)</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.0001"
            placeholder="0.0000"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            min={0}
          />
          <p className="text-xs text-muted-foreground">支持小数点后4位</p>
        </div>
      </div>

      <Button type="submit" disabled={adding} className="w-full gap-2">
        <Plus className="w-4 h-4" />
        {adding ? "添加中..." : "添加持仓"}
      </Button>
    </form>
  );
}
