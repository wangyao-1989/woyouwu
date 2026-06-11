import { NextRequest, NextResponse } from "next/server";
import { holdingManager } from "@/storage/database/holdingManager";

// 获取单个持仓详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const holding = await holdingManager.getHoldingById(id);

    if (!holding) {
      return NextResponse.json(
        { error: "持仓不存在" },
        { status: 404 }
      );
    }

    const analysisRecords = await holdingManager.getAnalysisRecords(id);

    return NextResponse.json({
      success: true,
      holding: {
        ...holding,
        costPrice: holding.costPrice || "0.0000",
        currentPrice: holding.currentPrice || null,
        latestAnalysis: analysisRecords.length > 0 ? analysisRecords[0] : null,
      },
      analysisRecords,
    });
  } catch (error) {
    console.error("获取持仓详情失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取失败",
      },
      { status: 500 }
    );
  }
}

// 更新持仓
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { stockName, shares, costPrice, currentPrice } = await request.json();

    const updateData: any = {};

    if (stockName !== undefined) updateData.stockName = stockName;
    if (shares !== undefined) updateData.shares = Number(shares);
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice).toString();
    if (currentPrice !== undefined) updateData.currentPrice = Number(currentPrice).toString();

    const holding = await holdingManager.updateHolding(id, updateData);

    if (!holding) {
      return NextResponse.json(
        { error: "持仓不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      holding: {
        ...holding,
        costPrice: holding.costPrice || "0.0000",
        currentPrice: holding.currentPrice || null,
      },
    });
  } catch (error) {
    console.error("更新持仓失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新失败",
      },
      { status: 500 }
    );
  }
}

// 删除持仓
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = await holdingManager.deleteHolding(id);

    if (!success) {
      return NextResponse.json(
        { error: "持仓不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "持仓已删除",
    });
  } catch (error) {
    console.error("删除持仓失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "删除失败",
      },
      { status: 500 }
    );
  }
}
