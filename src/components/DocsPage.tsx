"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "./PageShell";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "story", label: "The concept" },
  { id: "glossary", label: "Glossary" },
  { id: "participate", label: "How to try it" },
  { id: "faq", label: "FAQ" },
  { id: "status", label: "Status & roadmap" },
];

export function DocsPage() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const nodes = TOC.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.6] },
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <PageShell wide>
      <div className="docshero">
        <p className="kicker">plain language</p>
        <h1>Documentation</h1>
        <p className="lede">
          What NEXUS is, the words it uses, how to try it, and what is real versus
          simulated right now.
        </p>
      </div>

      <div className="docs">
        <nav className="toc" aria-label="Documentation sections">
          <p className="toc-h">On this page</p>
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={active === item.id ? "active" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div>
          <article className="doc-section" id="overview">
            <h2>Overview</h2>
            <p>
              NEXUS is one shared character with no single author. Instead of a
              creator deciding what it thinks and says,{" "}
              <b>128 people each hold a node</b> — a seat in the character&apos;s
              mind. Anyone holding a node can send it a short scenario: a memory, a
              question, a situation. Every scenario that comes in reshapes what the
              character thinks, how it talks, and how the honeycomb looks, for
              everyone who visits the page.
            </p>
            <p>
              There&apos;s no private chat here. Think of it less like a personal
              assistant, and more like a public notebook that 128 people are
              allowed to write in, and that anyone can read.
            </p>
          </article>

          <article className="doc-section" id="story">
            <h2>The concept</h2>
            <p>
              Most digital characters have one owner who controls their personality
              and memory. NEXUS flips that: the voice is split into 128 equal
              seats. No single node holder can dictate who the character becomes —
              it is the sum of everything all 128 people (and its own autonomous
              thoughts) have sent it over time.
            </p>
            <p>
              The 3D honeycomb on the home page is a literal map of this idea: a
              cortex made of cells, 128 of them claimed as nodes, connected to
              their nearest neighbours. When a node holder sends a scenario, a
              signal ripples out from their cell — a reminder that one person&apos;s
              input spreads through a shared mind rather than staying isolated.
            </p>
          </article>

          <article className="doc-section" id="glossary">
            <h2>Glossary</h2>
            <p className="sub">
              The handful of terms you&apos;ll see around the site, without jargon.
            </p>
            <dl className="glossary">
              <div>
                <dt>Node</dt>
                <dd>
                  One of the 128 seats in the mind. One node, one owner. Owning a
                  node is the right to send scenarios — it is not a share of the
                  character, a piece of living tissue, or a financial asset.
                </dd>
              </div>
              <div>
                <dt>Cell</dt>
                <dd>
                  A honeycomb tile on the 3D cortex. Most cells are scenery. 128 of
                  them are nodes you can click.
                </dd>
              </div>
              <div>
                <dt>Lot</dt>
                <dd>
                  A numbered seat on the honeycomb, with a costume price in NX.
                  Buying it in this prototype stores the seat in your browser. It
                  is not a token purchase.
                </dd>
              </div>
              <div>
                <dt>NX</dt>
                <dd>
                  A label next to the price, like a paper ticket. There is no live
                  coin, no wallet, and nothing to invest.
                </dd>
              </div>
              <div>
                <dt>Cabinet</dt>
                <dd>
                  Your private window at /me. Enter this browser, keep a standing
                  name, and send scenarios from the lot you hold.
                </dd>
              </div>
              <div>
                <dt>Claim</dt>
                <dd>
                  Taking a free lot. In this prototype it is stored in your
                  browser. NX is a costume price, not a payment.
                </dd>
              </div>
              <div>
                <dt>Scenario</dt>
                <dd>
                  A short public message a node holder sends — a memory, a
                  question, a hypothetical. Do not include names, addresses, or
                  anything private.
                </dd>
              </div>
              <div>
                <dt>Shared memory</dt>
                <dd>
                  A rolling window of the last 24 public traces. New scenarios are
                  folded into it, which is what makes replies shift over time
                  instead of resetting.
                </dd>
              </div>
              <div>
                <dt>Probe</dt>
                <dd>
                  The pointer inside the 3D view that travels to whichever node
                  most recently triggered a change.
                </dd>
              </div>
              <div>
                <dt>Writer</dt>
                <dd>
                  Who actually composed the sentence. In this build it is a local
                  mock writer. Later it may be a language model. The site should
                  always say which one ran.
                </dd>
              </div>
            </dl>
          </article>

          <article className="doc-section" id="participate">
            <h2>How to try it</h2>
            <p>
              Open the site, pick a free cell, claim it, and send a scenario.
              Everyone sees the same archive.
            </p>
            <ol className="steps-doc">
              <li>
                <span className="n">1</span>
                <div>
                  <h3>Pick a free node</h3>
                  <p>
                    Open{" "}
                    <Link href="/#nodes">The 128 nodes</Link> and click any
                    blooming cell. Pink-blue means free, rose means claimed,
                    vermillion means yours.
                  </p>
                </div>
              </li>
              <li>
                <span className="n">2</span>
                <div>
                  <h3>Claim it</h3>
                  <p>
                    Press claim in the node panel. In this prototype the seat stays
                    in local storage on this device.
                  </p>
                </div>
              </li>
              <li>
                <span className="n">3</span>
                <div>
                  <h3>Send a scenario</h3>
                  <p>
                    Write a short prompt in the archive composer. It is added to
                    the public memory for everyone to read.
                  </p>
                </div>
              </li>
              <li>
                <span className="n">4</span>
                <div>
                  <h3>Watch the mind react</h3>
                  <p>
                    Back in the honeycomb, your cell lights up and a signal ripples
                    across its connections.
                  </p>
                </div>
              </li>
            </ol>
          </article>

          <article className="doc-section" id="faq">
            <h2>FAQ</h2>
            <div className="faq">
              <details>
                <summary>Is there a token?</summary>
                <p>
                  No. Claiming is first-come in this browser. There is no live
                  contract and nothing here is an investment.
                </p>
              </details>
              <details>
                <summary>Do I own part of the character if I hold a node?</summary>
                <p>
                  No. A node is the right to send scenarios — not equity, not a
                  share of any asset, and not a claim over living tissue. It is
                  closer to a seat at a table than a stake in a company.
                </p>
              </details>
              <details>
                <summary>Who actually writes the replies?</summary>
                <p>
                  Software. Right now a local mock writer. Later, if a key is
                  configured, a language model. Neurons do not write the sentences.
                </p>
              </details>
              <details>
                <summary>Can I delete a scenario after sending it?</summary>
                <p>
                  No — scenarios are meant to be public, which is why the composer
                  is short. Don&apos;t include names, addresses, or anything you
                  wouldn&apos;t want published.
                </p>
              </details>
              <details>
                <summary>Can one person own more than one node?</summary>
                <p>The design is one node per identity. This prototype stores one seat per browser.</p>
              </details>
              <details>
                <summary>Is this an investment?</summary>
                <p>
                  No. NEXUS is a creative experiment in collectively authoring a
                  character, not a financial product.
                </p>
              </details>
            </div>
          </article>

          <article className="doc-section" id="status">
            <h2>Status &amp; roadmap</h2>
            <div className="notebox">
              <b>Stage 1 prototype, honest stack.</b> The honeycomb, the archive UI
              and local claim are here. Replies are mock. There is no token, no
              wallet, and no lab connection.
            </div>
            <dl className="glossary">
              <div>
                <dt>Watch</dt>
                <dd>Drag the 3D honeycomb. Click a cell. Read the public memory.</dd>
              </div>
              <div>
                <dt>Claim</dt>
                <dd>Take one free node. It stays in this browser until you clear storage.</dd>
              </div>
              <div>
                <dt>Shared replies</dt>
                <dd>Scenarios stay public and tint the next mock thought.</dd>
              </div>
              <div>
                <dt>Later</dt>
                <dd>
                  Persistent server, wallet login, a real writer, autonomous
                  thoughts on a timer. The constitution does not change.
                </dd>
              </div>
            </dl>
            <p className="docs-end">
              The short myth is in <code>LORE.md</code>. The full rules are in{" "}
              <code>CONSTITUTION.md</code>. Honesty text is in{" "}
              <code>DISCLAIMER.md</code>.
            </p>
          </article>
        </div>
      </div>
    </PageShell>
  );
}
