import { db } from "@/db";
import { goodsReceiptLines } from "@/db/schema";
import { eq } from "drizzle-orm";

export type GoodsReceiptLine = typeof goodsReceiptLines.$inferSelect;
export type NewGoodsReceiptLine = typeof goodsReceiptLines.$inferInsert;

export const goodsReceiptLineRepository = {
  async findByGoodsReceiptId(goodsReceiptId: number): Promise<GoodsReceiptLine[]> {
    return await db
      .select()
      .from(goodsReceiptLines)
      .where(eq(goodsReceiptLines.goodsReceiptId, goodsReceiptId));
  },

  async findById(id: number): Promise<GoodsReceiptLine | null> {
    const result = await db
      .select()
      .from(goodsReceiptLines)
      .where(eq(goodsReceiptLines.id, id));
    return result[0] || null;
  },

  async create(data: NewGoodsReceiptLine): Promise<GoodsReceiptLine> {
    const result = await db.insert(goodsReceiptLines).values(data).returning();
    return result[0];
  },
};
