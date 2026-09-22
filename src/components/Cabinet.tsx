"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CellViewer } from "./CellViewer";
import { PageShell } from "./PageShell";
import { BRAIN } from "@/lib/brain-hex";
import { REGION_MYTH, shortKey } from "@/lib/chamber";
import { CHAIN_LABEL, treasuryAddress } from "@/lib/contracts";
import { playTap } from "@/lib/linen-sound";
import { lotPrice, lotTag } from "@/lib/lots";
import { useNexus } from "@/lib/nexus-store";
import { shortAddress } from "@/lib/wallet";

const REGIONS = [
  "all",
  "frontal",
  "parietal",
  "temporal",
  "occipital",
  "cingulate",
  "insula",
  "hippocampus",
  "cerebellum",
] as const;

export function Cabinet() {
  const {
    entered,
    keyId,
    alias,
    setAlias,
    enterBrowser,
    leaveBrowser,
    yours,
    nodes,
    memories,
    startClaim,
    sendScenario,
    busy,
    wallet,
    connectWallet,
    disconnectWallet,
    walletBusy,
    hasWalletExt,
    activated,
    activateCell,
    stir,
    stirred,
  } = useNexus();
  const [draft, setDraft] = useState("");
  const [name, setName] = useState(alias);
  const [regionFilter, setRegionFilter] = useState<(typeof REGIONS)[number]>("all");
  const [pulseNote, setPulseNote] = useState("");

  const myth = REGION_MYTH[yours?.region ?? ""] ?? REGION_MYTH.frontal;
  const traces = useMemo(
    () => memories.filter((m) => m.mine || (yours && m.nodeId === yours.id)),
    [memories, yours],
  );
  const free = useMemo(
    () => nodes.filter((n) => n.status === "available").slice(0, 32),
    [nodes],
  );
  const neighbors = useMemo(() => {
    if (!yours || typeof yours.index !== "number") return [];
    const ids = BRAIN.neighbors[yours.index] ?? [];
    return Array.from({ length: 6 }, (_, i) => nodes[ids[i]] ?? null);
  }, [nodes, yours]);

  const inventory = useMemo(() => {
    const owned = yours ? [yours] : [];
    const near = neighbors.filter(Boolean) as typeof nodes;
    const pool = [...owned, ...near.filter((n) => n.id !== yours?.id)];
    if (regionFilter === "all") return pool;
    return pool.filter((n) => n.region === regionFilter);
  }, [neighbors, regionFilter, yours]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    inventory.find((n) => n.id === selectedId) ||
    inventory[0] ||
    yours ||
    null;
  const selectedMyth =
    REGION_MYTH[selected?.region ?? ""] ?? REGION_MYTH.frontal;
  const isOwned = selected?.id === yours?.id;

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const ok = await sendScenario(draft);
    if (ok) setDraft("");
  }

  function onPulse() {
    playTap();
    stir();
    setPulseNote("Pulse sent across neighboring cells.");
    window.setTimeout(() => setPulseNote(""), 1800);
  }

  function onActivate() {
    playTap();
    activateCell();
    setPulseNote("Cell activated in this browser.");
    window.setTimeout(() => setPulseNote(""), 1800);
  }

  return (
    <PageShell>
      <div className="cab-glow" aria-hidden />

      <div className="cab-hero cab-hero-single">
        <div>
          <p className="kicker">personal ledger</p>
          <h1 className="section-title">
            {!entered ? "Cabinet" : "Your cells"}
          </h1>
          <p className="lede">
            {!entered
              ? "Open the ledger to see owned cells, neighbors, and the living viewer — like a Void cabinet for the brain map."
              : wallet
                ? `${shortAddress(wallet)} · ${alias || "unnamed"}`
                : "Wallet optional. Local key keeps your seat."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {!entered ? (
              <button type="button" className="btn-primary" onClick={enterBrowser}>
                Unlock cabinet
              </button>
            ) : (
              <>
                {wallet ? (
                  <button
                    type="button"
                    className="btn-ghost"
                    title={wallet}
                    disabled={walletBusy}
                    onClick={disconnectWallet}
                  >
                    {shortAddress(wallet)}
                  </button>
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
                <Link href="/#contracts" className="btn-ghost">
                  Contracts
                </Link>
                <button type="button" className="btn-ghost" onClick={leaveBrowser}>
                  Leave
                </button>
              </>
            )}
          </div>
          {entered && keyId ? (
            <p className="cab-meta mt-4">local key · {shortKey(keyId)}</p>
          ) : null}
        </div>
      </div>

      {!entered ? (
        <section className="cab-locked">
          <p className="lede mb-0">
            Access locked. Enter to open your personal ledger of cells.
          </p>
        </section>
      ) : null}

      {entered && !yours ? (
        <section className="mt-10">
          <h2 className="section-title">No cell yet</h2>
          <p className="sub">
            Claim from <a href="/#contracts">contracts</a> or pick a free square.
          </p>
          <div className="grid grid-cols-8 gap-1 sm:grid-cols-[repeat(16,minmax(0,1fr))]">
            {free.map((node) => (
              <button
                key={node.id}
                type="button"
                title={`${lotTag(node.index ?? 0)} · ${lotPrice(node.index ?? 0)} NX`}
                onClick={() => startClaim(node.id)}
                className="lot-free aspect-square"
              />
            ))}
          </div>
        </section>
      ) : null}

      {entered && yours ? (
        <>
          <div className="cab-stats">
            <div>
              <span>owned</span>
              <strong>1</strong>
            </div>
            <div>
              <span>neighbors</span>
              <strong>{neighbors.filter(Boolean).length}</strong>
            </div>
            <div>
              <span>pulses</span>
              <strong>{stirred}</strong>
            </div>
            <div>
              <span>status</span>
              <strong>{activated ? "activated" : "held"}</strong>
            </div>
          </div>

          <div className="region-filters">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={regionFilter === r ? "is-on" : undefined}
                onClick={() => setRegionFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <section className="cab-split">
            <div className="cab-list">
              <p className="kicker">inventory</p>
              <ul>
                {inventory.map((n) => {
                  const m = REGION_MYTH[n.region ?? ""] ?? REGION_MYTH.frontal;
                  const mine = n.id === yours.id;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`cab-lot${selected?.id === n.id ? " is-active" : ""}`}
                        onClick={() => setSelectedId(n.id)}
                      >
                        <span className="cab-lot-tag">{lotTag(n.index ?? 0)}</span>
                        <span className="cab-lot-title">
                          {m.title}
                          {mine ? " · yours" : ""}
                          {mine && activated ? " · fed" : ""}
                        </span>
                        <span className="cab-lot-meta">
                          {n.region} · {lotPrice(n.index ?? 0)} NX
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="cab-detail">
              {selected ? (
                <>
                  <CellViewer
                    node={selected}
                    neighbors={isOwned ? neighbors : []}
                    activated={isOwned && activated}
                  />
                  <div className="cab-detail-body">
                    <p className="kicker">{isOwned ? "owned cell" : "neighbor"}</p>
                    <h2 className="section-title mb-2">{selectedMyth.title}</h2>
                    <p className="lede">{selectedMyth.body}</p>
                    <dl className="neuron-meta">
                      <div>
                        <dt>Seat</dt>
                        <dd>{lotTag(selected.index ?? 0)}</dd>
                      </div>
                      <div>
                        <dt>Region</dt>
                        <dd>{selected.region}</dd>
                      </div>
                      <div>
                        <dt>Chain</dt>
                        <dd>{CHAIN_LABEL}</dd>
                      </div>
                      <div>
                        <dt>Treasury</dt>
                        <dd>
                          {treasuryAddress()
                            ? shortAddress(treasuryAddress()!)
                            : "not configured"}
                        </dd>
                      </div>
                    </dl>
                    {isOwned ? (
                      <div className="cab-actions">
                        {!activated ? (
                          <button type="button" className="btn-primary" onClick={onActivate}>
                            Activate cell
                          </button>
                        ) : (
                          <button type="button" className="btn-primary" onClick={onPulse}>
                            Pulse neighbors
                          </button>
                        )}
                        <Link href="/#network-panel" className="btn-ghost">
                          Open structure →
                        </Link>
                      </div>
                    ) : null}
                    {pulseNote ? <p className="cab-note">{pulseNote}</p> : null}
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="neuron-panel mt-10">
            <div className="neuron-main">
              <p className="kicker">speak</p>
              <h2 className="section-title mb-2">{myth.title}</h2>
              <p className="sub">{myth.line}</p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setAlias(name);
                }}
              >
                <label className="block text-sm text-nexus-mute">
                  Standing name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    placeholder="shore-walker"
                    className="mt-2 h-10 w-full border border-nexus-line bg-transparent px-3 text-nexus-text outline-none focus:border-nexus-violet"
                  />
                </label>
                <button type="submit" className="btn-ghost">
                  Save
                </button>
              </form>
              <form className="mt-8 space-y-3" onSubmit={onSend}>
                <label className="block text-sm text-nexus-mute">
                  Scenario from this cell
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={280}
                    placeholder="Speak from your seat…"
                    className="mt-2 min-h-[120px] w-full border border-nexus-line bg-transparent p-3 text-[15px] text-nexus-text outline-none focus:border-nexus-violet"
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-nexus-mute">
                    {draft.length} / 280
                  </span>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy || !draft.trim()}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
            <div className="neuron-side">
              <h2 className="section-title">Traces</h2>
              <ul className="mt-4 space-y-3">
                {traces.length === 0 ? (
                  <li className="text-sm text-nexus-mute">Nothing yet.</li>
                ) : (
                  traces.map((entry) => (
                    <li key={entry.id} className="trace-card">
                      <p className="text-sm text-nexus-mute">{entry.scenario}</p>
                      <p className="mt-1 text-[15px] leading-6">{entry.reply}</p>
                    </li>
                  ))
                )}
              </ul>
              <Link href="/memory" className="btn-ghost mt-6 inline-flex">
                Public archive →
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
