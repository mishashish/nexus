"use client";

import { useEffect, useRef } from "react";
import type { NetworkNode } from "@/lib/types";

type V3 = { x: number; y: number; z: number };
type HexCell = {
  local: V3;
  size: number;
  hue: "core" | "live" | "dim" | "ghost" | "empty";
  label: string;
  phase: number;
};
type Link = { a: number; b: number };
type Spark = { a: number; b: number; t: number; speed: number };

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}
function rotX(v: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}
function project(v: V3, cx: number, cy: number, scale: number, focal: number) {
  const s = focal / Math.max(0.45, focal + v.z);
  return { x: cx + v.x * scale * s, y: cy + v.y * scale * s, z: v.z, s };
}
function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Flat-top hex path in screen space. */
function hexPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Underground crypto honeycomb — pixel hex cells in a 3D lattice.
 * Not soft AI neurons: hard edges, scanlines, block sparks.
 */
export function CellViewer({
  node,
  neighbors,
  activated,
}: {
  node: NetworkNode;
  neighbors: (NetworkNode | null)[];
  activated: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let yaw = 0.4;
    let pitch = 0.35;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let sparks: Spark[] = [];
    let lastSpawn = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seed = (node.index ?? 1) * 41 + 9;

    // axial hex cluster around core
    const cells: HexCell[] = [
      {
        local: { x: 0, y: 0, z: 0 },
        size: 1,
        hue: "core",
        label: node.label,
        phase: 0,
      },
    ];

    const ring: Array<[number, number, number]> = [
      [1, 0, 0],
      [0.5, 0.12, 0.86],
      [-0.5, -0.08, 0.86],
      [-1, 0.05, 0],
      [-0.5, 0.1, -0.86],
      [0.5, -0.06, -0.86],
    ];

    for (let i = 0; i < 6; i += 1) {
      const n = neighbors[i] ?? null;
      const [x, y, z] = ring[i];
      const elev = (hash(seed + i) - 0.5) * 0.25;
      cells.push({
        local: { x: x * 0.72, y: y + elev, z: z * 0.72 },
        size: 0.62,
        hue: !n ? "empty" : n.status === "active" ? "live" : "dim",
        label: n?.label ?? "",
        phase: i,
      });
    }

    // outer honeycomb debris
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 + 0.2;
      const d = 1.15 + hash(seed + i) * 0.35;
      cells.push({
        local: {
          x: Math.cos(a) * d * 0.55,
          y: (hash(seed + i * 3) - 0.5) * 0.7,
          z: Math.sin(a) * d * 0.55,
        },
        size: 0.28 + hash(seed + i * 5) * 0.18,
        hue: "ghost",
        label: "",
        phase: i + 10,
      });
    }

    const links: Link[] = [];
    for (let i = 1; i <= 6; i += 1) links.push({ a: 0, b: i });
    for (let i = 1; i <= 6; i += 1) {
      const j = i === 6 ? 1 : i + 1;
      links.push({ a: i, b: j });
    }

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const css = canvas!.clientWidth || 280;
      // snap to even pixels for crunchier look
      const px = Math.floor(css * dpr);
      canvas!.width = px - (px % 2);
      canvas!.height = px - (px % 2);
    }

    function tone(hue: HexCell["hue"], linen: boolean) {
      if (hue === "core") return { fill: "#ec3f27", edge: "#ff7a5c", glow: "#ec3f27" };
      if (hue === "live")
        return linen
          ? { fill: "#c43a50", edge: "#e86a7a", glow: "#c43a50" }
          : { fill: "#fb67c5", edge: "#ffb0e8", glow: "#fb67c5" };
      if (hue === "dim")
        return linen
          ? { fill: "#3a3530", edge: "#6a635c", glow: "#3a3530" }
          : { fill: "#5a4a55", edge: "#9a8090", glow: "#5a4a55" };
      if (hue === "empty")
        return linen
          ? { fill: "#d8d2ca", edge: "#080601", glow: "#080601" }
          : { fill: "#1a1614", edge: "#8a7a80", glow: "#2a2220" };
      return linen
        ? { fill: "#b8b0a8", edge: "#6a645c", glow: "#6a645c" }
        : { fill: "#2a2428", edge: "#6a5a60", glow: "#2a2428" };
    }

    function drawHex(
      x: number,
      y: number,
      z: number,
      r: number,
      hue: HexCell["hue"],
      linen: boolean,
      label: string,
      t: number,
      phase: number,
    ) {
      const fog = Math.max(0.25, Math.min(1, 1 - z * 0.4));
      const pulse =
        hue === "core" && activated && !reduced
          ? 1 + 0.08 * Math.sin(t / 180 + phase)
          : 1;
      const R = Math.max(4, r * pulse);
      const c = tone(hue, linen);

      // pixel shadow block
      ctx!.globalAlpha = 0.25 * fog;
      ctx!.fillStyle = "#000";
      hexPath(ctx!, x + 2, y + 3, R);
      ctx!.fill();
      ctx!.globalAlpha = 1;

      // glow (hard, not soft AI bloom — stepped rings)
      if (hue === "core" || hue === "live") {
        for (let k = 3; k >= 1; k -= 1) {
          ctx!.globalAlpha = (0.12 / k) * fog;
          ctx!.fillStyle = c.glow;
          hexPath(ctx!, x, y, R + k * 4);
          ctx!.fill();
        }
        ctx!.globalAlpha = 1;
      }

      // body — flat fill + hard highlight facet
      ctx!.globalAlpha = fog;
      ctx!.fillStyle = c.fill;
      hexPath(ctx!, x, y, R);
      ctx!.fill();

      // top facet (chunky 3D)
      ctx!.fillStyle = c.edge;
      ctx!.globalAlpha = 0.45 * fog;
      ctx!.beginPath();
      ctx!.moveTo(x + R, y);
      ctx!.lineTo(x + R * 0.5, y - R * 0.86);
      ctx!.lineTo(x - R * 0.5, y - R * 0.86);
      ctx!.lineTo(x - R * 0.15, y - R * 0.2);
      ctx!.closePath();
      ctx!.fill();
      ctx!.globalAlpha = fog;

      // hard outline
      ctx!.strokeStyle = linen ? "#080601" : "#fceafc";
      ctx!.lineWidth = Math.max(1, R * 0.08);
      hexPath(ctx!, x, y, R);
      ctx!.stroke();

      // pixel nucleus (square, not circle)
      if (hue === "core" || hue === "live") {
        const n = Math.max(2, Math.floor(R * 0.28));
        ctx!.fillStyle = linen ? "#080601" : "#fff8fc";
        ctx!.fillRect(x - n / 2, y - n / 2, n, n);
      }

      // empty slot = hollow hex
      if (hue === "empty") {
        ctx!.globalCompositeOperation = "destination-out";
        hexPath(ctx!, x, y, R * 0.55);
        ctx!.fill();
        ctx!.globalCompositeOperation = "source-over";
        ctx!.strokeStyle = c.edge;
        ctx!.lineWidth = 1;
        hexPath(ctx!, x, y, R * 0.55);
        ctx!.stroke();
      }

      if (label && hue === "core") {
        ctx!.fillStyle = linen ? "#080601" : "#fceafc";
        ctx!.font = `${Math.max(10, Math.floor(R * 0.42))}px IBM Plex Mono, monospace`;
        ctx!.textAlign = "left";
        ctx!.fillText(`#${label}`, x + R * 0.95, y + 3);
      }
      ctx!.globalAlpha = 1;
    }

    function draw(t: number) {
      const linen = document.documentElement.classList.contains("linen");
      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W / 2;
      const cy = H / 2 + H * 0.02;
      const scale = Math.min(W, H) * 0.42;
      const focal = 2.5;

      // underground void + pixel grain
      ctx!.fillStyle = linen ? "#ebe6df" : "#080601";
      ctx!.fillRect(0, 0, W, H);

      // CRT scanlines
      ctx!.fillStyle = linen ? "rgba(8,6,1,0.04)" : "rgba(252,234,252,0.035)";
      for (let y = 0; y < H; y += 3) {
        ctx!.fillRect(0, y, W, 1);
      }

      // hard radial vignette (blocky steps)
      for (let i = 4; i >= 1; i -= 1) {
        const rr = Math.min(W, H) * (0.15 + i * 0.12);
        ctx!.strokeStyle = linen
          ? `rgba(8,6,1,${0.04 * i})`
          : `rgba(236,63,39,${0.04 * i})`;
        ctx!.lineWidth = 2;
        ctx!.strokeRect(cx - rr, cy - rr * 0.72, rr * 2, rr * 1.44);
      }

      if (!dragging && !reduced) {
        yaw += activated ? 0.004 : 0.0024;
        pitch = 0.32 + Math.sin(t / 4200) * 0.06;
      }

      type P = {
        x: number;
        y: number;
        z: number;
        s: number;
        cell: HexCell;
        r: number;
      };
      const projected: P[] = cells.map((cell) => {
        let v = rotY(cell.local, yaw);
        v = rotX(v, pitch);
        const p = project(v, cx, cy, scale, focal);
        return { ...p, cell, r: cell.size * 28 * p.s * (W / 320) };
      });
      projected.sort((a, b) => a.z - b.z);

      // blocky chain links
      for (const link of links) {
        const A = projected[link.a];
        const B = projected[link.b];
        if (!A || !B) continue;
        if (A.cell.hue === "ghost" && B.cell.hue === "ghost") continue;
        const fog = Math.max(0.2, 1 - ((A.z + B.z) / 2) * 0.4);
        ctx!.strokeStyle = linen
          ? `rgba(8,6,1,${0.35 * fog})`
          : `rgba(252,234,252,${0.28 * fog})`;
        ctx!.lineWidth = Math.max(1, 2 * ((A.s + B.s) / 2));
        ctx!.setLineDash([4, 3]);
        ctx!.beginPath();
        ctx!.moveTo(A.x, A.y);
        ctx!.lineTo(B.x, B.y);
        ctx!.stroke();
        ctx!.setLineDash([]);
      }

      // sparks
      if (!reduced && t - lastSpawn > (activated ? 200 : 400)) {
        lastSpawn = t;
        const live = links.filter(
          (l) =>
            projected[l.a]?.cell.hue !== "ghost" &&
            projected[l.b]?.cell.hue !== "ghost",
        );
        if (live.length) {
          const L = live[Math.floor(Math.random() * live.length)];
          sparks.push({
            a: L.a,
            b: L.b,
            t: 0,
            speed: 0.02 + Math.random() * 0.02,
          });
        }
        if (sparks.length > 14) sparks = sparks.slice(-14);
      }

      const next: Spark[] = [];
      for (const sp of sparks) {
        sp.t += reduced ? 1 : sp.speed;
        if (sp.t > 1) continue;
        next.push(sp);
        const A = projected[sp.a];
        const B = projected[sp.b];
        if (!A || !B) continue;
        const x = A.x + (B.x - A.x) * sp.t;
        const y = A.y + (B.y - A.y) * sp.t;
        const sz = 3 + Math.floor(activated ? 2 : 0);
        ctx!.fillStyle = linen ? "#ec3f27" : "#fceafc";
        ctx!.fillRect(Math.floor(x - sz / 2), Math.floor(y - sz / 2), sz, sz);
        ctx!.fillStyle = "#ec3f27";
        ctx!.fillRect(Math.floor(x - 1), Math.floor(y - 5), 2, 3);
      }
      sparks = next;

      for (const p of projected) {
        drawHex(p.x, p.y, p.z, p.r, p.cell.hue, linen, p.cell.label, t, p.cell.phase);
      }

      // HUD stamp
      ctx!.fillStyle = linen ? "rgba(8,6,1,0.7)" : "rgba(252,234,252,0.65)";
      ctx!.font = `${Math.floor(W * 0.028)}px IBM Plex Mono, monospace`;
      ctx!.textAlign = "center";
      ctx!.fillText(
        activated ? `CELL ${node.label} // HIVE LIVE` : `CELL ${node.label} // HONEYCOMB`,
        W / 2,
        H - 14,
      );

      raf = requestAnimationFrame(draw);
    }

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.01;
      pitch = Math.max(-0.7, Math.min(0.95, pitch + (e.clientY - lastY) * 0.008));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [activated, neighbors, node.index, node.label]);

  return (
    <div className="cell-viewer">
      <canvas
        ref={ref}
        className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="cell-viewer-hint">drag · orbit the hive · hex sparks</p>
    </div>
  );
}
