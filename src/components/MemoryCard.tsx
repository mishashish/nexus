"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive } from "lucide-react";
import { MemoryThumb } from "./illustrations";
import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";
import type { MemoryEntry } from "@/lib/types";

type Tab = "recent" | "popular" | "mine";

export function MemoryCard() {
  const { memories, yoursId } = useNexus();
  const [tab, setTab] = useState<Tab>("recent");

  const list = useMemo(() => {
    if (tab === "popular") {
      return [...memories].sort((a, b) => b.weight - a.weight);
    }
    if (tab === "mine") {
      return memories.filter((m) => m.mine || m.nodeId === yoursId);
    }
    return memories;
  }, [memories, tab, yoursId]);

  return (
    <Panel className="flex min-h-[280px] flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-head mb-0">
          <Archive size={16} strokeWidth={1.5} />
          Memory
        </h2>
        <div className="flex gap-3 font-mono text-[10px] tracking-[0.14em] uppercase">
          {(["recent", "popular", "mine"] as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={item === tab ? "text-nexus-violet" : "text-nexus-mute"}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <ul className="flex-1 space-y-3 overflow-auto pr-1">
        {list.length === 0 ? (
          <li className="text-sm text-nexus-mute">No traces in this view yet.</li>
        ) : (
          list.slice(0, 6).map((entry) => <MemoryRow key={entry.id} entry={entry} />)
        )}
      </ul>
      <Link
        href="/memory"
        className="mt-3 text-right font-mono text-[10px] tracking-[0.16em] text-nexus-mute hover:text-nexus-text"
      >
        Open archive →
      </Link>
    </Panel>
  );
}

function MemoryRow({ entry }: { entry: MemoryEntry }) {
  return (
    <li className="appear flex items-center gap-3">
      <MemoryThumb kind={entry.thumb} className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-nexus-text">{entry.title}</p>
        <p className="truncate font-mono text-[10px] text-nexus-mute">
          Node {entry.nodeLabel} — {entry.timeAgo}
        </p>
      </div>
      <span className="font-mono text-[11px] text-nexus-mute">{entry.weight}</span>
    </li>
  );
}
