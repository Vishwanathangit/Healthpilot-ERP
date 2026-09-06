import { db } from "@/db";
import { invoiceMatches, invoiceMatchStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

export type InvoiceMatch = typeof invoiceMatches.$inferSelect;
export type NewInvoiceMatch = typeof invoiceMatches.$inferInsert;
export type InvoiceMatchStatus = (typeof invoiceMatchStatusEnum.enumValues)[number];

export const invoiceMatchRepository = {
  async findBySupplierInvoiceId(supplierInvoiceId: number): Promise<InvoiceMatch | null> {
    const result = await db
      .select()
      .from(invoiceMatches)
      .where(eq(invoiceMatches.supplierInvoiceId, supplierInvoiceId));
    return result[0] || null;
  },

  async create(data: NewInvoiceMatch): Promise<InvoiceMatch> {
    const result = await db.insert(invoiceMatches).values(data).returning();
    return result[0];
  },

  async updateStatus(id: number, status: InvoiceMatchStatus): Promise<InvoiceMatch | null> {
    const result = await db
      .update(invoiceMatches)
      .set({ status })
      .where(eq(invoiceMatches.id, id))
      .returning();
    return result[0] || null;
  },
};
