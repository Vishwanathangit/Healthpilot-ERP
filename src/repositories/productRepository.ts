import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Product = typeof products.$inferSelect;

export const productRepository = {
  async findAll(): Promise<Product[]> {
    return await db.select().from(products);
  },

  async findById(id: number): Promise<Product | null> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0] || null;
  },
};
