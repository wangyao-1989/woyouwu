import { eq, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  potentialMarkets,
  marketCompanies,
  insertPotentialMarketSchema,
  updatePotentialMarketSchema,
  insertMarketCompanySchema,
  updateMarketCompanySchema,
} from "./shared/schema";
import type {
  PotentialMarket,
  InsertPotentialMarket,
  UpdatePotentialMarket,
  MarketCompany,
  InsertMarketCompany,
  UpdateMarketCompany,
} from "./shared/schema";
import * as schema from "./shared/schema";

export class MarketManager {
  // ============ 潜力市场管理 ============

  async createMarket(data: InsertPotentialMarket): Promise<PotentialMarket> {
    const db = await getDb(schema);
    const validated = insertPotentialMarketSchema.parse(data);
    const [market] = await db.insert(potentialMarkets).values(validated).returning();
    return market;
  }

  async getMarkets(): Promise<PotentialMarket[]> {
    const db = await getDb(schema);
    return db.query.potentialMarkets.findMany({
      orderBy: [desc(potentialMarkets.potentialScore)],
    });
  }

  async getMarketById(id: string): Promise<PotentialMarket | null> {
    const db = await getDb(schema);
    const market = await db.query.potentialMarkets.findFirst({
      where: eq(potentialMarkets.id, id),
    });
    return market || null;
  }

  async updateMarket(id: string, data: UpdatePotentialMarket): Promise<PotentialMarket | null> {
    const db = await getDb(schema);
    const validated = updatePotentialMarketSchema.parse(data);
    const [market] = await db
      .update(potentialMarkets)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(potentialMarkets.id, id))
      .returning();
    return market || null;
  }

  async deleteMarket(id: string): Promise<boolean> {
    const db = await getDb(schema);
    // 先删除关联的企业
    await db.delete(marketCompanies).where(eq(marketCompanies.marketId, id));
    // 再删除市场
    const result = await db.delete(potentialMarkets).where(eq(potentialMarkets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============ 市场企业管理 ============

  async createCompany(data: InsertMarketCompany): Promise<MarketCompany> {
    const db = await getDb(schema);
    const validated = insertMarketCompanySchema.parse(data);
    const [company] = await db.insert(marketCompanies).values(validated).returning();
    return company;
  }

  async getCompaniesByMarket(marketId: string): Promise<MarketCompany[]> {
    const db = await getDb(schema);
    return db.query.marketCompanies.findMany({
      where: eq(marketCompanies.marketId, marketId),
      orderBy: [desc(marketCompanies.marketCap)],
    });
  }

  async getCompanyById(id: string): Promise<MarketCompany | null> {
    const db = await getDb(schema);
    const company = await db.query.marketCompanies.findFirst({
      where: eq(marketCompanies.id, id),
    });
    return company || null;
  }

  async updateCompany(id: string, data: UpdateMarketCompany): Promise<MarketCompany | null> {
    const db = await getDb(schema);
    const validated = updateMarketCompanySchema.parse(data);
    const [company] = await db
      .update(marketCompanies)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(marketCompanies.id, id))
      .returning();
    return company || null;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const db = await getDb(schema);
    const result = await db.delete(marketCompanies).where(eq(marketCompanies.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============ 组合查询 ============

  async getMarketWithCompanies(id: string): Promise<
    | (PotentialMarket & { companies: MarketCompany[] })
    | null
  > {
    const market = await this.getMarketById(id);
    if (!market) return null;

    const companies = await this.getCompaniesByMarket(id);
    return { ...market, companies };
  }

  async getAllMarketsWithCompanies(): Promise<
    Array<PotentialMarket & { companies: MarketCompany[] }>
  > {
    const markets = await this.getMarkets();
    const results = [];

    for (const market of markets) {
      const companies = await this.getCompaniesByMarket(market.id);
      results.push({ ...market, companies });
    }

    return results;
  }
}

export const marketManager = new MarketManager();
