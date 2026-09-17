"use client";

import { Panel } from "./ui";
import { RastrType } from "./RastrType";
import { useNexus } from "@/lib/nexus-store";
import { BRAND } from "@/lib/character";

export function IntroductionPanel() {
  const { yours, stats } = useNexus();

  return (
    <Panel className="rastr-panel flex h-full flex-col justify-center p-4 sm:p-7">
      <p className="kicker">{BRAND.tagline}</p>
      <div className="rastr-hero-wrap">
        <RastrType text="CELLS" height={72} density={11} className="rastr-hero mt-1 max-w-full" />
      </div>
      <p className="lede mt-4 sm:mt-5">
        A shared character built as a <b>brain structure</b> — {stats.total}{" "}
        addressable cells. Buy a contract, claim your seat, speak from the map.
      </p>
      <div className="intro-actions flex flex-wrap gap-2 sm:gap-3">
        {yours ? (
          <a href="/me" className="btn-primary">
            Open cabinet
          </a>
        ) : (
          <>
            <a href="#contracts" className="btn-primary">
              View contracts
            </a>
            <a href="#network-panel" className="btn-ghost">
              Structure
            </a>
          </>
        )}
      </div>
      <p className="mt-6 font-mono text-[10px] tracking-[0.12em] text-nexus-mute sm:mt-8 sm:text-[11px]">
        {stats.claimed} CLAIMED / {stats.memory} TRACES / RSTR.01
      </p>
    </Panel>
  );
}
