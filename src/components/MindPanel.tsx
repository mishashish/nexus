"use client";

import { Panel } from "./ui";
import { MIND_STORY } from "@/lib/data";
import Link from "next/link";
import { useNexus } from "@/lib/nexus-store";

export function MindPanel() {
  return (
    <Panel className="p-6">
      <p className="kicker mb-1">structure</p>
      <h2 className="mb-4 text-2xl font-extrabold tracking-[-0.03em]">The map</h2>
      <p className="m-0 text-[15px] leading-6 text-nexus-mute">
        {MIND_STORY.join(" ")}
      </p>
      <Link href="/docs" className="btn-ghost mt-5">
        Docs →
      </Link>
    </Panel>
  );
}

export function CurrentNodeCard() {
  const { selected, startClaim, yoursId } = useNexus();
  const canClaim = selected?.status === "available";

  return (
    <Panel className="flex flex-1 flex-col p-6">
      <p className="kicker mb-1">selection</p>
      <h2 className="mb-4 text-2xl font-extrabold tracking-[-0.03em]">
        Node {selected?.label ?? "—"}
      </h2>
      <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
        <dt className="text-nexus-mute">status</dt>
        <dd className="text-nexus-text">{selected?.status ?? "—"}</dd>
        <dt className="text-nexus-mute">region</dt>
        <dd className="text-nexus-text">{selected?.region ?? "—"}</dd>
        <dt className="text-nexus-mute">type</dt>
        <dd className="text-nexus-text">{selected?.type ?? "—"}</dd>
      </dl>
      <p className="mt-4 text-[15px] leading-6 text-nexus-text">
        {selected?.observation ?? "A quiet cell in the network."}
      </p>
      <div className="mt-5">
        {canClaim ? (
          <button
            type="button"
            className="btn-primary py-2 text-sm"
            onClick={() => selected && startClaim(selected.id)}
          >
            Claim lot
          </button>
        ) : (
          <p className="text-sm text-nexus-mute">
            {selected?.id === yoursId || selected?.status === "yours"
              ? "This lot is yours."
              : selected?.status === "claimed"
                ? "Already claimed."
                : "Claim a free cell to speak."}
          </p>
        )}
      </div>
    </Panel>
  );
}
