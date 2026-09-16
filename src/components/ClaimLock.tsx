"use client";

import { useEffect, useRef, useState } from "react";
import { REGION_MYTH } from "@/lib/chamber";
import { lotPrice, lotTag } from "@/lib/lots";
import { playLock, playMiss, playTap } from "@/lib/linen-sound";
import { useNexus } from "@/lib/nexus-store";

export function ClaimLock() {
  const { claimingId, nodes, finishClaim, cancelClaim } = useNexus();
  const node = nodes.find((n) => n.id === claimingId) ?? null;
  const [hot, setHot] = useState(false);
  const [hits, setHits] = useState(0);
  const [hold, setHold] = useState(0);
  const [flash, setFlash] = useState(false);
  const hitsRef = useRef(0);
  const holdRef = useRef(0);
  const holdingRef = useRef(false);
  const hotRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    hitsRef.current = 0;
    holdRef.current = 0;
    holdingRef.current = false;
    doneRef.current = false;
    setHits(0);
    setHold(0);
    setFlash(false);
    if (!claimingId) return;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      const wave = Math.sin(now / 280);
      const isHot = wave > 0.32;
      hotRef.current = isHot;
      setHot(isHot);
      if (holdingRef.current) {
        holdRef.current = Math.min(1, holdRef.current + dt / 850);
        setHold(holdRef.current);
        if (holdRef.current >= 1 && !doneRef.current) {
          doneRef.current = true;
          playLock();
          finishClaim();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelClaim();
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        tryHit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [cancelClaim, claimingId, finishClaim]);

  function tryHit() {
    if (!claimingId || doneRef.current) return;
    if (hotRef.current) {
      playTap();
      hitsRef.current += 1;
      setHits(hitsRef.current);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 140);
      if (hitsRef.current >= 3) {
        doneRef.current = true;
        playLock();
        finishClaim();
      }
    } else {
      playMiss();
    }
  }

  if (!node) return null;
  const index = node.index ?? 0;
  const myth = REGION_MYTH[node.region ?? ""] ?? REGION_MYTH.frontal;

  return (
    <div className="claim-scrim" role="dialog" aria-labelledby="claim-title">
      <div className="claim-stage">
        <p className="kicker">lock the cell</p>
        <p id="claim-title" className="claim-tag">
          {lotTag(index)}
        </p>
        <p className="claim-myth">
          {myth.title} · {lotPrice(index)} NX
        </p>
        <button
          type="button"
          className={`claim-hex${hot ? " is-hot" : ""}${flash ? " is-hit" : ""}`}
          onClick={tryHit}
          onPointerDown={() => {
            holdingRef.current = true;
          }}
          onPointerUp={() => {
            holdingRef.current = false;
          }}
          onPointerLeave={() => {
            holdingRef.current = false;
          }}
          aria-label="Hit the pulse or hold to lock"
        >
          <span className="claim-fill" style={{ height: `${hold * 100}%` }} />
          <span className="claim-hits">
            {hits}/3
          </span>
        </button>
        <p className="claim-hint">
          Tap when it flares — three hits. Or hold until it fills.
        </p>
        <button type="button" className="btn-ghost" onClick={cancelClaim}>
          Let it go
        </button>
      </div>
    </div>
  );
}
