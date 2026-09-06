import { NextResponse } from "next/server";
import { stockTransferService } from "@/services/stockTransferService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transferId = Number(id);
    if (isNaN(transferId)) {
      return NextResponse.json(
        { success: false, error: "Invalid transfer ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { receivedBy, receivedAt } = body;

    if (!receivedBy) {
      return NextResponse.json(
        { success: false, error: "Missing required field: receivedBy." },
        { status: 400 }
      );
    }

    const updatedTransfer = await stockTransferService.receiveTransfer({
      transferId,
      receivedBy: Number(receivedBy),
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
    });

    return NextResponse.json({ success: true, data: updatedTransfer }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const status = errMessage.includes("not found")
      ? 404
      : errMessage.includes("Cannot receive transfer")
      ? 400
      : 500;
    return NextResponse.json({ success: false, error: errMessage }, { status });
  }
}
