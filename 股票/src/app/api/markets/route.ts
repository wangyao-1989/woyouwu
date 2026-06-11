import { NextRequest, NextResponse } from "next/server";
import { marketManager } from "@/storage/database/marketManager";

// GET /api/markets - 获取所有潜力市场
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeCompanies = searchParams.get("includeCompanies") === "true";

    let data;
    if (includeCompanies) {
      data = await marketManager.getAllMarketsWithCompanies();
    } else {
      data = await marketManager.getMarkets();
    }

    // 排序：热门板块在前，潜力市场在后
    data.sort((a, b) => {
      // hot 排在 potential 前面
      const typeOrder: Record<string, number> = { hot: 0, potential: 1 };
      const aType = a.marketType || "potential";
      const bType = b.marketType || "potential";
      const typeDiff = (typeOrder[aType] ?? 1) - (typeOrder[bType] ?? 1);
      if (typeDiff !== 0) return typeDiff;
      // 同类型按潜力评分降序
      return (b.potentialScore || 0) - (a.potentialScore || 0);
    });

    return NextResponse.json({
      success: true,
      markets: data,
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

// POST /api/markets - 创建潜力市场
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, attentionScore, potentialScore, icon, tags } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "市场名称和描述不能为空" },
        { status: 400 }
      );
    }

    const market = await marketManager.createMarket({
      name,
      description,
      attentionScore: attentionScore || 50,
      potentialScore: potentialScore || 50,
      icon,
      tags: tags || [],
    });

    return NextResponse.json({
      success: true,
      market,
    });
  } catch (error) {
    console.error("创建潜力市场失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "创建潜力市场失败",
      },
      { status: 500 }
    );
  }
}
