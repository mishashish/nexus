"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";
import type { MemoryEntry } from "@/lib/types";

type Tab = "recent" | "mine";

export function MemoryCard() {
  const { memories, yoursId } = useNexus();
  const [tab, setTab] = useState<Tab>("recent");

  const list = useMemo(() => {
    if (tab === "mine") {
      return memories.filter((m) => m.mine || m.nodeId === yoursId);
    }
    return memories;
  }, [memories, tab, yoursId]);

  return (
    <Panel className="flex min-h-[240px] flex-col p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="kicker mb-1">archive</p>
          <h2 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Memory</h2>
        </div>
        <div className="flex gap-3 font-mono text-[11px]">
          {(["recent", "mine"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={item === tab ? "text-nexus-text" : "text-nexus-mute"}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <ul className="flex-1 space-y-4">
        {list.length === 0 ? (
          <li className="text-sm text-nexus-mute">No traces yet.</li>
        ) : (
          list.slice(0, 5).map((entry) => <MemoryRow key={entry.id} entry={entry} />)
        )}
      </ul>
      <Link href="/memory" className="mt-5 text-sm text-nexus-mute hover:text-nexus-text">
        Open archive →
      </Link>
    </Panel>
  );
}

function MemoryRow({ entry }: { entry: MemoryEntry }) {
  return (
    <li className="border-b border-nexus-line/60 pb-3 last:border-0 last:pb-0">
      <p className="text-[14px] leading-5 text-nexus-text">{entry.title}</p>
      <p className="mt-1 font-mono text-[11px] text-nexus-mute">
        Node {entry.nodeLabel} · {entry.timeAgo}
      </p>
    </li>
  );
}
