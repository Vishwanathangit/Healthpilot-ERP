import { NextResponse } from "next/server";
import { locationRepository, LocationType } from "@/repositories/locationRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let locations;
    if (type) {
      locations = await locationRepository.findByType(type as LocationType);
    } else {
      locations = await locationRepository.findAll();
    }

    return NextResponse.json({ success: true, data: locations }, { status: 200 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
