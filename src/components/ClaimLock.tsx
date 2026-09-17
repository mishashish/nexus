"use client";

import { useEffect } from "react";
import { REGION_MYTH } from "@/lib/chamber";
import { CHAIN_LABEL, LOT_CONTRACT } from "@/lib/contracts";
import { lotPrice, lotTag } from "@/lib/lots";
import { playLock } from "@/lib/linen-sound";
import { useNexus } from "@/lib/nexus-store";

export function ClaimLock() {
  const {
    claimingId,
    nodes,
    finishClaim,
    cancelClaim,
    wallet,
    connectWallet,
  } = useNexus();
  const node = nodes.find((n) => n.id === claimingId) ?? null;

  useEffect(() => {
    if (!claimingId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelClaim();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelClaim, claimingId]);

  if (!node) return null;
  const index = node.index ?? 0;
  const myth = REGION_MYTH[node.region ?? ""] ?? REGION_MYTH.frontal;
  const eth = (lotPrice(index) * 0.0004).toFixed(3);

  return (
    <div className="claim-scrim" role="dialog" aria-labelledby="claim-title">
      <div className="claim-stage">
        <p className="kicker">purchase seat</p>
        <p id="claim-title" className="claim-tag">
          {lotTag(index)}
        </p>
        <p className="claim-myth">
          <strong>{myth.title}</strong>
          <br />
          {myth.line}
        </p>
        <p className="claim-hint">
          {lotPrice(index)} NX · ~{eth} ETH · {CHAIN_LABEL}
          <br />
          Contract <code>{LOT_CONTRACT}</code>
        </p>
        {!wallet ? (
          <div className="claim-actions">
            <button type="button" className="btn-primary" onClick={connectWallet}>
              Connect wallet
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                playLock();
                finishClaim(false);
              }}
            >
              Keep local only
            </button>
            <button type="button" className="btn-ghost" onClick={cancelClaim}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="claim-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                playLock();
                finishClaim(true);
              }}
            >
              Pay with crypto
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                playLock();
                finishClaim(false);
              }}
            >
              Local claim
            </button>
            <button type="button" className="btn-ghost" onClick={cancelClaim}>
              Cancel
            </button>
          </div>
        )}
        {wallet ? <p className="claim-hint">Wallet {wallet}</p> : null}
      </div>
    </div>
  );
}
