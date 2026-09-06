import { db } from "@/db";
import { purchaseOrders, purchaseOrderLines, poStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PurchaseOrderLine } from "./purchaseOrderLineRepository";

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type POStatus = (typeof poStatusEnum.enumValues)[number];

export interface PurchaseOrderWithLines extends PurchaseOrder {
  lines: PurchaseOrderLine[];
}

export const purchaseOrderRepository = {
  async findAll(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders);
  },

  async findById(id: number): Promise<PurchaseOrder | null> {
    const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return result[0] || null;
  },

  async findWithLines(id: number): Promise<PurchaseOrderWithLines | null> {
    const po = await this.findById(id);
    if (!po) return null;

    const lines = await db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.purchaseOrderId, id));

    return {
      ...po,
      lines,
    };
  },

  async create(data: NewPurchaseOrder): Promise<PurchaseOrder> {
    const result = await db.insert(purchaseOrders).values(data).returning();
    return result[0];
  },

  async updateStatus(id: number, status: POStatus): Promise<PurchaseOrder | null> {
    const result = await db
      .update(purchaseOrders)
      .set({ status })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return result[0] || null;
  },
};
