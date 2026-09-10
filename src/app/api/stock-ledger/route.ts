import { NextResponse } from "next/server";
import { stockLedgerService } from "@/services/stockLedgerService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationIdStr = searchParams.get("locationId");
    const productIdStr = searchParams.get("productId");
    const batchIdStr = searchParams.get("batchId");
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const locationId = locationIdStr && locationIdStr !== "all" ? Number(locationIdStr) : undefined;
    const productId = productIdStr ? Number(productIdStr) : undefined;
    const batchId = batchIdStr ? Number(batchIdStr) : undefined;

    const ledgerReport = await stockLedgerService.getFullLedgerReport(
      locationId,
      productId,
      batchId
    );

    const total = ledgerReport.length;
    const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : 1;
    const limit = limitStr ? Math.max(1, parseInt(limitStr, 10)) : 10;
    const totalPages = Math.ceil(total / limit) || 1;

    const startIndex = (page - 1) * limit;
    const paginatedData = ledgerReport.slice(startIndex, startIndex + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedData,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
