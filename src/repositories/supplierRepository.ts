import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Supplier = typeof suppliers.$inferSelect;

export const supplierRepository = {
  async findAll(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  },

  async findById(id: number): Promise<Supplier | null> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0] || null;
  },
};
