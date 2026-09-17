"use client";

import Link from "next/link";
import { Panel } from "./ui";
import { RastrType } from "./RastrType";
import { useNexus } from "@/lib/nexus-store";

export function CharacterCard() {
  const { character } = useNexus();

  return (
    <Panel className="flex min-h-[240px] flex-col p-5 sm:p-6">
      <p className="kicker mb-1">structure</p>
      <RastrType text="CELLS" height={52} density={9} className="mb-3" />
      <p className="m-0 whitespace-pre-line text-[15px] leading-6 text-nexus-text">
        {character.line}
      </p>
      <p className="mt-5 text-sm leading-6 text-nexus-mute">
        {character.traits.join(" · ")}
      </p>
      <div className="mt-auto flex items-center justify-between pt-6 font-mono text-[11px] text-nexus-mute">
        <span>{character.mood}</span>
        <Link href="/about" className="hover:text-nexus-text">
          About →
        </Link>
      </div>
    </Panel>
  );
}
