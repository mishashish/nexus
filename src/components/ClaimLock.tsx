"use client";

import { useEffect } from "react";
import { REGION_MYTH } from "@/lib/chamber";
import {
  CHAIN_LABEL,
  isLiveSettlement,
  priceEthForIndex,
  treasuryAddress,
} from "@/lib/contracts";
import { lotPrice, lotTag } from "@/lib/lots";
import { playLock } from "@/lib/linen-sound";
import { useNexus } from "@/lib/nexus-store";
import { shortAddress } from "@/lib/wallet";

export function ClaimLock() {
  const {
    claimingId,
    nodes,
    finishClaim,
    cancelClaim,
    wallet,
    connectWallet,
    walletBusy,
    walletError,
    hasWalletExt,
    clearWalletError,
  } = useNexus();
  const node = nodes.find((n) => n.id === claimingId) ?? null;

  useEffect(() => {
    if (!claimingId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !walletBusy) cancelClaim();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelClaim, claimingId, walletBusy]);

  if (!node) return null;
  const index = node.index ?? 0;
  const myth = REGION_MYTH[node.region ?? ""] ?? REGION_MYTH.frontal;
  const eth = priceEthForIndex(index);
  const treasury = treasuryAddress();
  const live = isLiveSettlement();

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
          {lotPrice(index)} NX · {eth} ETH · {CHAIN_LABEL}
          <br />
          {live ? (
            <>
              Pay to <code>{shortAddress(treasury!)}</code>
            </>
          ) : (
            <>Demo settlement via MetaMask (self-pay until treasury is set)</>
          )}
        </p>

        {walletError ? (
          <p className="claim-error" role="alert">
            {walletError}{" "}
            <button type="button" className="claim-error-dismiss" onClick={clearWalletError}>
              dismiss
            </button>
          </p>
        ) : null}

        {!wallet ? (
          <div className="claim-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={walletBusy}
              onClick={() => {
                if (!hasWalletExt) {
                  window.open("https://metamask.io/download/", "_blank");
                  return;
                }
                void connectWallet();
              }}
            >
              {walletBusy
                ? "Connecting…"
                : hasWalletExt
                  ? "Connect MetaMask"
                  : "Install MetaMask"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={walletBusy}
              onClick={() => {
                playLock();
                void finishClaim(false);
              }}
            >
              Keep local only
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={walletBusy}
              onClick={cancelClaim}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="claim-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={walletBusy}
              onClick={() => {
                playLock();
                void finishClaim(true);
              }}
            >
              {walletBusy ? "Confirm in wallet…" : `Pay ${eth} ETH`}
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={walletBusy}
              onClick={() => {
                playLock();
                void finishClaim(false);
              }}
            >
              Local claim
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={walletBusy}
              onClick={cancelClaim}
            >
              Cancel
            </button>
          </div>
        )}
        {wallet ? (
          <p className="claim-hint">Wallet {shortAddress(wallet)}</p>
        ) : !hasWalletExt ? (
          <p className="claim-hint">
            Need MetaMask?{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
