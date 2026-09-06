import { db } from "@/db";
import { stockLedger, ledgerTransactionTypeEnum } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export type StockLedgerRow = typeof stockLedger.$inferSelect;
export type NewStockLedgerRow = typeof stockLedger.$inferInsert;
export type LedgerTransactionType = (typeof ledgerTransactionTypeEnum.enumValues)[number];

export const stockLedgerRepository = {
  async create(data: NewStockLedgerRow): Promise<StockLedgerRow> {
    const result = await db.insert(stockLedger).values(data).returning();
    return result[0];
  },

  async findByLocationProductBatch(
    locationId: number,
    productId: number,
    batchId: number
  ): Promise<StockLedgerRow[]> {
    return await db
      .select()
      .from(stockLedger)
      .where(
        and(
          eq(stockLedger.locationId, locationId),
          eq(stockLedger.productId, productId),
          eq(stockLedger.batchId, batchId)
        )
      )
      .orderBy(asc(stockLedger.createdAt), asc(stockLedger.id));
  },

  async getCurrentBalance(
    locationId: number,
    productId: number,
    batchId: number
  ): Promise<number> {
    const result = await db
      .select({ balanceAfter: stockLedger.balanceAfter })
      .from(stockLedger)
      .where(
        and(
          eq(stockLedger.locationId, locationId),
          eq(stockLedger.productId, productId),
          eq(stockLedger.batchId, batchId)
        )
      )
      .orderBy(desc(stockLedger.createdAt), desc(stockLedger.id))
      .limit(1);

    return result[0]?.balanceAfter ?? 0;
  },

  async findByLocation(locationId: number): Promise<StockLedgerRow[]> {
    return await db
      .select()
      .from(stockLedger)
      .where(eq(stockLedger.locationId, locationId))
      .orderBy(asc(stockLedger.createdAt), asc(stockLedger.id));
  },

  async findByReference(
    referenceTable: string,
    referenceId: number
  ): Promise<StockLedgerRow[]> {
    return await db
      .select()
      .from(stockLedger)
      .where(
        and(
          eq(stockLedger.referenceTable, referenceTable),
          eq(stockLedger.referenceId, referenceId)
        )
      )
      .orderBy(asc(stockLedger.createdAt), asc(stockLedger.id));
  },

  async findAll(): Promise<StockLedgerRow[]> {
    return await db
      .select()
      .from(stockLedger)
      .orderBy(asc(stockLedger.createdAt), asc(stockLedger.id));
  },
};
