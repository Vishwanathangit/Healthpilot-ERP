import { db } from "@/db";
import { creditNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CreditNote = typeof creditNotes.$inferSelect;
export type NewCreditNote = typeof creditNotes.$inferInsert;

export const creditNoteRepository = {
  async findBySupplierInvoiceId(supplierInvoiceId: number): Promise<CreditNote[]> {
    return await db
      .select()
      .from(creditNotes)
      .where(eq(creditNotes.supplierInvoiceId, supplierInvoiceId));
  },

  async create(data: NewCreditNote): Promise<CreditNote> {
    const result = await db.insert(creditNotes).values(data).returning();
    return result[0];
  },
};
