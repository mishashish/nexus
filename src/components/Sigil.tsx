"use client";

import type { MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { sigilBits } from "@/lib/chamber";

export function Sigil({
  seed,
  bits,
  onToggle,
}: {
  seed: string;
  bits?: number[];
  onToggle?: (index: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const grid = bits && bits.length === 64 ? bits : sigilBits(seed);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 8, 8);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        ctx.fillStyle = grid[y * 8 + x] ? "#ec3f27" : "#080601";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [grid]);

  function onClick(event: MouseEvent<HTMLCanvasElement>) {
    if (!onToggle) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.min(7, Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * 8)));
    const y = Math.min(7, Math.max(0, Math.floor(((event.clientY - box.top) / box.height) * 8)));
    onToggle(y * 8 + x);
  }

  return (
    <canvas
      ref={ref}
      width={8}
      height={8}
      className={`h-28 w-28 ${onToggle ? "cursor-crosshair" : ""}`}
      style={{ imageRendering: "pixelated" }}
      aria-label="Browser sigil"
      onClick={onClick}
    />
  );
}
