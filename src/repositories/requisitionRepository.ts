import { db } from "@/db";
import { requisitions, requisitionStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Requisition = typeof requisitions.$inferSelect;
export type NewRequisition = typeof requisitions.$inferInsert;
export type RequisitionStatus = (typeof requisitionStatusEnum.enumValues)[number];

export const requisitionRepository = {
  async findAll(): Promise<Requisition[]> {
    return await db.select().from(requisitions);
  },

  async findById(id: number): Promise<Requisition | null> {
    const result = await db.select().from(requisitions).where(eq(requisitions.id, id));
    return result[0] || null;
  },

  async findByLocation(locationId: number): Promise<Requisition[]> {
    return await db.select().from(requisitions).where(eq(requisitions.locationId, locationId));
  },

  async findByStatus(status: RequisitionStatus): Promise<Requisition[]> {
    return await db.select().from(requisitions).where(eq(requisitions.status, status));
  },

  async create(data: NewRequisition): Promise<Requisition> {
    const result = await db.insert(requisitions).values(data).returning();
    return result[0];
  },

  async updateStatus(id: number, status: RequisitionStatus): Promise<Requisition | null> {
    const result = await db
      .update(requisitions)
      .set({ status })
      .where(eq(requisitions.id, id))
      .returning();
    return result[0] || null;
  },
};
