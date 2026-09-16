"use client";

import { Hexagon, Lock, Sparkles } from "lucide-react";
import { BloomChips } from "./illustrations";
import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";

export function IntroductionPanel() {
  const { stats, yours } = useNexus();

  return (
    <Panel className="flex h-full flex-col justify-center p-6 sm:p-8">
      <BloomChips />
      <p className="kicker mt-5">intelligence in bloom</p>
      <h1 className="hero-title max-w-[12ch] text-[2.35rem] leading-[1.05] font-extrabold tracking-[-0.04em] sm:text-[2.7rem]">
        One mind.
        <br />
        In bloom.
      </h1>
      <p className="lede mt-5">
        A shared character grown from 128 lots. Click a living cell, lock the
        pulse, then speak from that seat.
      </p>
      <div className="flex flex-wrap gap-3">
        {yours ? (
          <a href="/me" className="btn-primary">
            Open cabinet
          </a>
        ) : (
          <>
            <a href="#network-panel" className="btn-primary">
              Enter node →
            </a>
            <a href="/me" className="btn-ghost px-2 py-2">
              Cabinet
            </a>
          </>
        )}
      </div>
      <div className="stat-row">
        <div className="stat-block">
          <Hexagon size={16} strokeWidth={1.5} />
          <strong>{stats.total}</strong>
          <span>nodes</span>
        </div>
        <div className="stat-block">
          <Lock size={16} strokeWidth={1.5} />
          <strong>{stats.claimed}</strong>
          <span>claimed</span>
        </div>
        <div className="stat-block">
          <Sparkles size={16} strokeWidth={1.5} />
          <strong>{stats.memory}</strong>
          <span>traces</span>
        </div>
      </div>
    </Panel>
  );
}
