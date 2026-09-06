import { NextResponse } from "next/server";
import { batchRepository } from "@/repositories/batchRepository";

export async function GET() {
  try {
    const batches = await batchRepository.findAll();
    return NextResponse.json({ success: true, data: batches }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
