import { NextRequest, NextResponse } from "next/server";
import { getDb } from "coze-coding-dev-sdk";
import { potentialMarkets, marketCompanies } from "@/storage/database/shared/schema";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/storage/database/shared/schema";

// 清理重复的市场数据
export async function POST(request: NextRequest) {
  try {
    const db = await getDb(schema);

    // 1. 获取所有市场
    const allMarkets = await db.query.potentialMarkets.findMany();

    // 2. 找出重复的市场（按名称分组）
    const nameMap = new Map<string, typeof allMarkets>();

    for (const market of allMarkets) {
      const existing = nameMap.get(market.name) || [];
      existing.push(market);
      nameMap.set(market.name, existing);
    }

    // 3. 找出需要删除的重复项（保留最早创建的）
    const toDelete: string[] = [];
    const duplicates: string[] = [];

    for (const [name, markets] of nameMap) {
      if (markets.length > 1) {
        // 按创建时间排序，保留最早的
        markets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        // 删除后面的（保留第一个）
        for (let i = 1; i < markets.length; i++) {
          toDelete.push(markets[i].id);
          duplicates.push(`${name} (删除ID: ${markets[i].id.slice(0, 8)}...)`);
        }
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "没有发现重复数据",
        deleted: 0,
      });
    }

    // 4. 删除重复市场及其关联的企业
    for (const marketId of toDelete) {
      // 先删除关联的企业
      await db.delete(marketCompanies).where(eq(marketCompanies.marketId, marketId));
      // 再删除市场
      await db.delete(potentialMarkets).where(eq(potentialMarkets.id, marketId));
    }

    return NextResponse.json({
      success: true,
      message: `成功清理 ${toDelete.length} 条重复记录`,
      deleted: toDelete.length,
      details: duplicates,
    });

  } catch (error) {
    console.error("清理重复数据失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "清理重复数据失败",
      },
      { status: 500 }
    );
  }
}
