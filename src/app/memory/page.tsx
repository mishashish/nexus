"use client";

import { MemoryThumb } from "@/components/illustrations";
import { PageShell } from "@/components/PageShell";
import { useNexus } from "@/lib/nexus-store";

export default function MemoryPage() {
  const { memories } = useNexus();

  return (
    <PageShell>
      <div className="docshero">
        <p className="kicker">archive</p>
        <h1>Public memory</h1>
        <p className="lede">
          The last 24 public traces. Original scenarios and replies are kept.
          Private account data is not stored here.
        </p>
      </div>
      <ul className="space-y-4">
        {memories.map((entry) => (
          <li
            key={entry.id}
            className="grid gap-4 border border-nexus-line p-4 sm:grid-cols-[48px_1fr]"
          >
            <MemoryThumb kind={entry.thumb} className="h-12 w-12" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-medium text-nexus-text">{entry.title}</h2>
                <span className="font-mono text-[11px] text-nexus-mute">
                  Node {entry.nodeLabel} · {entry.timeAgo}
                </span>
              </div>
              <p className="mt-2 text-sm text-nexus-mute">
                scenario — {entry.scenario}
              </p>
              <p className="mt-2 text-[15px] leading-6 text-nexus-text/90">
                {entry.reply}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
