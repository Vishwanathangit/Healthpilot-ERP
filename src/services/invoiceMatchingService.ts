import { db } from "@/db";
import { creditNotes } from "@/db/schema";
import {
  supplierInvoiceRepository,
  SupplierInvoice,
} from "@/repositories/supplierInvoiceRepository";
import {
  invoiceMatchRepository,
  InvoiceMatch,
} from "@/repositories/invoiceMatchRepository";
import {
  creditNoteRepository,
  CreditNote,
} from "@/repositories/creditNoteRepository";
import { goodsReceiptRepository } from "@/repositories/goodsReceiptRepository";
import { goodsReceiptLineRepository } from "@/repositories/goodsReceiptLineRepository";
import { goodsReceiptCorrectionRepository } from "@/repositories/goodsReceiptCorrectionRepository";
import { purchaseOrderLineRepository } from "@/repositories/purchaseOrderLineRepository";

export interface RecordSupplierInvoiceInput {
  invoiceNumber: string;
  purchaseOrderId: number;
  invoiceAmount: number;
  invoiceQuantity: number;
  invoiceDate: string;
}

export interface MatchInvoiceToReceiptInput {
  supplierInvoiceId: number;
  goodsReceiptId: number;
}

export interface RecordCreditNoteInput {
  supplierInvoiceId: number;
  quantity: number;
  amount: number;
  reason: string;
}

export interface InvoiceMatchDetails {
  supplierInvoice: SupplierInvoice;
  match: InvoiceMatch | null;
  creditNotes: CreditNote[];
}

export const invoiceMatchingService = {
  async generateCreditNoteNumber(): Promise<string> {
    const allNotes = await db.select().from(creditNotes);
    const nextNum = allNotes.length + 1;
    return `CN-${String(nextNum).padStart(4, "0")}`;
  },

  async recordSupplierInvoice(
    input: RecordSupplierInvoiceInput
  ): Promise<SupplierInvoice> {
    return await supplierInvoiceRepository.create({
      invoiceNumber: input.invoiceNumber,
      purchaseOrderId: input.purchaseOrderId,
      invoiceAmount: Number(input.invoiceAmount).toFixed(2),
      invoiceQuantity: input.invoiceQuantity,
      invoiceDate: input.invoiceDate,
    });
  },

  async matchInvoiceToReceipt(
    input: MatchInvoiceToReceiptInput
  ): Promise<InvoiceMatch> {
    // 1. Fetch supplier invoice
    const supplierInvoice = await supplierInvoiceRepository.findById(
      input.supplierInvoiceId
    );
    if (!supplierInvoice) {
      throw new Error(`Supplier Invoice #${input.supplierInvoiceId} not found.`);
    }

    // 2. Fetch goods receipt
    const goodsReceipt = await goodsReceiptRepository.findById(
      input.goodsReceiptId
    );
    if (!goodsReceipt) {
      throw new Error(`Goods Receipt #${input.goodsReceiptId} not found.`);
    }

    // 3. Fetch goods receipt lines & compute effective accepted quantity
    const lines = await goodsReceiptLineRepository.findByGoodsReceiptId(
      input.goodsReceiptId
    );
    if (!lines || lines.length === 0) {
      throw new Error(`Goods Receipt #${input.goodsReceiptId} has no lines.`);
    }

    let totalAcceptedQuantity = 0;
    for (const line of lines) {
      const latestCorrection =
        await goodsReceiptCorrectionRepository.findLatestByGoodsReceiptLineId(
          line.id
        );
      const effectiveAccepted = latestCorrection
        ? latestCorrection.correctedAcceptedQty
        : line.acceptedQuantity;
      totalAcceptedQuantity += effectiveAccepted;
    }

    // 4. Fetch PO line to get agreed unitPrice and taxPercent
    const poLines = await purchaseOrderLineRepository.findByPurchaseOrderId(
      goodsReceipt.purchaseOrderId
    );
    if (!poLines || poLines.length === 0) {
      throw new Error(
        `Purchase Order #${goodsReceipt.purchaseOrderId} has no PO line items.`
      );
    }
    const poLine = poLines[0];

    const unitPriceNum = Number(poLine.unitPrice);
    const taxPercentNum = Number(poLine.taxPercent);

    // 5. Calculate 3-way matching values
    const acceptedValue = totalAcceptedQuantity * unitPriceNum;
    const taxAmount = acceptedValue * (taxPercentNum / 100);
    const payableAmount = acceptedValue + taxAmount;
    const invoiceAmountNum = Number(supplierInvoice.invoiceAmount);
    const disputedAmount = invoiceAmountNum - payableAmount;
    const status = Math.abs(disputedAmount) < 0.01 ? "matched" : "disputed";

    // 6. Create invoice match record
    return await invoiceMatchRepository.create({
      supplierInvoiceId: supplierInvoice.id,
      goodsReceiptId: goodsReceipt.id,
      acceptedValue: acceptedValue.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      payableAmount: payableAmount.toFixed(2),
      disputedAmount: disputedAmount.toFixed(2),
      status,
    });
  },

  async recordCreditNote(
    input: RecordCreditNoteInput
  ): Promise<CreditNote> {
    const creditNoteNumber = await this.generateCreditNoteNumber();

    // 1. Create credit note
    const creditNote = await creditNoteRepository.create({
      creditNoteNumber,
      supplierInvoiceId: input.supplierInvoiceId,
      quantity: input.quantity,
      amount: Number(input.amount).toFixed(2),
      reason: input.reason,
    });

    // 2. Update match status to 'resolved' if a match record exists
    const match = await invoiceMatchRepository.findBySupplierInvoiceId(
      input.supplierInvoiceId
    );
    if (match) {
      await invoiceMatchRepository.updateStatus(match.id, "resolved");
    }

    return creditNote;
  },

  async getInvoiceMatchDetails(
    supplierInvoiceId: number
  ): Promise<InvoiceMatchDetails> {
    const supplierInvoice = await supplierInvoiceRepository.findById(
      supplierInvoiceId
    );
    if (!supplierInvoice) {
      throw new Error(`Supplier Invoice #${supplierInvoiceId} not found.`);
    }

    const match = await invoiceMatchRepository.findBySupplierInvoiceId(
      supplierInvoiceId
    );
    const creditNotesList = await creditNoteRepository.findBySupplierInvoiceId(
      supplierInvoiceId
    );

    return {
      supplierInvoice,
      match,
      creditNotes: creditNotesList,
    };
  },
};
