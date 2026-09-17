"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark, SkyToggle } from "./illustrations";
import { useNexus } from "@/lib/nexus-store";

const LINKS = [
  { href: "/#contracts", label: "Contracts" },
  { href: "/#mind", label: "Structure" },
  { href: "/memory", label: "Memory" },
  { href: "/me", label: "Cabinet" },
  { href: "/docs", label: "Docs" },
];

let logoTaps = 0;

export function Header() {
  const pathname = usePathname();
  const { yours } = useNexus();
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="site-header relative z-20 border-b border-nexus-line/60 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 text-nexus-text"
          onClick={onLogo}
        >
          <LogoMark className="h-8 w-8 text-nexus-text" />
          <span className="cells-word text-[13px] text-nexus-text">CELLS</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          {LINKS.map((link) => {
            const active =
              (link.href === "/docs" && pathname.startsWith("/docs")) ||
              (link.href === "/memory" && pathname.startsWith("/memory")) ||
              (link.href === "/me" && pathname.startsWith("/me")) ||
              (link.href === "/#contracts" && pathname === "/") ||
              (link.href === "/#mind" && pathname === "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`site-nav-link ${active ? "is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <SkyToggle />
          <Link
            href={yours ? "/me" : "/#contracts"}
            className="btn-primary header-cta"
          >
            <span className="header-cta-full">{yours ? "Cabinet" : "Contracts"}</span>
            <span className="header-cta-short">{yours ? "Cabinet" : "Buy"}</span>
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={open ? "is-open" : undefined} aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="mobile-nav-scrim"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav className="mobile-nav" aria-label="Mobile">
            <div className="mobile-nav-links">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="mobile-nav-link"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link
              href={yours ? "/me" : "/#contracts"}
              className="btn-primary mobile-nav-cta"
              onClick={() => setOpen(false)}
            >
              {yours ? "Open cabinet" : "Buy a cell"}
            </Link>
          </nav>
        </>
      ) : null}
    </header>
  );
}
