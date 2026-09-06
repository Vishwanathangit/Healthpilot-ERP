import { NextResponse } from "next/server";
import { employeeRepository } from "@/repositories/employeeRepository";

export async function GET() {
  try {
    const employees = await employeeRepository.findAll();
    return NextResponse.json({ success: true, data: employees }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
