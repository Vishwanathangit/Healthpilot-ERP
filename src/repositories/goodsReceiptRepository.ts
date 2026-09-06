import { db } from "@/db";
import { goodsReceipts, grnStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type NewGoodsReceipt = typeof goodsReceipts.$inferInsert;
export type GRNStatus = (typeof grnStatusEnum.enumValues)[number];

export const goodsReceiptRepository = {
  async findAll(): Promise<GoodsReceipt[]> {
    return await db.select().from(goodsReceipts);
  },

  async findById(id: number): Promise<GoodsReceipt | null> {
    const result = await db.select().from(goodsReceipts).where(eq(goodsReceipts.id, id));
    return result[0] || null;
  },

  async findByPurchaseOrderId(purchaseOrderId: number): Promise<GoodsReceipt[]> {
    return await db
      .select()
      .from(goodsReceipts)
      .where(eq(goodsReceipts.purchaseOrderId, purchaseOrderId));
  },

  async create(data: NewGoodsReceipt): Promise<GoodsReceipt> {
    const result = await db.insert(goodsReceipts).values(data).returning();
    return result[0];
  },

  async updateStatus(id: number, status: GRNStatus): Promise<GoodsReceipt | null> {
    const result = await db
      .update(goodsReceipts)
      .set({ status })
      .where(eq(goodsReceipts.id, id))
      .returning();
    return result[0] || null;
  },
};
