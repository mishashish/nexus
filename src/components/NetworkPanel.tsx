"use client";

import Link from "next/link";
import { useState } from "react";
import { Hexagon } from "lucide-react";
import { HexBrain3D } from "./HexBrain3D";
import { Panel } from "./ui";
import { REGION_MYTH } from "@/lib/chamber";
import { firstFree, lotPrice, lotTag } from "@/lib/lots";
import { playTap } from "@/lib/linen-sound";
import { useNexus } from "@/lib/nexus-store";

export function NetworkPanel() {
  const { selected, yoursId, startClaim, nodes, selectNode } = useNexus();
  const [hover, setHover] = useState<{
    index: number;
    left: number;
    top: number;
  } | null>(null);

  const index = selected?.index ?? 0;
  const price = lotPrice(index);
  const tag = lotTag(index);
  const myth = REGION_MYTH[selected?.region ?? ""] ?? REGION_MYTH.frontal;
  const isYours = selected?.id === yoursId;
  const isFree = selected?.status === "available";
  const isSold = selected && !isFree && !isYours;

  function onBuy() {
    if (!selected) return;
    if (!isFree) {
      const open = firstFree(nodes);
      if (open) {
        playTap();
        selectNode(open.id);
        startClaim(open.id);
      }
      return;
    }
    playTap();
    startClaim(selected.id);
  }

  return (
    <Panel
      id="network-panel"
      className="panel-dark relative flex min-h-[520px] flex-col p-0 sm:min-h-[640px] lg:min-h-[700px]"
    >
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Hexagon size={16} strokeWidth={1.5} className="text-nexus-violet" />
          <div>
            <p className="font-mono text-sm tracking-[0.08em] text-nexus-text">
              {selected ? tag : "CELL"}
            </p>
            <p className="mt-1 text-[12px] text-nexus-mute">
              {myth.title}
              <span className="mx-2 opacity-40">·</span>
              {isYours ? "yours" : isFree ? "free · breathing" : selected?.status ?? "idle"}
            </p>
          </div>
        </div>
        <p className="font-mono text-[11px] text-nexus-mute">128 nodes</p>
      </div>
      <div className="relative min-h-[420px] flex-1 sm:min-h-[500px]">
        <HexBrain3D onLotHover={setHover} />
        {hover && !isYours ? (
          <div
            className="lotcard"
            style={{ left: `${hover.left}%`, top: `${hover.top}%` }}
          >
            <div className="lotcard-id">{lotTag(hover.index)}</div>
            <div className="lotcard-meta">
              {hover.index === (selected?.index ?? -1)
                ? selected?.status
                : "lot"}
            </div>
            <div className="lotcard-price">{lotPrice(hover.index)} NX</div>
          </div>
        ) : null}
      </div>
      <div className="lotbuy">
        <div className="lotbuy-info">
          <strong>{selected ? tag : "—"}</strong>
          <span>
            {selected
              ? `${myth.title} · ${isYours ? "yours" : isFree ? "hit the pulse to lock" : "taken"}`
              : "Click a breathing cell"}
          </span>
        </div>
        <div className="lotbuy-price">{selected ? `${price} NX` : ""}</div>
        {isYours ? (
          <Link href="/me" className="btn-primary">
            Open chamber
          </Link>
        ) : (
          <button type="button" className="btn-primary" onClick={onBuy}>
            {isSold ? "Find a free lot" : "Lock this cell"}
          </button>
        )}
      </div>
    </Panel>
  );
}
