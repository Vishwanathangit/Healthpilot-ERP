import { NextResponse } from "next/server";
import { stockLedgerService } from "@/services/stockLedgerService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get("productId");
    const batchIdStr = searchParams.get("batchId");

    if (!productIdStr || !batchIdStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Query parameters 'productId' and 'batchId' are required.",
        },
        { status: 400 }
      );
    }

    const productId = Number(productIdStr);
    const batchId = Number(batchIdStr);

    if (isNaN(productId) || isNaN(batchId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameters 'productId' and 'batchId' must be valid numbers.",
        },
        { status: 400 }
      );
    }

    const positionSummary = await stockLedgerService.getStockPositionSummary(
      productId,
      batchId
    );

    return NextResponse.json({ success: true, data: positionSummary }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
