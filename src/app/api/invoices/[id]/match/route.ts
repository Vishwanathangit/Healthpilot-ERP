import { NextResponse } from "next/server";
import { invoiceMatchingService } from "@/services/invoiceMatchingService";

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

    const body = await request.json();
    const { goodsReceiptId } = body;

    if (!goodsReceiptId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: goodsReceiptId." },
        { status: 400 }
      );
    }

    const matchRecord = await invoiceMatchingService.matchInvoiceToReceipt({
      supplierInvoiceId,
      goodsReceiptId: Number(goodsReceiptId),
    });

    return NextResponse.json({ success: true, data: matchRecord }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
