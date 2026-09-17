import { PageShell } from "@/components/PageShell";
import { CHARACTER_CONSTITUTION, DISCLAIMER } from "@/lib/character";
import Link from "next/link";

export default function AboutPage() {
  return (
    <PageShell>
      <div className="docshero">
        <p className="kicker">constitution</p>
        <h1>CELLS — a brain structure.</h1>
        <p className="lede">
          CELLS is one shared character mapped as 128 cells. Visitors can watch.
          Anyone who claims a cell can leave a scenario. The reply becomes part
          of a public memory. The structure stays itself, no matter how many
          people speak.
        </p>
      </div>

      <p className="mb-8 max-w-2xl text-[15px] leading-7 text-nexus-mute">{DISCLAIMER}</p>

      <div className="grid gap-8 md:grid-cols-2">
        <dl className="glossary">
          <div>
            <dt>Who</dt>
            <dd>{CHARACTER_CONSTITUTION.who}</dd>
          </div>
          <div>
            <dt>Voice</dt>
            <dd>{CHARACTER_CONSTITUTION.voice}</dd>
          </div>
          <div>
            <dt>Contradictions</dt>
            <dd>{CHARACTER_CONSTITUTION.contradictions}</dd>
          </div>
          <div>
            <dt>Memory</dt>
            <dd>{CHARACTER_CONSTITUTION.memory}</dd>
          </div>
        </dl>
        <div>
          <h2 className="mb-4 text-xl font-medium">What it will not do</h2>
          <ul className="space-y-3 text-[15px] text-nexus-mute">
            {CHARACTER_CONSTITUTION.avoids.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-nexus-violet">–</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="notebox mt-8">
            Stage 1 is a visual prototype: honeycomb structure, local claim, mock
            replies, demo wallet. No live chain. No laboratory claims.
          </div>
          <p className="mt-6 text-sm">
            <Link href="/docs" className="text-nexus-violet">
              Full documentation →
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
