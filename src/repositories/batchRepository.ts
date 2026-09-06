import { db } from "@/db";
import { batches } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;

export const batchRepository = {
  async findAll(): Promise<Batch[]> {
    return await db.select().from(batches);
  },

  async findById(id: number): Promise<Batch | null> {
    const result = await db.select().from(batches).where(eq(batches.id, id));
    return result[0] || null;
  },

  async findByProductAndBatchNumber(
    productId: number,
    batchNumber: string
  ): Promise<Batch | null> {
    const result = await db
      .select()
      .from(batches)
      .where(
        and(
          eq(batches.productId, productId),
          eq(batches.batchNumber, batchNumber)
        )
      );
    return result[0] || null;
  },

  async create(data: NewBatch): Promise<Batch> {
    const result = await db.insert(batches).values(data).returning();
    return result[0];
  },

  async findOrCreate(
    productId: number,
    batchNumber: string,
    expiryDate: string
  ): Promise<Batch> {
    const existing = await this.findByProductAndBatchNumber(productId, batchNumber);
    if (existing) {
      return existing;
    }
    return await this.create({
      productId,
      batchNumber,
      expiryDate,
    });
  },
};
