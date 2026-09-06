import { NextResponse } from "next/server";
import { goodsReceiptRepository } from "@/repositories/goodsReceiptRepository";
import { goodsReceiptLineRepository } from "@/repositories/goodsReceiptLineRepository";
import { goodsReceiptService } from "@/services/goodsReceiptService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const grnId = Number(id);
    if (isNaN(grnId)) {
      return NextResponse.json(
        { success: false, error: "Invalid goods receipt ID." },
        { status: 400 }
      );
    }

    const goodsReceipt = await goodsReceiptRepository.findById(grnId);
    if (!goodsReceipt) {
      return NextResponse.json(
        { success: false, error: `Goods Receipt #${grnId} not found.` },
        { status: 404 }
      );
    }

    const lines = await goodsReceiptLineRepository.findByGoodsReceiptId(grnId);
    const enrichedLines = await Promise.all(
      lines.map((line) => goodsReceiptService.getGoodsReceiptWithCurrentQuantities(line.id))
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          goodsReceipt,
          lines: enrichedLines,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
