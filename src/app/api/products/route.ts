import { NextResponse } from "next/server";
import { productRepository } from "@/repositories/productRepository";

export async function GET() {
  try {
    const products = await productRepository.findAll();
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
