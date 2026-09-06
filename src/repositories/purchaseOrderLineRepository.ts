import { db } from "@/db";
import { purchaseOrderLines } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;
export type NewPurchaseOrderLine = typeof purchaseOrderLines.$inferInsert;

export const purchaseOrderLineRepository = {
  async findByPurchaseOrderId(purchaseOrderId: number): Promise<PurchaseOrderLine[]> {
    return await db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId));
  },

  async findByRequisitionId(requisitionId: number): Promise<PurchaseOrderLine[]> {
    return await db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.requisitionId, requisitionId));
  },

  async create(data: NewPurchaseOrderLine): Promise<PurchaseOrderLine> {
    const result = await db.insert(purchaseOrderLines).values(data).returning();
    return result[0];
  },
};
