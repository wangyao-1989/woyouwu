import { NextRequest, NextResponse } from "next/server";
import { holdingManager } from "@/storage/database/holdingManager";

// 获取所有持仓列表
export async function GET(request: NextRequest) {
  try {
    const holdings = await holdingManager.getHoldingsWithLatestAnalysis();

    const result = holdings.map((h) => ({
      id: h.id,
      stockCode: h.stockCode,
      stockName: h.stockName,
      shares: h.shares,
      costPrice: h.costPrice || "0.0000",
      currentPrice: h.currentPrice || null,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      latestAnalysis: h.latestAnalysis
        ? {
            ...h.latestAnalysis,
            content: h.latestAnalysis.content as any,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      holdings: result,
    });
  } catch (error) {
    console.error("获取持仓列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取失败",
      },
      { status: 500 }
    );
  }
}

// 创建新持仓（手动添加）
export async function POST(request: NextRequest) {
  try {
    const { stockCode, stockName, shares, costPrice } = await request.json();

    if (!stockCode || !stockName) {
      return NextResponse.json(
        { error: "股票代码和名称不能为空" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await holdingManager.getHoldingByCode(stockCode);

    if (existing) {
      return NextResponse.json(
        { error: "该股票已存在，请更新现有持仓" },
        { status: 400 }
      );
    }

    const holding = await holdingManager.createHolding({
      stockCode,
      stockName,
      shares: shares !== null && shares !== undefined ? Number(shares) : 0,
      costPrice: (costPrice !== null && costPrice !== undefined ? Number(costPrice) : 0).toString(),
    });

    return NextResponse.json({
      success: true,
      holding: {
        ...holding,
        costPrice: holding.costPrice || "0.0000",
      },
    });
  } catch (error) {
    console.error("创建持仓失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "创建失败",
      },
      { status: 500 }
    );
  }
}
