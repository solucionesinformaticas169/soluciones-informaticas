import { NextResponse } from "next/server";
import { getActiveServices } from "@/lib/data";

export async function GET() {
  const services = await getActiveServices();
  return NextResponse.json({ services });
}
