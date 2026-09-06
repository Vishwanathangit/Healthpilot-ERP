import { NextResponse } from "next/server";
import { goodsReceiptService } from "@/services/goodsReceiptService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId: lineIdStr } = await params;
    const lineId = Number(lineIdStr);
    if (isNaN(lineId)) {
      return NextResponse.json(
        { success: false, error: "Invalid goods receipt line ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      correctedAcceptedQty,
      correctedDamagedQty,
      correctedMissingQty,
      correctedBy,
      reason,
    } = body;

    if (
      correctedAcceptedQty === undefined ||
      correctedDamagedQty === undefined ||
      correctedMissingQty === undefined ||
      !correctedBy ||
      !reason
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for line correction." },
        { status: 400 }
      );
    }

    const result = await goodsReceiptService.correctGoodsReceiptLine({
      goodsReceiptLineId: lineId,
      correctedAcceptedQty: Number(correctedAcceptedQty),
      correctedDamagedQty: Number(correctedDamagedQty),
      correctedMissingQty: Number(correctedMissingQty),
      correctedBy: Number(correctedBy),
      reason: String(reason),
    });

    return NextResponse.json({ success: true, data: result.correction }, { status: 201 });
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
