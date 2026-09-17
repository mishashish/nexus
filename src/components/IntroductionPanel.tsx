"use client";

import { Panel } from "./ui";
import { RastrType } from "./RastrType";
import { useNexus } from "@/lib/nexus-store";
import { BRAND } from "@/lib/character";

export function IntroductionPanel() {
  const { yours, stats } = useNexus();

  return (
    <Panel className="rastr-panel flex h-full flex-col justify-center p-5 sm:p-7">
      <p className="kicker">{BRAND.tagline}</p>
      <RastrType text="CELLS" height={88} density={11} className="mt-1 max-w-full" />
      <p className="lede mt-5">
        A shared character built as a <b>brain structure</b> — {stats.total}{" "}
        addressable cells. Buy a contract, claim your seat, speak from the map.
      </p>
      <div className="flex flex-wrap gap-3">
        {yours ? (
          <a href="/me" className="btn-primary">
            Open cabinet
          </a>
        ) : (
          <>
            <a href="#contracts" className="btn-primary">
              View contracts
            </a>
            <a href="#network-panel" className="btn-ghost px-2 py-2">
              Structure
            </a>
          </>
        )}
      </div>
      <p className="mt-8 font-mono text-[11px] tracking-[0.12em] text-nexus-mute">
        {stats.claimed} CLAIMED / {stats.memory} TRACES / RSTR.01
      </p>
    </Panel>
  );
}
