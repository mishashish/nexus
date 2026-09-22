import { NextResponse } from "next/server";
import { getSeat } from "@/lib/seats-db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const seat = await getSeat(id);
  if (!seat) {
    return NextResponse.json({ seat: null, available: true });
  }
  return NextResponse.json({ seat, available: false });
}
