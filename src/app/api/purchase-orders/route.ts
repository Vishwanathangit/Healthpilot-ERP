import { NextResponse } from "next/server";
import { purchaseOrderService } from "@/services/purchaseOrderService";

export async function GET() {
  try {
    const purchaseOrders = await purchaseOrderService.listAllPurchaseOrders();
    return NextResponse.json({ success: true, data: purchaseOrders }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      requisitionId,
      supplierId,
      deliveryLocationId,
      orderDate,
      expectedDeliveryDate,
      unitPrice,
      createdBy,
    } = body;

    if (
      !requisitionId ||
      !supplierId ||
      !deliveryLocationId ||
      !orderDate ||
      unitPrice === undefined ||
      !createdBy
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for purchase order creation." },
        { status: 400 }
      );
    }

    const result = await purchaseOrderService.createPurchaseOrderFromRequisition({
      requisitionId: Number(requisitionId),
      supplierId: Number(supplierId),
      deliveryLocationId: Number(deliveryLocationId),
      orderDate: String(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? String(expectedDeliveryDate) : undefined,
      unitPrice: Number(unitPrice),
      createdBy: Number(createdBy),
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("not found")
      ? 404
      : errMessage.includes("must be approved")
      ? 400
      : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
