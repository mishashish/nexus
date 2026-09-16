"use client";

import { ActiveNodeCard } from "./ActiveNodeCard";
import { CharacterCard } from "./CharacterCard";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { HowItWorks } from "./HowItWorks";
import { IntroductionPanel } from "./IntroductionPanel";
import { MemoryCard } from "./MemoryCard";
import { CurrentNodeCard, MindPanel } from "./MindPanel";
import { NetworkPanel } from "./NetworkPanel";
import { NodeMap } from "./NodeMap";
import { ThoughtsCard } from "./ThoughtsCard";

export function Dashboard() {
  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-4 sm:px-6">
      <Header />
      <section
        id="mind"
        className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]"
      >
        <IntroductionPanel />
        <NetworkPanel />
      </section>
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MindPanel />
        <CurrentNodeCard />
      </section>
      <HowItWorks />
      <NodeMap />
      <section
        id="archive"
        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <MemoryCard />
        <ActiveNodeCard />
        <ThoughtsCard />
        <CharacterCard />
      </section>
      <Footer />
    </div>
  );
}
