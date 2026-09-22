"use client";

import {
  CHAIN_LABEL,
  FEATURED,
  formatSeatPrice,
  isLiveSettlement,
  isTokenPayment,
  paymentAssetLabel,
  treasuryAddress,
} from "@/lib/contracts";
import { playTap } from "@/lib/linen-sound";
import { useNexus } from "@/lib/nexus-store";
import { CopyableAddress } from "@/components/CopyableAddress";
import { shortAddress } from "@/lib/wallet";

export function ContractsBar() {
  const {
    wallet,
    connectWallet,
    disconnectWallet,
    nodes,
    startClaim,
    yoursId,
    walletBusy,
    walletError,
    hasWalletExt,
    clearWalletError,
  } = useNexus();

  function onBuy(nodeIndex: number) {
    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;
    playTap();
    startClaim(node.id);
  }

  const treasury = treasuryAddress();

  return (
    <section id="contracts" className="contracts-bar">
      <div className="contracts-head">
        <div>
          <p className="kicker">contracts</p>
          <h2 className="contracts-title">Buy a cell</h2>
          <p className="contracts-sub">
            MetaMask on {CHAIN_LABEL}. Each lot is one paid seat in the brain
            structure. Pay in {paymentAssetLabel()}
            {isTokenPayment()
              ? " (project token)."
              : isLiveSettlement()
                ? " — live ETH until PAY_TOKEN is set."
                : " — set NEXT_PUBLIC_CELLS_TREASURY to enable purchases."}
          </p>
        </div>
        <div className="contracts-wallet">
          {wallet ? (
            <>
              <CopyableAddress address={wallet} />
              <button
                type="button"
                className="btn-ghost"
                disabled={walletBusy}
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </>
          ) : (
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
          )}
        </div>
      </div>

      {walletError ? (
        <p className="claim-error contracts-wallet-error" role="alert">
          {walletError}{" "}
          <button type="button" className="claim-error-dismiss" onClick={clearWalletError}>
            dismiss
          </button>
        </p>
      ) : null}

      <p className="contract-meta">
        {treasury ? (
          <>
            Treasury <code>{shortAddress(treasury)}</code>
          </>
        ) : (
          <>Purchases locked · set NEXT_PUBLIC_CELLS_TREASURY</>
        )}
      </p>

      <div className="contracts-grid">
        {FEATURED.map((c) => {
          const node = nodes.find((n) => n.index === c.nodeIndex);
          const yours = node?.id === yoursId;
          const taken = node && node.status !== "available" && !yours;
          return (
            <article key={c.id} className="contract-card">
              <div className="contract-card-top">
                <strong>{c.tag}</strong>
                <span>{yours ? "yours" : taken ? "held" : "open"}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
              <div className="contract-card-foot">
                <span>
                  {c.priceNx} NX · {formatSeatPrice(c.nodeIndex)}
                </span>
                {yours ? (
                  <a href="/me" className="btn-ghost">
                    Cabinet
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!!taken}
                    onClick={() => onBuy(c.nodeIndex)}
                  >
                    {taken ? "Taken" : wallet ? "Buy" : "Claim"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
