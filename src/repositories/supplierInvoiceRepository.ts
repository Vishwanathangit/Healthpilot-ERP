import { db } from "@/db";
import { supplierInvoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export type SupplierInvoice = typeof supplierInvoices.$inferSelect;
export type NewSupplierInvoice = typeof supplierInvoices.$inferInsert;

export const supplierInvoiceRepository = {
  async findAll(): Promise<SupplierInvoice[]> {
    return await db.select().from(supplierInvoices);
  },

  async findById(id: number): Promise<SupplierInvoice | null> {
    const result = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id));
    return result[0] || null;
  },

  async findByPurchaseOrderId(purchaseOrderId: number): Promise<SupplierInvoice[]> {
    return await db
      .select()
      .from(supplierInvoices)
      .where(eq(supplierInvoices.purchaseOrderId, purchaseOrderId));
  },

  async create(data: NewSupplierInvoice): Promise<SupplierInvoice> {
    const result = await db.insert(supplierInvoices).values(data).returning();
    return result[0];
  },
};
