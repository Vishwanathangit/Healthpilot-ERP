import { NextResponse } from "next/server";
import { stockTransferRepository } from "@/repositories/stockTransferRepository";
import { stockTransferService } from "@/services/stockTransferService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationIdStr = searchParams.get("locationId");

    let transfers;
    if (locationIdStr) {
      transfers = await stockTransferService.listTransfersByLocation(Number(locationIdStr));
    } else {
      transfers = await stockTransferRepository.findAll();
    }

    return NextResponse.json({ success: true, data: transfers }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceLocationId,
      destinationLocationId,
      productId,
      batchId,
      quantity,
      dispatchedBy,
      dispatchedAt,
    } = body;

    if (
      !sourceLocationId ||
      !destinationLocationId ||
      !productId ||
      !batchId ||
      !quantity ||
      !dispatchedBy
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for stock transfer dispatch." },
        { status: 400 }
      );
    }

    const transfer = await stockTransferService.dispatchTransfer({
      sourceLocationId: Number(sourceLocationId),
      destinationLocationId: Number(destinationLocationId),
      productId: Number(productId),
      batchId: Number(batchId),
      quantity: Number(quantity),
      dispatchedBy: Number(dispatchedBy),
      dispatchedAt: dispatchedAt ? new Date(dispatchedAt) : new Date(),
    });

    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("Insufficient stock") ? 400 : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
