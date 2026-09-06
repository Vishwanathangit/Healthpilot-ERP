import { NextResponse } from "next/server";
import { goodsReceiptRepository } from "@/repositories/goodsReceiptRepository";
import { goodsReceiptService } from "@/services/goodsReceiptService";

export async function GET() {
  try {
    const receipts = await goodsReceiptRepository.findAll();
    return NextResponse.json({ success: true, data: receipts }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      purchaseOrderId,
      supplierDeliveryReference,
      receivedDate,
      receivedBy,
      batchNumber,
      expiryDate,
      physicalQuantity,
      acceptedQuantity,
      damagedQuantity,
      missingQuantity,
    } = body;

    if (
      !purchaseOrderId ||
      !supplierDeliveryReference ||
      !receivedDate ||
      !receivedBy ||
      !batchNumber ||
      !expiryDate ||
      physicalQuantity === undefined ||
      acceptedQuantity === undefined ||
      damagedQuantity === undefined ||
      missingQuantity === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for goods receipt creation." },
        { status: 400 }
      );
    }

    const result = await goodsReceiptService.createGoodsReceipt({
      purchaseOrderId: Number(purchaseOrderId),
      supplierDeliveryReference: String(supplierDeliveryReference),
      receivedDate: String(receivedDate),
      receivedBy: Number(receivedBy),
      batchNumber: String(batchNumber),
      expiryDate: String(expiryDate),
      physicalQuantity: Number(physicalQuantity),
      acceptedQuantity: Number(acceptedQuantity),
      damagedQuantity: Number(damagedQuantity),
      missingQuantity: Number(missingQuantity),
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("mismatch")
      ? 400
      : errMessage.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
