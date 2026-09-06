import { requisitionRepository, Requisition } from "@/repositories/requisitionRepository";
import { purchaseOrderLineRepository } from "@/repositories/purchaseOrderLineRepository";
import { purchaseOrderRepository, PurchaseOrderWithLines } from "@/repositories/purchaseOrderRepository";
import { goodsReceiptRepository, GoodsReceipt } from "@/repositories/goodsReceiptRepository";
import { goodsReceiptLineRepository, GoodsReceiptLine } from "@/repositories/goodsReceiptLineRepository";
import { goodsReceiptCorrectionRepository, GoodsReceiptCorrection } from "@/repositories/goodsReceiptCorrectionRepository";
import { supplierInvoiceRepository, SupplierInvoice } from "@/repositories/supplierInvoiceRepository";
import { invoiceMatchRepository, InvoiceMatch } from "@/repositories/invoiceMatchRepository";
import { creditNoteRepository, CreditNote } from "@/repositories/creditNoteRepository";
import { stockTransferRepository, StockTransfer } from "@/repositories/stockTransferRepository";
import { salesRepository, Sale } from "@/repositories/salesRepository";

export interface GoodsReceiptLineWithCorrections {
  line: GoodsReceiptLine;
  corrections: GoodsReceiptCorrection[];
}

export interface GoodsReceiptTraceability {
  goodsReceipt: GoodsReceipt;
  lines: GoodsReceiptLineWithCorrections[];
}

export interface SupplierInvoiceTraceability {
  invoice: SupplierInvoice;
  match: InvoiceMatch | null;
  creditNotes: CreditNote[];
}

export interface StockTransferTraceability {
  transfer: StockTransfer;
  sales: Sale[];
}

export interface PurchaseOrderTraceability {
  purchaseOrder: PurchaseOrderWithLines;
  goodsReceipts: GoodsReceiptTraceability[];
  supplierInvoices: SupplierInvoiceTraceability[];
  stockTransfers: StockTransferTraceability[];
}

export interface RequisitionTraceability {
  requisition: Requisition;
  purchaseOrders: PurchaseOrderTraceability[];
}

export const traceabilityService = {
  /**
   * Walks the full supply chain tree starting from a single requisition.
   */
  async getFullTraceability(requisitionId: number): Promise<RequisitionTraceability> {
    // 1. Fetch requisition
    const requisition = await requisitionRepository.findById(requisitionId);
    if (!requisition) {
      throw new Error(`Requisition #${requisitionId} not found.`);
    }

    // 2. Fetch linked PO lines
    const poLines = await purchaseOrderLineRepository.findByRequisitionId(requisitionId);
    const poIds = Array.from(new Set(poLines.map((l) => l.purchaseOrderId)));

    const purchaseOrdersTraceability: PurchaseOrderTraceability[] = [];

    for (const poId of poIds) {
      // 3. Fetch PO with lines
      const poWithLines = await purchaseOrderRepository.findWithLines(poId);
      if (!poWithLines) continue;

      // 4. Fetch linked Goods Receipts
      const grns = await goodsReceiptRepository.findByPurchaseOrderId(poId);
      const goodsReceiptsTraceability: GoodsReceiptTraceability[] = [];
      const batchIds = new Set<number>();

      for (const grn of grns) {
        const grnLines = await goodsReceiptLineRepository.findByGoodsReceiptId(grn.id);
        const linesWithCorrections: GoodsReceiptLineWithCorrections[] = [];

        for (const line of grnLines) {
          batchIds.add(line.batchId);
          const corrections = await goodsReceiptCorrectionRepository.findByGoodsReceiptLineId(line.id);
          linesWithCorrections.push({
            line,
            corrections,
          });
        }

        goodsReceiptsTraceability.push({
          goodsReceipt: grn,
          lines: linesWithCorrections,
        });
      }

      // 5. Fetch linked Supplier Invoices, Matches, Credit Notes
      const invoices = await supplierInvoiceRepository.findByPurchaseOrderId(poId);
      const supplierInvoicesTraceability: SupplierInvoiceTraceability[] = [];

      for (const inv of invoices) {
        const match = await invoiceMatchRepository.findBySupplierInvoiceId(inv.id);
        const cns = await creditNoteRepository.findBySupplierInvoiceId(inv.id);
        supplierInvoicesTraceability.push({
          invoice: inv,
          match,
          creditNotes: cns,
        });
      }

      // 6. Fetch linked Stock Transfers and Sales for batches in this PO
      const stockTransfersTraceability: StockTransferTraceability[] = [];

      for (const batchId of Array.from(batchIds)) {
        const transfers = await stockTransferRepository.findByBatchId(batchId);
        for (const transfer of transfers) {
          const linkedSales = await salesRepository.findByLocationAndBatch(
            transfer.destinationLocationId,
            batchId
          );
          stockTransfersTraceability.push({
            transfer,
            sales: linkedSales,
          });
        }
      }

      purchaseOrdersTraceability.push({
        purchaseOrder: poWithLines,
        goodsReceipts: goodsReceiptsTraceability,
        supplierInvoices: supplierInvoicesTraceability,
        stockTransfers: stockTransfersTraceability,
      });
    }

    return {
      requisition,
      purchaseOrders: purchaseOrdersTraceability,
    };
  },
};
