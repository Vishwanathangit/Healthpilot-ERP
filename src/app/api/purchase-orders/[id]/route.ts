import { NextResponse } from "next/server";
import { purchaseOrderService } from "@/services/purchaseOrderService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const poId = Number(id);
    if (isNaN(poId)) {
      return NextResponse.json(
        { success: false, error: "Invalid purchase order ID." },
        { status: 400 }
      );
    }

    const purchaseOrder = await purchaseOrderService.getPurchaseOrderWithLines(poId);
    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: `Purchase Order #${poId} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: purchaseOrder }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
