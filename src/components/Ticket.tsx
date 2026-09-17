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
      <div className="ticket">
        <p className="kicker">{receipt.paid ? "purchase recorded" : "seat locked"}</p>
        <p id="ticket-title" className="ticket-title">
          {receipt.tag}
        </p>
        <p className="ticket-myth">{myth.title}</p>
        <p className="ticket-line">{myth.line}</p>
        <p className="ticket-price">
          {receipt.price} NX
          {receipt.tx ? ` · ${receipt.tx}` : " · local only"}
        </p>
        <div className="claim-actions" style={{ marginTop: 20 }}>
          <Link href="/me" className="btn-primary" onClick={clearReceipt}>
            Open cabinet
          </Link>
          <button type="button" className="btn-ghost" onClick={clearReceipt}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
