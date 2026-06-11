import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 股票持仓表
export const holdings = pgTable(
  "holdings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    stockCode: varchar("stock_code", { length: 20 }).notNull(),
    stockName: varchar("stock_name", { length: 100 }).notNull(),
    sector: varchar("sector", { length: 100 }), // 所属板块
    shares: integer("shares").notNull().default(0),
    costPrice: numeric("cost_price", { precision: 12, scale: 4 }).notNull().default("0"), // 支持4位小数
    currentPrice: numeric("current_price", { precision: 12, scale: 4 }), // 支持4位小数
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    stockCodeIdx: index("holdings_stock_code_idx").on(table.stockCode),
    sectorIdx: index("holdings_sector_idx").on(table.sector),
  })
);

// 分析记录表
export const analysisRecords = pgTable(
  "analysis_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    holdingId: varchar("holding_id", { length: 36 }).notNull(),
    analysisType: varchar("analysis_type", { length: 20 }).notNull(), // daily, on_demand
    content: jsonb("content").notNull(), // 存储分析内容：news, suggestions, trends
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    holdingIdIdx: index("analysis_records_holding_id_idx").on(table.holdingId),
  })
);

// 加仓讨论记录表
export const positionIncreaseDiscussions = pgTable(
  "position_increase_discussions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    holdingId: varchar("holding_id", { length: 36 }).notNull(),
    stockCode: varchar("stock_code", { length: 20 }).notNull(),
    stockName: varchar("stock_name", { length: 100 }).notNull(),
    sector: varchar("sector", { length: 100 }), // 所属板块
    currentPrice: numeric("current_price", { precision: 12, scale: 4 }),
    // AI讨论参与者
    discussions: jsonb("discussions").notNull(), // 存储多个AI的讨论内容
    // 最终决策
    finalDecision: varchar("final_decision", { length: 20 }), // agree, disagree, neutral
    finalSuggestion: text("final_suggestion"), // 最终加仓建议
    confidenceScore: integer("confidence_score").default(0), // 信心指数 0-100
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    holdingIdIdx: index("position_increase_holding_id_idx").on(table.holdingId),
    stockCodeIdx: index("position_increase_stock_code_idx").on(table.stockCode),
  })
);

// 使用 createSchemaFactory 配置 date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation
export const insertHoldingSchema = createCoercedInsertSchema(holdings).pick({
  stockCode: true,
  stockName: true,
  sector: true,
  shares: true,
  costPrice: true,
  currentPrice: true,
});

export const updateHoldingSchema = createCoercedInsertSchema(holdings)
  .pick({
    stockName: true,
    sector: true,
    shares: true,
    costPrice: true,
    currentPrice: true,
  })
  .partial();

export const insertAnalysisRecordSchema = createCoercedInsertSchema(analysisRecords).pick({
  holdingId: true,
  analysisType: true,
  content: true,
});

export const updateAnalysisRecordSchema = createCoercedInsertSchema(analysisRecords)
  .pick({
    holdingId: true,
    analysisType: true,
    content: true,
  })
  .partial();

