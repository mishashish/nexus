"use client";

import { useEffect, useRef } from "react";

type Shape = "circle" | "square" | "diamond" | "cross" | "bar";

type Dot = {
  gx: number;
  gy: number;
  shape: Shape;
  phase: number;
};

/**
 * RASTR-inspired kinetic type: text stamped into a geometric particle field.
 */
export function RastrType({
  text = "CELLS",
  className = "",
  height = 96,
  density = 10,
}: {
  text?: string;
  className?: string;
  height?: number;
  density?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dots: Dot[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function rebuild() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = canvas!.clientWidth || 320;
      const cssH = height;
      canvas!.width = Math.floor(cssW * dpr);
      canvas!.height = Math.floor(cssH * dpr);

      const off = document.createElement("canvas");
      off.width = Math.floor(cssW);
      off.height = Math.floor(cssH);
      const octx = off.getContext("2d");
      if (!octx) return;

      octx.fillStyle = "#000";
      octx.fillRect(0, 0, off.width, off.height);
      octx.fillStyle = "#fff";
      octx.textAlign = "left";
      octx.textBaseline = "middle";
      const fontSize = Math.floor(cssH * 0.72);
      octx.font = `800 ${fontSize}px IBM Plex Mono, ui-monospace, monospace`;
      octx.fillText(text, 4, cssH * 0.52);

      const step = Math.max(4, Math.floor(cssH / density));
      const next: Dot[] = [];
      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const shapes: Shape[] = ["circle", "square", "diamond", "cross", "bar"];

      for (let y = step / 2; y < off.height; y += step) {
        for (let x = step / 2; x < off.width; x += step) {
          const i = (Math.floor(y) * off.width + Math.floor(x)) * 4;
          if (data[i] > 40) {
            const h = (x * 12.9898 + y * 78.233) % 1;
            next.push({
              gx: x / off.width,
              gy: y / off.height,
              shape: shapes[Math.floor(((x + y) / step) % shapes.length)],
              phase: h * Math.PI * 2,
            });
          }
        }
      }
      dots = next;
    }

    function paintShape(
      x: number,
      y: number,
      r: number,
      shape: Shape,
      fill: string,
    ) {
      ctx!.fillStyle = fill;
      ctx!.strokeStyle = fill;
      ctx!.lineWidth = Math.max(1, r * 0.35);
      if (shape === "circle") {
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fill();
      } else if (shape === "square") {
        const s = r * 1.6;
        ctx!.fillRect(x - s / 2, y - s / 2, s, s);
      } else if (shape === "diamond") {
        ctx!.beginPath();
        ctx!.moveTo(x, y - r);
        ctx!.lineTo(x + r, y);
        ctx!.lineTo(x, y + r);
        ctx!.lineTo(x - r, y);
        ctx!.closePath();
        ctx!.fill();
      } else if (shape === "cross") {
        ctx!.fillRect(x - r * 1.2, y - r * 0.25, r * 2.4, r * 0.5);
        ctx!.fillRect(x - r * 0.25, y - r * 1.2, r * 0.5, r * 2.4);
      } else {
        ctx!.fillRect(x - r * 1.4, y - r * 0.2, r * 2.8, r * 0.4);
      }
    }

    function draw(t: number) {
      const linen = document.documentElement.classList.contains("linen");
      const W = canvas!.width;
      const H = canvas!.height;
      ctx!.fillStyle = linen ? "#f2eee8" : "#080601";
      ctx!.fillRect(0, 0, W, H);

      // faint raster grid
      ctx!.strokeStyle = linen ? "rgba(8,6,1,0.06)" : "rgba(252,234,252,0.05)";
      ctx!.lineWidth = 1;
      const g = Math.max(8, H / 12);
      for (let x = 0; x < W; x += g) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
        ctx!.stroke();
      }
      for (let y = 0; y < H; y += g) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
      }

      const ink = linen ? "#080601" : "#fceafc";
      const accent = "#ec3f27";
      const rBase = Math.max(1.6, H / (density * 2.2));

      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i];
        let x = d.gx * W;
        let y = d.gy * H;
        if (!reduced) {
          const n =
            Math.sin(t / 700 + d.phase) * 0.35 +
            Math.cos(t / 1100 + d.gx * 8) * 0.25;
          x += n * rBase * 1.8;
          y += Math.sin(t / 900 + d.phase * 1.3) * rBase * 1.2;
        }
        const live = activatedPulse(i, t);
        paintShape(x, y, rBase * (0.85 + live * 0.25), d.shape, live > 0.7 ? accent : ink);
      }

      raf = requestAnimationFrame(draw);
    }

    function activatedPulse(i: number, t: number) {
      if (reduced) return 0;
      return (Math.sin(t / 280 + i * 0.35) + 1) * 0.5;
    }

    rebuild();
    const ro = new ResizeObserver(rebuild);
    ro.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density, height, text]);

  return (
    <canvas
      ref={ref}
      className={`rastr-type block w-full ${className}`}
      style={{ height, imageRendering: "pixelated" }}
      aria-label={text}
    />
  );
}
