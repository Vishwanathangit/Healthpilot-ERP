import { NextResponse } from "next/server";
import { requisitionService } from "@/services/requisitionService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requisitionId = Number(id);
    if (isNaN(requisitionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid requisition ID." },
        { status: 400 }
      );
    }

    const updatedRequisition = await requisitionService.rejectRequisition(requisitionId);

    return NextResponse.json({ success: true, data: updatedRequisition }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("not found") ? 404 : 400;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
