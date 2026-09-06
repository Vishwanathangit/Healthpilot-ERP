import { NextResponse } from "next/server";
import { traceabilityService } from "@/services/traceabilityService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requisitionId: string }> }
) {
  try {
    const { requisitionId: reqIdStr } = await params;
    const requisitionId = Number(reqIdStr);

    if (isNaN(requisitionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid requisition ID." },
        { status: 400 }
      );
    }

    const traceabilityData = await traceabilityService.getFullTraceability(requisitionId);

    return NextResponse.json({ success: true, data: traceabilityData }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
