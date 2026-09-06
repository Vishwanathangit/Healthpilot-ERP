import { NextResponse } from "next/server";
import { stockLedgerService } from "@/services/stockLedgerService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationIdStr = searchParams.get("locationId");
    const productIdStr = searchParams.get("productId");
    const batchIdStr = searchParams.get("batchId");

    const locationId = locationIdStr ? Number(locationIdStr) : undefined;
    const productId = productIdStr ? Number(productIdStr) : undefined;
    const batchId = batchIdStr ? Number(batchIdStr) : undefined;

    const ledgerReport = await stockLedgerService.getFullLedgerReport(
      locationId,
      productId,
      batchId
    );

    return NextResponse.json({ success: true, data: ledgerReport }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
