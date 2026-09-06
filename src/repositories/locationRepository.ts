import { db } from "@/db";
import { locations, locationTypeEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Location = typeof locations.$inferSelect;
export type LocationType = (typeof locationTypeEnum.enumValues)[number];

export const locationRepository = {
  async findAll(): Promise<Location[]> {
    return await db.select().from(locations);
  },

  async findById(id: number): Promise<Location | null> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result[0] || null;
  },

  async findByType(type: LocationType): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.type, type));
  },
};
