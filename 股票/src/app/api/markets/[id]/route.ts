import { NextRequest, NextResponse } from "next/server";
import { marketManager } from "@/storage/database/marketManager";

// GET /api/markets/[id] - 获取潜力市场详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeCompanies = searchParams.get("includeCompanies") === "true";

    let data;
    if (includeCompanies) {
      data = await marketManager.getMarketWithCompanies(id);
    } else {
      data = await marketManager.getMarketById(id);
    }

    if (!data) {
      return NextResponse.json(
        { error: "潜力市场不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      market: data,
    });
  } catch (error) {
    console.error("获取潜力市场失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取潜力市场失败",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/markets/[id] - 更新潜力市场
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const market = await marketManager.updateMarket(id, body);

    if (!market) {
      return NextResponse.json(
        { error: "潜力市场不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      market,
    });
  } catch (error) {
    console.error("更新潜力市场失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新潜力市场失败",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/markets/[id] - 删除潜力市场
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await marketManager.deleteMarket(id);

    if (!success) {
      return NextResponse.json(
        { error: "潜力市场不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除潜力市场失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "删除潜力市场失败",
      },
      { status: 500 }
    );
  }
}
