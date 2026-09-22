import { NextResponse } from "next/server";
import { NETWORK } from "@/lib/data";
import { priceAmountForIndex, treasuryAddress } from "@/lib/contracts";
import { claimSeat, getSeat } from "@/lib/seats-db";
import { paidAmountLabel, verifySeatPayment } from "@/lib/verify-payment";

export const runtime = "nodejs";

type Body = {
  seatId?: string;
  wallet?: string;
  txHash?: string;
  /** Human amount paid (ETH or token). */
  amountPaid?: string;
  /** @deprecated alias for amountPaid */
  ethPaid?: string;
  nodeIndex?: number;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!treasuryAddress()) {
    return NextResponse.json(
      { error: "Treasury not configured. Set NEXT_PUBLIC_CELLS_TREASURY." },
      { status: 503 },
    );
  }

  const seatId = body.seatId?.trim();
  const wallet = body.wallet?.trim();
  const txHash = body.txHash?.trim();
  if (!seatId || !wallet || !txHash) {
    return NextResponse.json(
      { error: "seatId, wallet, and txHash are required" },
      { status: 400 },
    );
  }

  const node = NETWORK.nodes.find((n) => n.id === seatId);
  if (!node) {
    return NextResponse.json({ error: "Unknown seat" }, { status: 404 });
  }

  const nodeIndex =
    typeof body.nodeIndex === "number" ? body.nodeIndex : (node.index ?? 0);
  const amountPaid =
    body.amountPaid?.trim() ||
    body.ethPaid?.trim() ||
    priceAmountForIndex(nodeIndex);

  const check = await verifySeatPayment({
    txHash,
    wallet,
    nodeIndex,
    amountPaid,
  });

  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 });
  }

  try {
    const record = await claimSeat({
      seatId,
      nodeIndex,
      wallet,
      txHash,
      ethPaid: paidAmountLabel(check.valueRaw, check.asset) || amountPaid,
      claimedAt: Date.now(),
    });
    return NextResponse.json({ seat: record, verified: true, asset: check.asset });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code === "CONFLICT") {
      const existing = await getSeat(seatId);
      return NextResponse.json(
        { error: "Seat already claimed", seat: existing },
        { status: 409 },
      );
    }
    if (code === "TX_USED") {
      return NextResponse.json(
        { error: "Transaction already used for another seat" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Claim failed",
      },
      { status: 500 },
    );
  }
}
