import {
  stockLedgerRepository,
  StockLedgerRow,
} from "@/repositories/stockLedgerRepository";
import { locationRepository } from "@/repositories/locationRepository";
import { productRepository } from "@/repositories/productRepository";
import { batchRepository } from "@/repositories/batchRepository";

export interface EnrichedStockLedgerRow extends StockLedgerRow {
  locationName: string;
  productName: string;
  batchNumber: string;
}

export interface LocationStockSummary {
  locationId: number;
  locationName: string;
  productId: number;
  batchId: number;
  usableStock: number;
}

export interface StockPositionSummary {
  locationBreakdown: Array<{
    locationId: number;
    locationName: string;
    usableStock: number;
  }>;
  totalUsable: number;
  totalDamaged: number;
  totalMissing: number;
  totalDispensed: number;
  grandTotal: number;
}

export const stockLedgerService = {
  /**
   * Calculates usable stock for a given location + product + batch.
   * Usable stock only includes: 'receipt', 'correction', 'transfer_in', 'transfer_out', 'sale'.
   */
  async getUsableStock(
    locationId: number,
    productId: number,
    batchId: number
  ): Promise<number> {
    const rows = await stockLedgerRepository.findByLocationProductBatch(
      locationId,
      productId,
      batchId
    );
    const usableTypes = new Set([
      "receipt",
      "correction",
      "transfer_in",
      "transfer_out",
      "sale",
    ]);

    let usableBalance = 0;
    for (const r of rows) {
      if (usableTypes.has(r.transactionType)) {
        usableBalance += r.quantityIn - r.quantityOut;
      }
    }
    return usableBalance;
  },

  /**
   * Cumulative damaged quantity across all locations for a product + batch.
   */
  async getDamagedStock(productId: number, batchId: number): Promise<number> {
    const allRows = await stockLedgerRepository.findAll();
    let totalDamaged = 0;
    for (const r of allRows) {
      if (
        r.productId === productId &&
        r.batchId === batchId &&
        r.transactionType === "damaged"
      ) {
        totalDamaged += r.quantityIn - r.quantityOut;
      }
    }
    return totalDamaged;
  },

  /**
   * Cumulative missing quantity across all locations for a product + batch.
   */
  async getMissingStock(productId: number, batchId: number): Promise<number> {
    const allRows = await stockLedgerRepository.findAll();
    let totalMissing = 0;
    for (const r of allRows) {
      if (
        r.productId === productId &&
        r.batchId === batchId &&
        r.transactionType === "missing"
      ) {
        totalMissing += r.quantityIn - r.quantityOut;
      }
    }
    return totalMissing;
  },

  /**
   * Stock summary per location for all active location + product + batch combinations.
   */
  async getStockSummaryByLocation(): Promise<LocationStockSummary[]> {
    const allRows = await stockLedgerRepository.findAll();
    const locationsList = await locationRepository.findAll();
    const locationMap = new Map(locationsList.map((l) => [l.id, l.name]));

    const comboKeys = new Set<string>();
    const combos: Array<{ locationId: number; productId: number; batchId: number }> = [];

    for (const r of allRows) {
      const key = `${r.locationId}-${r.productId}-${r.batchId}`;
      if (!comboKeys.has(key)) {
        comboKeys.add(key);
        combos.push({
          locationId: r.locationId,
          productId: r.productId,
          batchId: r.batchId,
        });
      }
    }

    const result: LocationStockSummary[] = [];
    for (const combo of combos) {
      const usableStock = await this.getUsableStock(
        combo.locationId,
        combo.productId,
        combo.batchId
      );
      result.push({
        locationId: combo.locationId,
        locationName: locationMap.get(combo.locationId) || `Location #${combo.locationId}`,
        productId: combo.productId,
        batchId: combo.batchId,
        usableStock,
      });
    }
    return result;
  },

  /**
   * Enriched audit trail ledger report (optionally filtered by location, product, batch).
   */
  async getFullLedgerReport(
    locationId?: number,
    productId?: number,
    batchId?: number
  ): Promise<EnrichedStockLedgerRow[]> {
    let allRows = await stockLedgerRepository.findAll();

    if (locationId !== undefined) {
      allRows = allRows.filter((r) => r.locationId === locationId);
    }
    if (productId !== undefined) {
      allRows = allRows.filter((r) => r.productId === productId);
    }
    if (batchId !== undefined) {
      allRows = allRows.filter((r) => r.batchId === batchId);
    }

    const [locationsList, productsList, batchesList] = await Promise.all([
      locationRepository.findAll(),
      productRepository.findAll(),
      batchRepository.findAll(),
    ]);

    const locationMap = new Map(locationsList.map((l) => [l.id, l.name]));
    const productMap = new Map(productsList.map((p) => [p.id, p.name]));
    const batchMap = new Map(batchesList.map((b) => [b.id, b.batchNumber]));

    return allRows.map((row) => ({
      ...row,
      locationName: locationMap.get(row.locationId) || `Location #${row.locationId}`,
      productName: productMap.get(row.productId) || `Product #${row.productId}`,
      batchNumber: batchMap.get(row.batchId) || `Batch #${row.batchId}`,
    }));
  },

  /**
   * System-wide Stock Position Summary (reconciles usable, damaged, missing, dispensed vs grand total).
   */
  async getStockPositionSummary(
    productId: number,
    batchId: number
  ): Promise<StockPositionSummary> {
    const locationsList = await locationRepository.findAll();
    const locationBreakdown: Array<{
      locationId: number;
      locationName: string;
      usableStock: number;
    }> = [];

    let totalUsable = 0;
    for (const loc of locationsList) {
      const usableStock = await this.getUsableStock(loc.id, productId, batchId);
      if (usableStock > 0 || loc.type === "warehouse") {
        locationBreakdown.push({
          locationId: loc.id,
          locationName: loc.name,
          usableStock,
        });
      }
      totalUsable += usableStock;
    }

    const totalDamaged = await this.getDamagedStock(productId, batchId);
    const totalMissing = await this.getMissingStock(productId, batchId);

    // Calculate total dispensed across all locations from 'sale' transaction type
    const allRows = await stockLedgerRepository.findAll();
    let totalDispensed = 0;
    for (const r of allRows) {
      if (
        r.productId === productId &&
        r.batchId === batchId &&
        r.transactionType === "sale"
      ) {
        totalDispensed += r.quantityOut;
      }
    }

    const grandTotal = totalUsable + totalDamaged + totalMissing + totalDispensed;

    return {
      locationBreakdown,
      totalUsable,
      totalDamaged,
      totalMissing,
      totalDispensed,
      grandTotal,
    };
  },
};
