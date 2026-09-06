import { NextResponse } from "next/server";
import { stockLedgerService } from "@/services/stockLedgerService";

export async function GET() {
  try {
    const summary = await stockLedgerService.getStockSummaryByLocation();
    return NextResponse.json({ success: true, data: summary }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
