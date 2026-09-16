"use client";

import Link from "next/link";
import { Brain, Hexagon } from "lucide-react";
import { NightCityArt } from "./illustrations";
import { Panel } from "./ui";
import { MIND_STORY } from "@/lib/data";
import { useNexus } from "@/lib/nexus-store";

export function MindPanel() {
  return (
    <Panel className="p-6">
      <p className="card-head">
        <Brain size={16} strokeWidth={1.5} />
        the room
      </p>
      <h2 className="mb-4 text-2xl font-extrabold tracking-[-0.03em]">The mind</h2>
      <div className="grid grid-cols-[1fr_104px] gap-5">
        <p className="text-[15px] leading-6 text-nexus-mute">
          {MIND_STORY.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <div className="hex-frame overflow-hidden">
          <NightCityArt className="h-full w-full object-cover" />
        </div>
      </div>
      <Link href="/docs" className="btn-ghost mt-5">
        Read the docs →
      </Link>
    </Panel>
  );
}

export function CurrentNodeCard() {
  const { selected, startClaim, yoursId } = useNexus();
  const canClaim = selected?.status === "available";

  return (
    <Panel className="flex flex-1 flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="card-head mb-0">
          <Hexagon size={16} strokeWidth={1.5} />
          current node
        </p>
        <p className="font-mono text-[11px] text-nexus-mute">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-nexus-green align-middle" />
          {selected?.label ?? "—"} / {selected?.status ?? "idle"}
        </p>
      </div>
      <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
        <dt className="text-nexus-mute">type</dt>
        <dd>{selected?.type ?? "—"}</dd>
        <dt className="text-nexus-mute">status</dt>
        <dd>{selected?.status ?? "—"}</dd>
        <dt className="text-nexus-mute">region</dt>
        <dd>{selected?.region ?? "—"}</dd>
      </dl>
      <p className="mt-4 text-[15px] leading-6 text-nexus-text/90">
        {selected?.observation ?? "A quiet cell in the network."}
      </p>
      <div className="mt-5">
        {canClaim ? (
          <button
            type="button"
            className="btn-primary py-2 text-sm"
            onClick={() => selected && startClaim(selected.id)}
          >
            Lock this cell
          </button>
        ) : (
          <p className="text-sm text-nexus-mute">
            {selected?.id === yoursId || selected?.status === "yours"
              ? "This lot is yours."
              : selected?.status === "claimed"
                ? "Sold."
                : "Lock a free cell to speak."}
          </p>
        )}
      </div>
    </Panel>
  );
}
