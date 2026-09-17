"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { playTap } from "@/lib/linen-sound";

export function NightCityArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 200" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fca0fb" />
          <stop offset="45%" stopColor="#ec3f27" />
          <stop offset="100%" stopColor="#080601" />
        </linearGradient>
      </defs>
      <rect width="160" height="200" fill="url(#sky)" />
      <circle cx="118" cy="48" r="16" fill="#fceafc" />
      <circle cx="118" cy="48" r="22" fill="none" stroke="#fb67c5" opacity="0.45" />
      <path d="M0 128 L28 96 L52 118 L78 78 L104 112 L128 88 L160 120 V200 H0 Z" fill="#5b240a" />
      <path d="M0 150 L40 128 L70 146 L100 122 L160 148 V200 H0 Z" fill="#080601" />
      <rect x="28" y="138" width="10" height="22" fill="#3d56da" opacity="0.55" />
      <rect x="44" y="132" width="8" height="28" fill="#fb67c5" opacity="0.55" />
      <rect x="78" y="134" width="9" height="26" fill="#ec3f27" opacity="0.55" />
    </svg>
  );
}

export function CharacterPortrait({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <polygon
        points="60,6 112,36 112,84 60,114 8,84 8,36"
        fill="#080601"
        stroke="#ec3f27"
        strokeWidth="1.4"
      />
      <circle cx="48" cy="56" r="3" fill="#eef2ff" />
      <circle cx="72" cy="56" r="3" fill="#eef2ff" />
      <path d="M46 76 H74" stroke="#fb67c5" strokeWidth="1.2" />
    </svg>
  );
}

export function MemoryThumb({
  kind,
  className = "",
}: {
  kind: "rain" | "city" | "sweet" | "universe" | "creature" | "trace";
  className?: string;
}) {
  const mark =
    kind === "rain"
      ? "M10 8 L14 28 M18 6 L22 30 M26 10 L28 26"
      : kind === "city"
        ? "M8 26 V14 H14 V26 M16 26 V8 H24 V26 M26 26 V16 H32"
        : kind === "sweet"
          ? "M18 10 A8 8 0 1 1 17.9 10"
          : kind === "universe"
            ? "M18 8 A10 10 0 1 1 17.9 8"
            : kind === "creature"
              ? "M10 22 A8 7 0 1 1 26 22 M14 18 H14.1 M22 18 H22.1"
              : "M18 8 L28 14 V22 L18 28 L8 22 V14 Z";
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <rect width="36" height="36" fill="#080601" />
      <path d={mark} fill="none" stroke="#fb67c5" strokeWidth="1.2" />
    </svg>
  );
}

export function ActivitySpark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 36" className={className} aria-hidden>
      <path
        d="M0 22 C28 22 36 12 56 16 C76 20 88 28 124 18 C160 8 176 22 220 22"
        fill="none"
        stroke="#ec3f27"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function HexMark({ on = [] }: { on?: number[] }) {
  return (
    <span className="hexmark" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={on.includes(i) ? "on" : undefined} />
      ))}
    </span>
  );
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`pixel cells-mark ${className}`.trim()}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {/* dashed N */}
      <rect x="15" y="1" width="2" height="2" fill="currentColor" opacity="0.9" />
      <rect x="15" y="4" width="2" height="2" fill="currentColor" opacity="0.55" />
      {/* dashed S */}
      <rect x="15" y="26" width="2" height="2" fill="currentColor" opacity="0.55" />
      <rect x="15" y="29" width="2" height="2" fill="currentColor" opacity="0.9" />
      {/* dashed W */}
      <rect x="1" y="15" width="2" height="2" fill="currentColor" opacity="0.9" />
      <rect x="4" y="15" width="2" height="2" fill="currentColor" opacity="0.55" />
      {/* dashed E */}
      <rect x="26" y="15" width="2" height="2" fill="currentColor" opacity="0.55" />
      <rect x="29" y="15" width="2" height="2" fill="currentColor" opacity="0.9" />
      {/* north ring */}
      <rect x="13" y="6" width="6" height="2" fill="currentColor" />
      <rect x="11" y="8" width="2" height="4" fill="currentColor" />
      <rect x="19" y="8" width="2" height="4" fill="currentColor" />
      <rect x="13" y="12" width="6" height="2" fill="currentColor" />
      {/* south ring */}
      <rect x="13" y="18" width="6" height="2" fill="currentColor" />
      <rect x="11" y="20" width="2" height="4" fill="currentColor" />
      <rect x="19" y="20" width="2" height="4" fill="currentColor" />
      <rect x="13" y="24" width="6" height="2" fill="currentColor" />
      {/* west ring */}
      <rect x="6" y="13" width="2" height="6" fill="currentColor" />
      <rect x="8" y="11" width="4" height="2" fill="currentColor" />
      <rect x="8" y="19" width="4" height="2" fill="currentColor" />
      <rect x="12" y="13" width="2" height="6" fill="currentColor" />
      {/* east ring */}
      <rect x="24" y="13" width="2" height="6" fill="currentColor" />
      <rect x="20" y="11" width="4" height="2" fill="currentColor" />
      <rect x="20" y="19" width="4" height="2" fill="currentColor" />
      <rect x="18" y="13" width="2" height="6" fill="currentColor" />
      {/* nucleus */}
      <rect x="14" y="14" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

export function CellsWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`cells-word ${className}`.trim()}>CELLS</span>
  );
}

export function BloomChips() {
  const chips = [
    "#080601",
    "#FCEAFC",
    "#EC3F27",
    "#FCA0FB",
    "#FB67C5",
    "#5B240A",
    "#DB92BA",
    "#3D56DA",
    "#D4EC6A",
  ];
  return (
    <div className="chips" aria-hidden>
      {chips.map((color) => (
        <i key={color} style={{ background: color }} />
      ))}
    </div>
  );
}

export function SkyToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setLight(html.classList.contains("linen"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("linen");
    document.documentElement.classList.toggle("linen", next);
    try {
      localStorage.setItem("nexus-sky", next ? "day" : "night");
    } catch {
      /* ignore */
    }
    playTap();
  }

  return (
    <button
      type="button"
      className={`sky-toggle ${light ? "is-sun" : "is-moon"}`}
      onClick={toggle}
      aria-label={light ? "Switch to night" : "Switch to day"}
      title={light ? "Night" : "Day"}
    >
      <Moon className="icon-moon" strokeWidth={1.5} aria-hidden />
      <Sun className="icon-sun" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
