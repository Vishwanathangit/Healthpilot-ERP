import { db } from "@/db";
import { sales } from "@/db/schema";
import { salesRepository, Sale } from "@/repositories/salesRepository";
import { productRepository } from "@/repositories/productRepository";
import { stockLedgerRepository } from "@/repositories/stockLedgerRepository";

export interface CreateSaleInput {
  locationId: number;
  productId: number;
  batchId: number;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  patientReference: string;
  paymentMethod: string;
  dispensedBy: number;
  saleDatetime: Date;
}

export const salesService = {
  async generateSaleNumber(): Promise<string> {
    const allSales = await db.select().from(sales);
    const nextNum = allSales.length + 1;
    return `SALE-${String(nextNum).padStart(4, "0")}`;
  },

  async createSale(input: CreateSaleInput): Promise<Sale> {
    const availableBalance = await stockLedgerRepository.getCurrentBalance(
      input.locationId,
      input.productId,
      input.batchId
    );

    if (input.quantity > availableBalance) {
      throw new Error(
        `Insufficient stock at this location to dispense. Requested: ${input.quantity}, Available: ${availableBalance}.`
      );
    }

    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw new Error(`Product #${input.productId} not found.`);
    }

    const quantity = input.quantity;
    const unitPriceNum = Number(input.unitPrice);
    const taxPercentNum = Number(input.taxPercent);
    const purchasePriceNum = Number(product.purchasePrice);

    const subtotal = quantity * unitPriceNum;
    const taxAmount = subtotal * (taxPercentNum / 100);
    const totalAmountNum = subtotal + taxAmount;
    const costAmountNum = quantity * purchasePriceNum;

    const saleNumber = await this.generateSaleNumber();

    const sale = await salesRepository.create({
      saleNumber,
      locationId: input.locationId,
      productId: input.productId,
      batchId: input.batchId,
      quantity,
      unitPrice: unitPriceNum.toFixed(2),
      taxPercent: taxPercentNum.toFixed(2),
      totalAmount: totalAmountNum.toFixed(2),
      costAmount: costAmountNum.toFixed(2),
      patientReference: input.patientReference,
      paymentMethod: input.paymentMethod,
      dispensedBy: input.dispensedBy,
      saleDatetime: input.saleDatetime,
    });

    const balanceAfter = availableBalance - quantity;

    await stockLedgerRepository.create({
      locationId: input.locationId,
      productId: input.productId,
      batchId: input.batchId,
      transactionType: "sale",
      referenceTable: "sales",
      referenceId: sale.id,
      quantityIn: 0,
      quantityOut: quantity,
      balanceAfter,
    });

    return sale;
  },

  async listSalesByLocation(locationId: number): Promise<Sale[]> {
    return await salesRepository.findByLocation(locationId);
  },
};
