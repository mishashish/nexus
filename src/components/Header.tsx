"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark, SkyToggle } from "./illustrations";
import { GreenDot } from "./ui";
import { useNexus } from "@/lib/nexus-store";

const LINKS = [
  { href: "/#mind", label: "Nodes" },
  { href: "/memory", label: "Memory" },
  { href: "/#about", label: "About" },
  { href: "/me", label: "Cabinet" },
  { href: "/docs", label: "Docs" },
];

let logoTaps = 0;

export function Header() {
  const pathname = usePathname();
  const { yours, stats } = useNexus();
  const [open, setOpen] = useState(false);

  function setLight(on: boolean) {
    document.documentElement.classList.toggle("linen", on);
    try {
      localStorage.setItem("nexus-sky", on ? "day" : "night");
    } catch {
      /* ignore */
    }
  }

  function onLogo() {
    logoTaps += 1;
    if (logoTaps >= 7) {
      setLight(!document.documentElement.classList.contains("linen"));
      logoTaps = 0;
    }
  }

  return (
    <header className="relative z-20 border-b border-nexus-line/60 py-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-nexus-text"
          onClick={onLogo}
        >
          <LogoMark className="h-7 w-7 text-nexus-text" />
          <span className="font-sans text-[15px] tracking-[0.28em]">NEXUS</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {LINKS.map((link) => {
            const active =
              (link.href === "/docs" && pathname.startsWith("/docs")) ||
              (link.href === "/memory" && pathname.startsWith("/memory")) ||
              (link.href === "/me" && pathname.startsWith("/me")) ||
              (link.href === "/#mind" && pathname === "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] ${
                  active
                    ? "border-b-2 border-nexus-green pb-0.5 text-nexus-text"
                    : "text-nexus-mute hover:text-nexus-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-2 font-mono text-[11px] text-nexus-mute lg:flex">
            <GreenDot />
            {stats.total} online
          </p>
          <SkyToggle />
          <Link href={yours ? "/me" : "/#network-panel"} className="btn-primary hidden sm:inline-flex">
            {yours ? "Cabinet" : "Enter node"}
          </Link>
          <button
            type="button"
            className="rounded-sm border border-nexus-line p-2 text-nexus-mute hover:text-nexus-text md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-px w-4 bg-current" />
            <span className="mt-1 block h-px w-4 bg-current" />
            <span className="mt-1 block h-px w-3 bg-current" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="absolute right-0 top-16 z-30 w-52 rounded-xl border border-nexus-line bg-nexus-panel p-4">
          <div className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-nexus-text"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={yours ? "/me" : "/#network-panel"}
              className="btn-primary mt-2"
              onClick={() => setOpen(false)}
            >
              {yours ? "Cabinet" : "Enter node"}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
