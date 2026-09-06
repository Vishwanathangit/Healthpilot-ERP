import {
  goodsReceiptRepository,
  GoodsReceipt,
} from "@/repositories/goodsReceiptRepository";
import {
  goodsReceiptLineRepository,
  GoodsReceiptLine,
} from "@/repositories/goodsReceiptLineRepository";
import {
  goodsReceiptCorrectionRepository,
  GoodsReceiptCorrection,
} from "@/repositories/goodsReceiptCorrectionRepository";
import { purchaseOrderRepository } from "@/repositories/purchaseOrderRepository";
import { batchRepository, Batch } from "@/repositories/batchRepository";
import { stockLedgerRepository, StockLedgerRow } from "@/repositories/stockLedgerRepository";

export interface CreateGoodsReceiptInput {
  purchaseOrderId: number;
  supplierDeliveryReference: string;
  receivedDate: string;
  receivedBy: number;
  batchNumber: string;
  expiryDate: string;
  physicalQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
}

export interface CreateGoodsReceiptResult {
  goodsReceipt: GoodsReceipt;
  goodsReceiptLine: GoodsReceiptLine;
  batch: Batch;
}

export interface CorrectGoodsReceiptLineInput {
  goodsReceiptLineId: number;
  correctedAcceptedQty: number;
  correctedDamagedQty: number;
  correctedMissingQty: number;
  correctedBy: number;
  reason: string;
}

export interface CorrectGoodsReceiptLineResult {
  correction: GoodsReceiptCorrection;
  ledgerEntriesWritten: StockLedgerRow[];
}

export interface GoodsReceiptWithEffectiveQuantities {
  line: GoodsReceiptLine;
  latestCorrection: GoodsReceiptCorrection | null;
  corrections: GoodsReceiptCorrection[];
  effectiveQuantities: {
    acceptedQuantity: number;
    damagedQuantity: number;
    missingQuantity: number;
  };
}

