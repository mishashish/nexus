"use client";

import Link from "next/link";
import { REGION_MYTH } from "@/lib/chamber";
import { useNexus } from "@/lib/nexus-store";

export function Ticket() {
  const { receipt, clearReceipt } = useNexus();
  if (!receipt) return null;
  const myth = REGION_MYTH[receipt.region] ?? REGION_MYTH.frontal;

  return (
    <div className="ticket-scrim" role="dialog" aria-labelledby="ticket-title">
      <div className="ticket-shock" aria-hidden />
      <button type="button" className="ticket" onClick={clearReceipt}>
        <span className="ticket-perf" aria-hidden />
        <span className="kicker">seat locked</span>
        <span id="ticket-title" className="ticket-title">
          {receipt.tag}
        </span>
        <span className="ticket-myth">{myth.title}</span>
        <span className="ticket-line">{myth.line}</span>
        <span className="ticket-price">{receipt.price} NX · paper only</span>
        <span className="ticket-stamp">kept</span>
      </button>
      <Link href="/me" className="ticket-go" onClick={clearReceipt}>
        Open the chamber →
      </Link>
    </div>
  );
}
