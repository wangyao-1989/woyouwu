import { eq, and, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  holdings,
  analysisRecords,
  insertHoldingSchema,
  updateHoldingSchema,
  insertAnalysisRecordSchema,
} from "./shared/schema";
import type {
  Holding,
  InsertHolding,
  UpdateHolding,
  AnalysisRecord,
  InsertAnalysisRecord,
  AnalysisContent,
} from "./shared/schema";
import * as schema from "./shared/schema";

export class HoldingManager {
  async createHolding(data: InsertHolding): Promise<Holding> {
    const db = await getDb(schema);
    const validated = insertHoldingSchema.parse(data);
    const [holding] = await db.insert(holdings).values(validated).returning();
    return holding;
  }

  async getHoldings(): Promise<Holding[]> {
    const db = await getDb(schema);
    return db.query.holdings.findMany({
      orderBy: [desc(holdings.createdAt)],
    });
  }

  async getHoldingById(id: string): Promise<Holding | null> {
    const db = await getDb(schema);
    const holding = await db.query.holdings.findFirst({
      where: eq(holdings.id, id),
    });
    return holding || null;
  }

  async getHoldingByCode(stockCode: string): Promise<Holding | null> {
    const db = await getDb(schema);
    const holding = await db.query.holdings.findFirst({
      where: eq(holdings.stockCode, stockCode),
    });
    return holding || null;
  }

  async updateHolding(id: string, data: UpdateHolding): Promise<Holding | null> {
    const db = await getDb(schema);
    const validated = updateHoldingSchema.parse(data);
    const [holding] = await db
      .update(holdings)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(holdings.id, id))
      .returning();
    return holding || null;
  }

  async deleteHolding(id: string): Promise<boolean> {
    const db = await getDb(schema);
    // 先删除关联的分析记录
    await db
      .delete(analysisRecords)
      .where(eq(analysisRecords.holdingId, id));
    // 再删除持仓
    const result = await db.delete(holdings).where(eq(holdings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createAnalysisRecord(data: InsertAnalysisRecord): Promise<AnalysisRecord> {
    const db = await getDb(schema);
    const validated = insertAnalysisRecordSchema.parse(data);
    const [record] = await db.insert(analysisRecords).values(validated).returning();
    return record;
  }

  async getAnalysisRecords(holdingId: string): Promise<AnalysisRecord[]> {
    const db = await getDb(schema);
    return db.query.analysisRecords.findMany({
      where: eq(analysisRecords.holdingId, holdingId),
      orderBy: [desc(analysisRecords.createdAt)],
      limit: 20, // 保留最近20条记录
    });
  }

  async getLatestAnalysis(holdingId: string): Promise<AnalysisRecord | null> {
    const db = await getDb(schema);
    const record = await db.query.analysisRecords.findFirst({
      where: eq(analysisRecords.holdingId, holdingId),
      orderBy: [desc(analysisRecords.createdAt)],
    });
    return record || null;
  }

  async getHoldingsWithLatestAnalysis(): Promise<
    Array<Holding & { latestAnalysis: AnalysisRecord | null }>
  > {
    const db = await getDb(schema);
    const allHoldings = await db.query.holdings.findMany({
      orderBy: [desc(holdings.createdAt)],
    });

    const results = [];
    for (const holding of allHoldings) {
      const latestAnalysis = await this.getLatestAnalysis(holding.id);
      results.push({ ...holding, latestAnalysis });
    }

    return results;
  }
}

export const holdingManager = new HoldingManager();