export const goodsReceiptService = {
  async generateGrnNumber(): Promise<string> {
    const allGrns = await goodsReceiptRepository.findAll();
    const nextNum = allGrns.length + 1;
    return `GRN-${String(nextNum).padStart(4, "0")}`;
  },

  async createGoodsReceipt(
    input: CreateGoodsReceiptInput
  ): Promise<CreateGoodsReceiptResult> {
    // 1. Validate quantity split equality
    const totalSplit = input.acceptedQuantity + input.damagedQuantity + input.missingQuantity;
    if (totalSplit !== input.physicalQuantity) {
      throw new Error(
        `Quantity split mismatch: Accepted (${input.acceptedQuantity}) + Damaged (${input.damagedQuantity}) + Missing (${input.missingQuantity}) = ${totalSplit}, but Physical Quantity is ${input.physicalQuantity}.`
      );
    }

    // 2. Fetch PO with lines
    const poWithLines = await purchaseOrderRepository.findWithLines(input.purchaseOrderId);
    if (!poWithLines) {
      throw new Error(`Purchase Order #${input.purchaseOrderId} not found.`);
    }

    const firstLine = poWithLines.lines[0];
    if (!firstLine) {
      throw new Error(`Purchase Order #${input.purchaseOrderId} has no line items.`);
    }

    const productId = firstLine.productId;
    const deliveryLocationId = poWithLines.deliveryLocationId;

    // 3. Find or create batch
    const batch = await batchRepository.findOrCreate(
      productId,
      input.batchNumber,
      input.expiryDate
    );

    // 4. Create GRN header
    const grnNumber = await this.generateGrnNumber();
    const goodsReceipt = await goodsReceiptRepository.create({
      grnNumber,
      purchaseOrderId: input.purchaseOrderId,
      supplierDeliveryReference: input.supplierDeliveryReference,
      receivedDate: input.receivedDate,
      receivedBy: input.receivedBy,
      status: "completed",
    });

    // 5. Create GRN line
    const goodsReceiptLine = await goodsReceiptLineRepository.create({
      goodsReceiptId: goodsReceipt.id,
      productId,
      batchId: batch.id,
      physicalQuantity: input.physicalQuantity,
      acceptedQuantity: input.acceptedQuantity,
      damagedQuantity: input.damagedQuantity,
      missingQuantity: input.missingQuantity,
    });

    // 6. Write stock ledger entries
    if (input.acceptedQuantity > 0) {
      const currentBal = await stockLedgerRepository.getCurrentBalance(
        deliveryLocationId,
        productId,
        batch.id
      );
      const newBal = currentBal + input.acceptedQuantity;
      await stockLedgerRepository.create({
        locationId: deliveryLocationId,
        productId,
        batchId: batch.id,
        transactionType: "receipt",
        referenceTable: "goods_receipt_lines",
        referenceId: goodsReceiptLine.id,
        quantityIn: input.acceptedQuantity,
        quantityOut: 0,
        balanceAfter: newBal,
      });
    }

    if (input.damagedQuantity > 0) {
      const currentBal = await stockLedgerRepository.getCurrentBalance(
        deliveryLocationId,
        productId,
        batch.id
      );
      await stockLedgerRepository.create({
        locationId: deliveryLocationId,
        productId,
        batchId: batch.id,
        transactionType: "damaged",
        referenceTable: "goods_receipt_lines",
        referenceId: goodsReceiptLine.id,
        quantityIn: input.damagedQuantity,
        quantityOut: 0,
        balanceAfter: currentBal,
      });
    }

    if (input.missingQuantity > 0) {
      const currentBal = await stockLedgerRepository.getCurrentBalance(
        deliveryLocationId,
        productId,
        batch.id
      );
      await stockLedgerRepository.create({
        locationId: deliveryLocationId,
        productId,
        batchId: batch.id,
        transactionType: "missing",
        referenceTable: "goods_receipt_lines",
        referenceId: goodsReceiptLine.id,
        quantityIn: input.missingQuantity,
        quantityOut: 0,
        balanceAfter: currentBal,
      });
    }

    // 7. Update PO status to 'completed'
    await purchaseOrderRepository.updateStatus(input.purchaseOrderId, "completed");

    return { goodsReceipt, goodsReceiptLine, batch };
  },

  async correctGoodsReceiptLine(
    input: CorrectGoodsReceiptLineInput
  ): Promise<CorrectGoodsReceiptLineResult> {
    // 1. Fetch original GRN line
    const line = await goodsReceiptLineRepository.findById(input.goodsReceiptLineId);
    if (!line) {
      throw new Error(`Goods Receipt Line #${input.goodsReceiptLineId} not found.`);
    }

    // 2. Fetch parent GRN and PO for location metadata
    const goodsReceipt = await goodsReceiptRepository.findById(line.goodsReceiptId);
    if (!goodsReceipt) {
      throw new Error(`Goods Receipt #${line.goodsReceiptId} not found.`);
    }

    const po = await purchaseOrderRepository.findById(goodsReceipt.purchaseOrderId);
    if (!po) {
      throw new Error(`Purchase Order #${goodsReceipt.purchaseOrderId} not found.`);
    }

    const deliveryLocationId = po.deliveryLocationId;
    const productId = line.productId;
    const batchId = line.batchId;

    // 3. Determine previous/original values (latest correction if available, otherwise original line)
    const latestCorrection = await goodsReceiptCorrectionRepository.findLatestByGoodsReceiptLineId(
      line.id
    );

    const prevAccepted = latestCorrection
      ? latestCorrection.correctedAcceptedQty
      : line.acceptedQuantity;
    const prevDamaged = latestCorrection
      ? latestCorrection.correctedDamagedQty
      : line.damagedQuantity;
    const prevMissing = latestCorrection
      ? latestCorrection.correctedMissingQty
      : line.missingQuantity;

    // 4. Validate quantity split equality against line physical quantity
    const totalCorrectedSplit =
      input.correctedAcceptedQty + input.correctedDamagedQty + input.correctedMissingQty;
    if (totalCorrectedSplit !== line.physicalQuantity) {
      throw new Error(
        `Corrected split mismatch: Corrected Accepted (${input.correctedAcceptedQty}) + Damaged (${input.correctedDamagedQty}) + Missing (${input.correctedMissingQty}) = ${totalCorrectedSplit}, but Line Physical Quantity is ${line.physicalQuantity}.`
      );
    }

    // 5. Create new additive correction row
    const correction = await goodsReceiptCorrectionRepository.create({
      goodsReceiptLineId: line.id,
      originalAcceptedQty: prevAccepted,
      originalDamagedQty: prevDamaged,
      originalMissingQty: prevMissing,
      correctedAcceptedQty: input.correctedAcceptedQty,
      correctedDamagedQty: input.correctedDamagedQty,
      correctedMissingQty: input.correctedMissingQty,
      correctedBy: input.correctedBy,
      reason: input.reason,
    });

    // 6. Calculate deltas
    const acceptedDelta = input.correctedAcceptedQty - prevAccepted;
    const damagedDelta = input.correctedDamagedQty - prevDamaged;
    const missingDelta = input.correctedMissingQty - prevMissing;

    const ledgerEntriesWritten: StockLedgerRow[] = [];

    // 7. Write stock ledger entries for non-zero deltas
    if (acceptedDelta !== 0) {
      const currentBal = await stockLedgerRepository.getCurrentBalance(
        deliveryLocationId,
        productId,
        batchId
      );
      const newBal = currentBal + acceptedDelta;
      const quantityIn = acceptedDelta > 0 ? acceptedDelta : 0;
      const quantityOut = acceptedDelta < 0 ? Math.abs(acceptedDelta) : 0;

      const ledgerRow = await stockLedgerRepository.create({
        locationId: deliveryLocationId,
        productId,
        batchId,
        transactionType: "correction",
        referenceTable: "goods_receipt_corrections",
        referenceId: correction.id,
        quantityIn,
        quantityOut,
        balanceAfter: newBal,
      });
      ledgerEntriesWritten.push(ledgerRow);
    }

    if (damagedDelta !== 0) {
      const currentBal = await stockLedgerRepository.getCurrentBalance(
        deliveryLocationId,
        productId,
        batchId
      );
      const quantityIn = damagedDelta > 0 ? damagedDelta : 0;
      const quantityOut = damagedDelta < 0 ? Math.abs(damagedDelta) : 0;

      const ledgerRow = await stockLedgerRepository.create({
        locationId: deliveryLocationId,
        productId,
        batchId,
        transactionType: "damaged",
        referenceTable: "goods_receipt_corrections",
        referenceId: correction.id,
        quantityIn,
        quantityOut,
        balanceAfter: currentBal,
      });
      ledgerEntriesWritten.push(ledgerRow);
    }

    if (missingDelta !== 0) {
      const currentBal = await stockLedgerRepository.getCurrentBalance(
        deliveryLocationId,
        productId,
        batchId
      );
      const quantityIn = missingDelta > 0 ? missingDelta : 0;
      const quantityOut = missingDelta < 0 ? Math.abs(missingDelta) : 0;

      const ledgerRow = await stockLedgerRepository.create({
        locationId: deliveryLocationId,
        productId,
        batchId,
        transactionType: "missing",
        referenceTable: "goods_receipt_corrections",
        referenceId: correction.id,
        quantityIn,
        quantityOut,
        balanceAfter: currentBal,
      });
      ledgerEntriesWritten.push(ledgerRow);
    }

    // 8. Update parent GRN status to 'corrected'
    await goodsReceiptRepository.updateStatus(goodsReceipt.id, "corrected");

    return { correction, ledgerEntriesWritten };
  },

  async getGoodsReceiptWithCurrentQuantities(
    goodsReceiptLineId: number
  ): Promise<GoodsReceiptWithEffectiveQuantities> {
    const line = await goodsReceiptLineRepository.findById(goodsReceiptLineId);
    if (!line) {
      throw new Error(`Goods Receipt Line #${goodsReceiptLineId} not found.`);
    }

    const corrections = await goodsReceiptCorrectionRepository.findByGoodsReceiptLineId(line.id);
    const latestCorrection = corrections.length > 0 ? corrections[corrections.length - 1] : null;

    const effectiveQuantities = {
      acceptedQuantity: latestCorrection ? latestCorrection.correctedAcceptedQty : line.acceptedQuantity,
      damagedQuantity: latestCorrection ? latestCorrection.correctedDamagedQty : line.damagedQuantity,
      missingQuantity: latestCorrection ? latestCorrection.correctedMissingQty : line.missingQuantity,
    };

    return {
      line,
      latestCorrection,
      corrections,
      effectiveQuantities,
    };
  },
};
