import { NextResponse } from "next/server";
import { invoiceMatchingService } from "@/services/invoiceMatchingService";
import { supplierInvoiceRepository } from "@/repositories/supplierInvoiceRepository";
import { goodsReceiptRepository } from "@/repositories/goodsReceiptRepository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplierInvoiceId = Number(id);
    if (isNaN(supplierInvoiceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier invoice ID." },
        { status: 400 }
      );
    }

    let goodsReceiptId: number | undefined;

    // Safely parse JSON body if present
    try {
      const bodyText = await request.text();
      if (bodyText && bodyText.trim().length > 0) {
        const body = JSON.parse(bodyText);
        if (body.goodsReceiptId) {
          goodsReceiptId = Number(body.goodsReceiptId);
        }
      }
    } catch {
      // Body parsing failed or empty body, fallback to auto-resolution
    }

    // Auto-resolve goodsReceiptId if not explicitly passed
    if (!goodsReceiptId) {
      const invoice = await supplierInvoiceRepository.findById(supplierInvoiceId);
      if (!invoice) {
        return NextResponse.json(
          { success: false, error: `Supplier invoice #${supplierInvoiceId} not found.` },
          { status: 404 }
        );
      }

      const receipts = await goodsReceiptRepository.findByPurchaseOrderId(invoice.purchaseOrderId);
      if (!receipts || receipts.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `No Goods Receipt (GRN) found for linked Purchase Order #${invoice.purchaseOrderId}. Please process goods receipt before performing 3-Way Match.`,
          },
          { status: 400 }
        );
      }

      goodsReceiptId = receipts[0].id;
    }

    const matchRecord = await invoiceMatchingService.matchInvoiceToReceipt({
      supplierInvoiceId,
      goodsReceiptId,
    });

    return NextResponse.json({ success: true, data: matchRecord }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}

