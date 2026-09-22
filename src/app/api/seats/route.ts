import { NextResponse } from "next/server";
import { getSeat, listSeats, seatsStorageMode } from "@/lib/seats-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seatId = searchParams.get("seatId");
  const wallet = searchParams.get("wallet")?.toLowerCase();

  if (seatId) {
    const seat = await getSeat(seatId);
    return NextResponse.json({
      seat,
      storage: seatsStorageMode(),
    });
  }

  const seats = await listSeats();
  const filtered = wallet
    ? seats.filter((s) => s.wallet === wallet.toLowerCase())
    : seats;

  return NextResponse.json({
    seats: filtered,
    storage: seatsStorageMode(),
  });
}
