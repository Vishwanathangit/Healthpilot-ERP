import { db } from "@/db";
import { goodsReceiptCorrections } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export type GoodsReceiptCorrection = typeof goodsReceiptCorrections.$inferSelect;
export type NewGoodsReceiptCorrection = typeof goodsReceiptCorrections.$inferInsert;

export const goodsReceiptCorrectionRepository = {
  async findByGoodsReceiptLineId(goodsReceiptLineId: number): Promise<GoodsReceiptCorrection[]> {
    return await db
      .select()
      .from(goodsReceiptCorrections)
      .where(eq(goodsReceiptCorrections.goodsReceiptLineId, goodsReceiptLineId))
      .orderBy(asc(goodsReceiptCorrections.createdAt));
  },

  async findLatestByGoodsReceiptLineId(goodsReceiptLineId: number): Promise<GoodsReceiptCorrection | null> {
    const result = await db
      .select()
      .from(goodsReceiptCorrections)
      .where(eq(goodsReceiptCorrections.goodsReceiptLineId, goodsReceiptLineId))
      .orderBy(desc(goodsReceiptCorrections.createdAt))
      .limit(1);
    return result[0] || null;
  },

  async create(data: NewGoodsReceiptCorrection): Promise<GoodsReceiptCorrection> {
    const result = await db.insert(goodsReceiptCorrections).values(data).returning();
    return result[0];
  },
};
