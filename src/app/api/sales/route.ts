import { NextResponse } from "next/server";
import { salesRepository } from "@/repositories/salesRepository";
import { salesService } from "@/services/salesService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationIdStr = searchParams.get("locationId");

    let salesList;
    if (locationIdStr) {
      salesList = await salesService.listSalesByLocation(Number(locationIdStr));
    } else {
      salesList = await salesRepository.findAll();
    }

    return NextResponse.json({ success: true, data: salesList }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      locationId,
      productId,
      batchId,
      quantity,
      unitPrice,
      taxPercent,
      patientReference,
      paymentMethod,
      dispensedBy,
      saleDatetime,
    } = body;

    if (
      !locationId ||
      !productId ||
      !batchId ||
      !quantity ||
      unitPrice === undefined ||
      taxPercent === undefined ||
      !patientReference ||
      !paymentMethod ||
      !dispensedBy
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for sale." },
        { status: 400 }
      );
    }

    const sale = await salesService.createSale({
      locationId: Number(locationId),
      productId: Number(productId),
      batchId: Number(batchId),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      taxPercent: Number(taxPercent),
      patientReference: String(patientReference),
      paymentMethod: String(paymentMethod),
      dispensedBy: Number(dispensedBy),
      saleDatetime: saleDatetime ? new Date(saleDatetime) : new Date(),
    });

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("Insufficient stock") ? 400 : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
