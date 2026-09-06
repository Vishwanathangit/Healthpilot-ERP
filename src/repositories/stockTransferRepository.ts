import { db } from "@/db";
import { stockTransfers, transferStatusEnum } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;
export type TransferStatus = (typeof transferStatusEnum.enumValues)[number];

export const stockTransferRepository = {
  async findAll(): Promise<StockTransfer[]> {
    return await db.select().from(stockTransfers);
  },

  async findById(id: number): Promise<StockTransfer | null> {
    const result = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id));
    return result[0] || null;
  },

  async findByStatus(status: TransferStatus): Promise<StockTransfer[]> {
    return await db.select().from(stockTransfers).where(eq(stockTransfers.status, status));
  },

  async findByBatchId(batchId: number): Promise<StockTransfer[]> {
    return await db.select().from(stockTransfers).where(eq(stockTransfers.batchId, batchId));
  },

  async findByLocation(locationId: number): Promise<StockTransfer[]> {
    return await db
      .select()
      .from(stockTransfers)
      .where(
        or(
          eq(stockTransfers.sourceLocationId, locationId),
          eq(stockTransfers.destinationLocationId, locationId)
        )
      );
  },

  async create(data: NewStockTransfer): Promise<StockTransfer> {
    const result = await db.insert(stockTransfers).values(data).returning();
    return result[0];
  },

  async markReceived(
    id: number,
    receivedBy: number,
    receivedAt: Date
  ): Promise<StockTransfer | null> {
    const result = await db
      .update(stockTransfers)
      .set({
        status: "received",
        receivedBy,
        receivedAt,
      })
      .where(eq(stockTransfers.id, id))
      .returning();
    return result[0] || null;
  },
};
