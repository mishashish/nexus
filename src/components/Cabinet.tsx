"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageShell } from "./PageShell";
import { Sigil } from "./Sigil";
import { BRAIN } from "@/lib/brain-hex";
import { REGION_MYTH, shortKey } from "@/lib/chamber";
import { playMiss, playTap } from "@/lib/linen-sound";
import { lotPrice, lotTag } from "@/lib/lots";
import { useNexus } from "@/lib/nexus-store";

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
    sigil,
    toggleSigil,
    stir,
    stirred,
  } = useNexus();
  const [draft, setDraft] = useState("");
  const [name, setName] = useState(alias);
  const [stirHot, setStirHot] = useState(false);
  const myth = REGION_MYTH[yours?.region ?? ""] ?? REGION_MYTH.frontal;
  const traces = useMemo(
    () => memories.filter((m) => m.mine || (yours && m.nodeId === yours.id)),
    [memories, yours],
  );
  const free = useMemo(
    () => nodes.filter((n) => n.status === "available").slice(0, 40),
    [nodes],
  );
  const neighbors = useMemo(() => {
    if (!yours || typeof yours.index !== "number") return [];
    const ids = BRAIN.neighbors[yours.index] ?? [];
    return Array.from({ length: 6 }, (_, i) => nodes[ids[i]] ?? null);
  }, [nodes, yours]);
  const resonance = Math.min(5, traces.length + Math.floor(stirred / 3));

  useEffect(() => {
    if (!yours) return;
    const id = window.setInterval(() => {
      setStirHot((on) => !on);
    }, 640);
    return () => window.clearInterval(id);
  }, [yours]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const ok = await sendScenario(draft);
    if (ok) setDraft("");
  }

  function onStir() {
    if (!stirHot) {
      playMiss();
      return;
    }
    playTap();
    stir();
  }

  return (
    <PageShell>
      <div className="cab-hero">
        <div>
          <p className="kicker">{entered ? "chamber" : "doorway"}</p>
          <h1 className="section-title">
            {entered
              ? yours
                ? myth.title
                : "empty chair"
              : "press the plate"}
          </h1>
          <p className="lede">
            {entered
              ? yours
                ? `${alias || "unnamed"} sits in ${lotTag(yours.index ?? 0)}. Neighbors hear the stir.`
                : "Grey cells on the plate below still breathe. Click one and lock the pulse."
              : "One press stamps a key on this browser. Then you lock a cell in the honeycomb."}
          </p>
          {entered && keyId ? (
            <p className="cab-meta">{shortKey(keyId)}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {!entered ? (
              <button type="button" className="stamp-btn" onClick={enterBrowser}>
                Press
              </button>
            ) : yours ? (
              <>
                <Link href="/memory" className="btn-ghost">
                  Public archive
                </Link>
                <button type="button" className="btn-ghost" onClick={leaveBrowser}>
                  Leave
                </button>
              </>
            ) : (
              <button type="button" className="btn-ghost" onClick={leaveBrowser}>
                Leave
              </button>
            )}
          </div>
        </div>
        <div className="sigil-card">
          <Sigil
            seed={keyId ?? "unsigned"}
            bits={entered ? sigil : undefined}
            onToggle={entered ? toggleSigil : undefined}
          />
          <p className="sigil-cap">
            {entered ? "click pixels · this is yours" : "unsigned"}
          </p>
          <p className="mind-badge">
            {yours ? `seat · ${lotTag(yours.index ?? 0)}` : "seat · empty"}
          </p>
        </div>
      </div>

      {!entered ? (
        <section className="stamp-well">
          <p className="lede mb-0">
            The plate keeps the key. Nothing leaves this window.
          </p>
        </section>
      ) : null}

      {entered && !yours ? (
        <section className="mt-10">
          <h2 className="section-title">Pick a breathing cell</h2>
          <p className="sub">Click — then hit the pulse three times, or hold.</p>
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
        <section className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="chamber-side">
            <p className="kicker">radar</p>
            <div className="radar">
              {neighbors.map((n, i) => (
                <i
                  key={n?.id ?? `empty-${i}`}
                  className={`radar-n radar-n-${i}${n?.status === "active" ? " is-live" : ""}`}
                  title={n ? lotTag(n.index ?? 0) : "empty"}
                />
              ))}
              <i className="radar-you" />
            </div>
            <p className="sub mt-4 mb-2">Resonance {resonance}/5</p>
            <div className="res-track">
              <span style={{ width: `${(resonance / 5) * 100}%` }} />
            </div>
            <p className="kicker mt-8">stir</p>
            <button
              type="button"
            className={`stir-pad${stirHot ? " is-hot" : ""}`}
            onClick={onStir}
            >
              {stirHot ? "now" : "wait"}
            </button>
            <p className="claim-hint">Tap when it says NOW. The honeycomb on the home page jumps.</p>
          </div>
          <div>
            <h2 className="section-title">Speak from here</h2>
            <p className="sub">{myth.line}</p>
            <form
              className="space-y-4"
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
                Keep name
              </button>
            </form>
            <form className="mt-8 space-y-3" onSubmit={onSend}>
              <label className="block text-sm text-nexus-mute">
                Scenario
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={280}
                  placeholder="You wake up in a city where nobody remembers your name. What do you do first?"
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
          <div>
            <h2 className="section-title">Traces</h2>
            <p className="sub">Punched cards from this seat.</p>
            <ul className="space-y-3">
              {traces.length === 0 ? (
                <li className="text-sm text-nexus-mute">Nothing punched yet.</li>
              ) : (
                traces.map((entry) => (
                  <li key={entry.id} className="trace-card">
                    <p className="text-sm text-nexus-mute">{entry.scenario}</p>
                    <p className="mt-1 text-[15px] leading-6">{entry.reply}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
