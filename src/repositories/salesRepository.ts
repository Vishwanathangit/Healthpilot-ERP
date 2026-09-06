import { db } from "@/db";
import { sales } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export const salesRepository = {
  async findAll(): Promise<Sale[]> {
    return await db.select().from(sales);
  },

  async findById(id: number): Promise<Sale | null> {
    const result = await db.select().from(sales).where(eq(sales.id, id));
    return result[0] || null;
  },

  async findByLocation(locationId: number): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.locationId, locationId));
  },

  async findByLocationAndBatch(locationId: number, batchId: number): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(and(eq(sales.locationId, locationId), eq(sales.batchId, batchId)));
  },

  async create(data: NewSale): Promise<Sale> {
    const result = await db.insert(sales).values(data).returning();
    return result[0];
  },
};
