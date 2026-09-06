import { NextResponse } from "next/server";
import { supplierInvoiceRepository } from "@/repositories/supplierInvoiceRepository";
import { invoiceMatchingService } from "@/services/invoiceMatchingService";

export async function GET() {
  try {
    const invoices = await supplierInvoiceRepository.findAll();
    return NextResponse.json({ success: true, data: invoices }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      purchaseOrderId,
      invoiceAmount,
      invoiceQuantity,
      invoiceDate,
    } = body;

    if (
      !invoiceNumber ||
      !purchaseOrderId ||
      invoiceAmount === undefined ||
      invoiceQuantity === undefined ||
      !invoiceDate
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for supplier invoice." },
        { status: 400 }
      );
    }

    const invoice = await invoiceMatchingService.recordSupplierInvoice({
      invoiceNumber: String(invoiceNumber),
      purchaseOrderId: Number(purchaseOrderId),
      invoiceAmount: Number(invoiceAmount),
      invoiceQuantity: Number(invoiceQuantity),
      invoiceDate: String(invoiceDate),
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
