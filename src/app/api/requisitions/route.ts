import { NextResponse } from "next/server";
import { requisitionService } from "@/services/requisitionService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationIdStr = searchParams.get("locationId");

    let requisitions;
    if (locationIdStr) {
      requisitions = await requisitionService.listRequisitionsByLocation(Number(locationIdStr));
    } else {
      requisitions = await requisitionService.listAllRequisitions();
    }

    return NextResponse.json({ success: true, data: requisitions }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locationId, productId, quantity, requiredDate, requestedBy, reason } = body;

    const missingFields: string[] = [];
    if (!locationId) missingFields.push("locationId (Requesting location)");
    if (!productId) missingFields.push("productId (Medication product)");
    if (!quantity) missingFields.push("quantity");
    if (!requiredDate) missingFields.push("requiredDate");
    if (!requestedBy) missingFields.push("requestedBy (Requesting employee)");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields for requisition creation: ${missingFields.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const requisition = await requisitionService.createRequisition({
      locationId: Number(locationId),
      productId: Number(productId),
      quantity: Number(quantity),
      requiredDate: String(requiredDate),
      requestedBy: Number(requestedBy),
      reason: reason ? String(reason) : undefined,
    });

    return NextResponse.json({ success: true, data: requisition }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
