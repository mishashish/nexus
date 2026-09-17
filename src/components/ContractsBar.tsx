"use client";

import { CHAIN_LABEL, FEATURED, LOT_CONTRACT } from "@/lib/contracts";
import { playTap } from "@/lib/linen-sound";
import { useNexus } from "@/lib/nexus-store";

export function ContractsBar() {
  const { wallet, connectWallet, disconnectWallet, nodes, startClaim, yoursId } =
    useNexus();

  function onBuy(nodeIndex: number) {
    const node = nodes.find((n) => n.index === nodeIndex);
    if (!node) return;
    playTap();
    startClaim(node.id);
  }

  return (
    <section id="contracts" className="contracts-bar">
      <div className="contracts-head">
        <div>
          <p className="kicker">contracts</p>
          <h2 className="contracts-title">Buy a cell</h2>
          <p className="contracts-sub">
            On-chain costume on {CHAIN_LABEL}. Each lot is one address in the
            brain structure. NX is a label. Demo wallet only — no live transfer
            yet.
          </p>
        </div>
        <div className="contracts-wallet">
          {wallet ? (
            <>
              <span className="wallet-addr">{wallet}</span>
              <button type="button" className="btn-ghost" onClick={disconnectWallet}>
                Disconnect
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary" onClick={connectWallet}>
              Connect wallet
            </button>
          )}
        </div>
      </div>

      <p className="contract-meta">
        Lot contract <code>{LOT_CONTRACT}</code>
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
                  {c.priceNx} NX · {c.priceEth} ETH
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
