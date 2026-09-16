"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { CharacterPortrait } from "./illustrations";
import { Panel } from "./ui";
import { useNexus } from "@/lib/nexus-store";

export function CharacterCard() {
  const { character } = useNexus();

  return (
    <Panel className="flex min-h-[280px] flex-col p-4">
      <h2 className="card-head">
        <UserRound size={16} strokeWidth={1.5} />
        Character
      </h2>
      <div className="flex items-start gap-4">
        <CharacterPortrait className="h-20 w-20 shrink-0" />
        <ul className="space-y-1 text-[13px] text-nexus-mute">
          {character.traits.map((trait) => (
            <li key={trait}>{trait}</li>
          ))}
        </ul>
      </div>
      <p className="mt-auto whitespace-pre-line pt-6 text-sm leading-6 text-nexus-text/90">
        {character.line}
      </p>
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-nexus-mute">
        <span>mood · {character.mood}</span>
        <Link href="/about" className="hover:text-nexus-text">
          →
        </Link>
      </div>
    </Panel>
  );
}
