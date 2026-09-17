"use client";

import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";

export function ThoughtsCard() {
  const { thoughts } = useNexus();

  return (
    <Panel className="flex min-h-[240px] flex-col p-5 sm:p-6">
      <p className="kicker mb-1">feed</p>
      <h2 className="m-0 mb-5 text-xl font-extrabold tracking-[-0.03em]">Thoughts</h2>
      <ul className="space-y-4">
        {thoughts.map((thought) => (
          <li key={thought.id} className="text-[13px] leading-5">
            <span className="font-mono text-[11px] text-nexus-mute">
              {thought.timeAgo}
            </span>
            <p className="mt-1 m-0 text-nexus-text">{thought.text}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
