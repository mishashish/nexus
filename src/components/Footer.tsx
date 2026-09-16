"use client";

import Link from "next/link";
import { DISCLAIMER } from "@/lib/character";
import { LogoMark } from "./illustrations";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="foot-top">
        <div className="foot-brand">
          <Link href="/" className="flex items-center gap-2 text-nexus-text">
            <LogoMark className="h-5 w-5 text-nexus-violet" />
            <span className="font-sans text-sm">nexus</span>
          </Link>
          <p>One shared character. 128 lots. NX is a label, not an investment.</p>
        </div>
        <div className="foot-cols">
          <div className="foot-col">
            <p className="foot-h">Product</p>
            <Link href="/#mind">Mind</Link>
            <Link href="/#nodes">Lots</Link>
            <Link href="/memory">Archive</Link>
            <Link href="/me">Cabinet</Link>
            <Link href="/docs">Docs</Link>
          </div>
          <div className="foot-col">
            <p className="foot-h">Trust</p>
            <Link href="/docs#faq">What&apos;s real</Link>
            <Link href="/docs#faq">FAQ</Link>
            <Link href="/about">Constitution</Link>
          </div>
        </div>
      </div>
      <p className="foot-legal">{DISCLAIMER}</p>
      <p className="foot-legal mt-2">
        No live token. No lab connection. A node is a seat in a character, not an
        investment.
      </p>
      <div className="foot-wordmark" aria-hidden>
        NEXUS
      </div>
    </footer>
  );
}
