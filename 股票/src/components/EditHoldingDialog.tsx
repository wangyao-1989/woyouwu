"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

interface EditHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: {
    id: string;
    stockCode: string;
    stockName: string;
    shares: number;
    costPrice: string;
  } | null;
  onSave: (id: string, data: { shares: number; costPrice: number }) => void;
}

export default function EditHoldingDialog({
  open,
  onOpenChange,
  holding,
  onSave,
}: EditHoldingDialogProps) {
  const [shares, setShares] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // 当 holding 变化时更新表单
  useEffect(() => {
    if (holding) {
      setShares(holding.shares.toString());
      setCostPrice(holding.costPrice);
    }
  }, [holding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!holding) return;

    const sharesNum = parseFloat(shares);
    const costPriceNum = parseFloat(costPrice);

    if (isNaN(sharesNum) || sharesNum < 0) {
      toast.error("请输入有效的持仓数量");
      return;
    }

    if (isNaN(costPriceNum) || costPriceNum < 0) {
      toast.error("请输入有效的成本价");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/holdings/${holding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shares: sharesNum,
          costPrice: costPriceNum,
        }),
      });

      // 先检查响应状态
      if (!response.ok) {
        console.error(`API 错误: ${response.status} ${response.statusText}`);
        toast.error(`服务器错误 (${response.status})`);
        return;
      }

      // 检查响应内容类型
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("响应不是 JSON 格式:", contentType);
        toast.error("服务器返回了无效数据");
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("更新成功");
        onSave(holding.id, { shares: sharesNum, costPrice: costPriceNum });
        onOpenChange(false);
      } else {
        toast.error(data.error || "更新失败");
      }
    } catch (error) {
      console.error("更新失败:", error);
      toast.error("更新失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑持仓信息</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {holding?.stockName} ({holding?.stockCode})
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="shares">持仓数量 *</Label>
            <Input
              id="shares"
              type="number"
              placeholder="0"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min={0}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPrice">成本价 (元) *</Label>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
