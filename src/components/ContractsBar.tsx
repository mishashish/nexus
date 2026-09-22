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
            Browser wallet on {CHAIN_LABEL} (MetaMask, Rabby, Coinbase, OKX…).
            Each lot is one paid seat. Pay in {paymentAssetLabel()}
            {isTokenPayment()
              ? "."
              : isLiveSettlement()
                ? " — ETH until the project token is set."
                : ". Purchases unlock when treasury is configured."}
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
                  ? "Connect wallet"
                  : "Install a wallet"}
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
          <>Purchases locked until treasury is set · wallet connect still works</>
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
