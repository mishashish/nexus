"use client";

import { MessageCircle } from "lucide-react";
import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";

const DOTS = ["#ec3f27", "#fb67c5", "#3d56da", "#db92ba", "#5b240a"];

export function ThoughtsCard() {
  const { thoughts } = useNexus();

  return (
    <Panel className="flex min-h-[280px] flex-col p-4">
      <h2 className="card-head">
        <MessageCircle size={16} strokeWidth={1.5} />
        Thoughts
      </h2>
      <ul className="space-y-3">
        {thoughts.map((thought, index) => (
          <li key={thought.id} className="flex gap-3 text-[12px] leading-5">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ background: DOTS[index % DOTS.length] }}
            />
            <span className="w-12 shrink-0 font-mono text-[10px] text-nexus-mute">
              {thought.timeAgo}
            </span>
            <span className="text-nexus-mute">—</span>
            <span className="text-nexus-text/90">{thought.text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
