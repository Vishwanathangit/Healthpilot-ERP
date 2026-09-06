import { NextResponse } from "next/server";
import { supplierRepository } from "@/repositories/supplierRepository";

export async function GET() {
  try {
    const suppliers = await supplierRepository.findAll();
    return NextResponse.json({ success: true, data: suppliers }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