// 潜力市场表
export const potentialMarkets = pgTable(
  "potential_markets",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    attentionScore: integer("attention_score").notNull().default(50), // 关注度 0-100
    potentialScore: integer("potential_score").notNull().default(50), // 潜力评分 0-100
    marketType: varchar("market_type", { length: 20 }).notNull().default("potential"), // 市场类型：potential（潜力）、hot（热门）
    icon: varchar("icon", { length: 50 }), // 图标名称
    tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`), // 标签数组
    analysis: jsonb("analysis"), // LLM 深度分析内容
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    nameIdx: index("potential_markets_name_idx").on(table.name),
  })
);

// 潜力市场相关企业表
export const marketCompanies = pgTable(
  "market_companies",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    marketId: varchar("market_id", { length: 36 }).notNull(), // 关联潜力市场
    stockCode: varchar("stock_code", { length: 20 }).notNull(),
    stockName: varchar("stock_name", { length: 100 }).notNull(),
    link: varchar("link", { length: 50 }).notNull(), // 产业链环节：原料供应、原料加工、生产、销售、设计等
    description: text("description"),
    marketCap: numeric("market_cap", { precision: 20, scale: 4 }), // 市值（亿元）
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    marketIdIdx: index("market_companies_market_id_idx").on(table.marketId),
    stockCodeIdx: index("market_companies_stock_code_idx").on(table.stockCode),
  })
);

// 潜力市场相关 schemas
export const insertPotentialMarketSchema = createCoercedInsertSchema(potentialMarkets).pick({
  name: true,
  description: true,
  attentionScore: true,
  potentialScore: true,
  marketType: true,
  icon: true,
  tags: true,
});

export const updatePotentialMarketSchema = createCoercedInsertSchema(potentialMarkets)
  .pick({
    name: true,
    description: true,
    attentionScore: true,
    potentialScore: true,
    marketType: true,
    icon: true,
    tags: true,
    analysis: true,
  })
  .partial();

export const insertMarketCompanySchema = createCoercedInsertSchema(marketCompanies).pick({
  marketId: true,
  stockCode: true,
  stockName: true,
  link: true,
  description: true,
  marketCap: true,
});

export const updateMarketCompanySchema = createCoercedInsertSchema(marketCompanies)
  .pick({
    stockName: true,
    link: true,
    description: true,
    marketCap: true,
  })
  .partial();

// TypeScript types
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type UpdateHolding = z.infer<typeof updateHoldingSchema>;

export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type InsertAnalysisRecord = z.infer<typeof insertAnalysisRecordSchema>;

export type PositionIncreaseDiscussion = typeof positionIncreaseDiscussions.$inferSelect;

export type PotentialMarket = typeof potentialMarkets.$inferSelect;
export type InsertPotentialMarket = z.infer<typeof insertPotentialMarketSchema>;
export type UpdatePotentialMarket = z.infer<typeof updatePotentialMarketSchema>;

export type MarketCompany = typeof marketCompanies.$inferSelect;
export type InsertMarketCompany = z.infer<typeof insertMarketCompanySchema>;
export type UpdateMarketCompany = z.infer<typeof updateMarketCompanySchema>;

// 分析内容类型定义
export interface AnalysisContent {
  stockCode: string;
  stockName: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  industry?: string;
  news?: Array<{
    title: string;
    url?: string;
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    publishTime?: string;
  }>;
  suggestions?: {
    action: 'buy' | 'sell' | 'hold';
    reason: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  trends?: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
  };
}

// AI 讨论参与者类型
export interface AIDiscussionParticipant {
  name: string; // AI名称：DeepSeek, Kimi, Claude等
  model: string; // 模型标识
  avatar?: string; // 头像标识
  opinion: 'agree' | 'disagree' | 'neutral'; // 观点
  confidence: number; // 信心指数 0-100
  reasoning: string; // 理由
  keyPoints: string[]; // 关键论点
  concerns?: string[]; // 担忧点
  counterArguments?: string; // 反驳其他AI的论点
}

// AI 讨论结果类型
export interface AIDiscussionsData {
  participants: AIDiscussionParticipant[];
  round: number; // 讨论轮次
  summary: string; // 讨论总结
  consensus: boolean; // 是否达成共识
  consensusType?: "strong" | "weak" | "none"; // 共识类型：强共识/弱共识/无共识
  finalVote: {
    agree: number;
    disagree: number;
    neutral: number;
  };
  timestamp: string;
}

// 加仓建议类型
export interface PositionIncreaseSuggestion {
  decision: 'agree' | 'disagree' | 'neutral';
  suggestion: string;
  confidence: number;
  positionSize?: string; // 建议仓位
  entryPoints?: string[]; // 入场点
  stopLoss?: string; // 止损位
  targetPrice?: string; // 目标价
  riskWarning?: string; // 风险提示
}
