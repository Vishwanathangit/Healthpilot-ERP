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
    const { quantity, amount, reason } = body;

    if (quantity === undefined || amount === undefined || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for credit note." },
        { status: 400 }
      );
    }

    const creditNote = await invoiceMatchingService.recordCreditNote({
      supplierInvoiceId,
      quantity: Number(quantity),
      amount: Number(amount),
      reason: String(reason),
    });

    return NextResponse.json({ success: true, data: creditNote }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
