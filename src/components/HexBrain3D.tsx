"use client";

import { BRAIN } from "@/lib/brain-hex";
import { useNexus } from "@/lib/nexus-store";
import type { NetworkNode } from "@/lib/types";
import { useEffect, useRef } from "react";

const LIGHT = (() => {
  const l = [-0.45, 0.6, 0.66];
  const m = Math.hypot(...l) || 1;
  return l.map((v) => v / m);
})();

const HEX_ANG = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 180) * (60 * i - 30);
  return [Math.cos(a), Math.sin(a)] as const;
});

function mix(a: number[], b: number[], t: number) {
  const u = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  ];
}

function rgbFor(
  node: NetworkNode | undefined,
  lit: number,
  selected: boolean,
  yours: boolean,
  claiming: boolean,
  nx = 0,
  ny = 0,
): string {
  const L = Math.max(0.28, Math.min(1, lit));
  if (claiming) return "rgb(236,63,39)";
  if (yours) return "rgb(236,63,39)";
  if (selected) return "rgb(252,234,252)";
  if (node?.status === "available") {
    const c = mix([252, 160, 251], [61, 86, 218], 0.22 + L * 0.55);
    return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
  }
  if (node?.status === "active") return "rgb(251,103,197)";
  if (node) {
    const c = mix([219, 146, 186], [91, 36, 10], 0.12);
    return `rgb(${c.map((v) => Math.round(v * (0.82 + L * 0.28))).join(",")})`;
  }
  const u = nx * 0.5 + 0.5;
  const v = ny * 0.5 + 0.5;
  let c = mix([236, 63, 39], [251, 103, 197], u);
  c = mix(c, [252, 160, 251], v * 0.42);
  if (v > 0.7) c = mix(c, [252, 234, 252], (v - 0.7) / 0.3);
  if (u > 0.78) c = mix(c, [61, 86, 218], ((u - 0.78) / 0.22) * 0.5);
  if (v < 0.22) c = mix(c, [212, 236, 106], ((0.22 - v) / 0.22) * 0.45);
  const shade = 0.68 + L * 0.42;
  return `rgb(${c.map((n) => Math.round(n * shade)).join(",")})`;
}

export function HexBrain3D({
  onLotHover,
}: {
  onLotHover?: (lot: { index: number; left: number; top: number } | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { nodes, selectedId, selectNode, startClaim, visualTick, yoursId, claimingId } = useNexus();
  const nodesRef = useRef(nodes);
  const selectedRef = useRef(selectedId);
  const yoursRef = useRef(yoursId);
  const claimingRef = useRef(claimingId);
  const claimFn = useRef(startClaim);
  claimFn.current = startClaim;
  const hoverRef = useRef<number | null>(null);
  const pulsesRef = useRef<Array<{ a: number; b: number; t: number; gen: number }>>([]);
  const reducedRef = useRef(false);
  const lookRef = useRef<number | null>(null);
  const prevSel = useRef(selectedId);
  const hoverCb = useRef(onLotHover);
  hoverCb.current = onLotHover;

  useEffect(() => {
    nodesRef.current = nodes;
    selectedRef.current = selectedId;
    yoursRef.current = yoursId;
    claimingRef.current = claimingId;
    if (prevSel.current !== selectedId) {
      prevSel.current = selectedId;
      const idx = nodes.find((n) => n.id === selectedId)?.index;
      if (typeof idx === "number") lookRef.current = idx;
    }
  }, [nodes, selectedId, yoursId, claimingId]);

  useEffect(() => {
    const i = nodes.findIndex((n) => n.id === selectedId);
    if (i < 0 || visualTick === 0) return;
    const nb = BRAIN.neighbors[i] ?? [];
    nb.forEach((j) => pulsesRef.current.push({ a: i, b: j, t: 0, gen: 2 }));
  }, [visualTick, selectedId, nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rotY = -1.25;
    let rotX = 0.22;
    let vY = 0;
    let tgtY: number | null = null;
    let tgtX: number | null = null;
    let dragging = false;
    let down: [number, number] | null = null;
    let moved = 0;
    let lastInteract = performance.now();
    let lastDraw = 0;
    let raf = 0;
    let cy = Math.cos(rotY);
    let sy = Math.sin(rotY);
    let cx = Math.cos(rotX);
    let sx = Math.sin(rotX);
    let W = 720;
    let H = 520;
    const tmp = { x: 0, y: 0, z: 0 };
    const screen = BRAIN.nodes.map(() => ({ x: 0, y: 0, z: 0, vis: 0 }));
    const zs = new Float32Array(BRAIN.cells.length);
    const vis: number[] = [];
    const nodeMap = new Map<number, NetworkNode>();
    let probeDepth = 0;
    let frameN = 0;
    let onScreen = true;
    let paused = false;

    function syncNodes() {
      nodeMap.clear();
      nodesRef.current.forEach((n) => {
        if (typeof n.index === "number") nodeMap.set(n.index, n);
      });
    }

    function resize() {
      const parent = canvas.parentElement;
      const cssW = parent?.clientWidth || 720;
      const cssH = Math.max(420, parent?.clientHeight || 520);
      const dpr = Math.min(1.15, window.devicePixelRatio || 1);
      let w = Math.max(1, Math.floor(cssW * dpr));
      let h = Math.max(1, Math.floor(cssH * dpr));
      const cap = 880 / Math.max(w, h);
      if (cap < 1) {
        w = Math.max(1, Math.floor(w * cap));
        h = Math.max(1, Math.floor(h * cap));
      }
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    function setRot() {
      cy = Math.cos(rotY);
      sy = Math.sin(rotY);
      cx = Math.cos(rotX);
      sx = Math.sin(rotX);
    }

    function proj(x: number, y: number, z: number) {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      const p = 3.6 / (3.6 - z2);
      const sc = Math.min(W, H) * 0.56;
      tmp.x = W / 2 + x1 * sc * p;
      tmp.y = H / 2 + 10 - y2 * sc * p;
      tmp.z = z2;
      return tmp;
    }

    function rotN(nx: number, ny: number, nz: number) {
      const z1 = -nx * sy + nz * cy;
      return ny * sx + z1 * cx;
    }

    function lit(nx: number, ny: number, nz: number) {
      const rx = nx * cy + nz * sy;
      const z1 = -nx * sy + nz * cy;
      const ry = ny * cx - z1 * sx;
      const rz = rotN(nx, ny, nz);
      return Math.max(0, rx * LIGHT[0] + ry * LIGHT[1] + rz * LIGHT[2]) * 0.82 + 0.22;
    }

    function hexPath(
      cell: (typeof BRAIN.cells)[number],
      size: number,
      lift = 0,
    ) {
      ctx.beginPath();
      const ox = cell.nx * lift;
      const oy = cell.ny * lift;
      const oz = cell.nz * lift;
      for (let i = 0; i < 6; i += 1) {
        const [cos, sin] = HEX_ANG[i];
        proj(
          cell.x + ox + size * (cos * cell.t1x + sin * cell.t2x),
          cell.y + oy + size * (cos * cell.t1y + sin * cell.t2y),
          cell.z + oz + size * (cos * cell.t1z + sin * cell.t2z),
        );
        const px = Math.round(tmp.x);
        const py = Math.round(tmp.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    function frame(ts: number) {
      raf = requestAnimationFrame(frame);
      if (paused) return;
      frameN += 1;
      const busy =
        dragging ||
        tgtY !== null ||
        pulsesRef.current.length > 0 ||
        Math.abs(vY) > 0.0005 ||
        probeDepth > 0;
      const minDt = reducedRef.current ? 48 : busy ? 16 : 40;
      if (ts - lastDraw < minDt) return;
      lastDraw = ts;

      if (lookRef.current !== null && !dragging) {
        const n = BRAIN.nodes[lookRef.current];
        if (n) {
          tgtY = Math.atan2(-n.nx, n.nz) + 0.85;
          tgtX = 0.28 + Math.max(-0.3, Math.min(0.4, n.ny * 0.5));
          lastInteract = ts;
        }
        lookRef.current = null;
      }
      if (!dragging) {
        if (tgtY !== null && tgtX !== null) {
          let d = tgtY - rotY;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          rotY += d * 0.07;
          rotX += (tgtX - rotX) * 0.07;
          if (Math.abs(d) < 0.005) tgtY = null;
        } else {
          rotY += vY;
          vY *= 0.94;
          if (!reducedRef.current && ts - lastInteract > 2500) rotY += 0.0032;
        }
      }
      setRot();
      syncNodes();

      const selected = selectedRef.current;
      const yours = yoursRef.current;
      const claiming = claimingRef.current;
      const selectedNode = nodesRef.current.find((n) => n.id === selected);
      const selectedIndex = selectedNode?.index ?? null;

      ctx.fillStyle = "#080601";
      ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(
        W * 0.52,
        H * 0.36,
        6,
        W * 0.5,
        H * 0.46,
        Math.min(W, H) * 0.58,
      );
      glow.addColorStop(0, "rgba(236,63,39,0.22)");
      glow.addColorStop(0.32, "rgba(251,103,197,0.12)");
      glow.addColorStop(0.62, "rgba(61,86,218,0.07)");
      glow.addColorStop(1, "rgba(8,6,1,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      const cells = BRAIN.cells;
      vis.length = 0;
      const pad = 18;
      for (let c = 0; c < cells.length; c += 1) {
        const cell = cells[c];
        const facing = rotN(cell.nx, cell.ny, cell.nz);
        if (facing < 0.06) continue;
        proj(cell.x, cell.y, cell.z);
        if (tmp.x < -pad || tmp.y < -pad || tmp.x > W + pad || tmp.y > H + pad) continue;
        zs[c] = tmp.z;
        vis.push(c);
      }
      vis.sort((a, b) => zs[a] - zs[b]);

      ctx.lineJoin = "miter";
      ctx.miterLimit = 2;
      ctx.imageSmoothingEnabled = false;
      ctx.lineWidth = 1.35;
      for (let i = 0; i < vis.length; i += 1) {
        const cell = cells[vis[i]];
        const node = cell.nodeIndex !== null ? nodeMap.get(cell.nodeIndex) : undefined;
        const isSelected = node?.id === selected;
        const isYours = node?.id === yours;
        const isClaiming = node?.id === claiming;
        let L = lit(cell.nx, cell.ny, cell.nz) * cell.tone;
        if (node?.status === "available" && !reducedRef.current) {
          L *= 0.88 + 0.22 * (0.5 + 0.5 * Math.sin(ts / 380 + (node.index ?? 0)));
        }
        const size = cell.size * (isSelected || isClaiming ? 1.18 : 1);
        const fill = rgbFor(
          node,
          L,
          !!isSelected,
          !!isYours,
          !!isClaiming,
          cell.nx,
          cell.ny,
        );
        hexPath(cell, size * 1.04, -0.018);
        ctx.fillStyle = "rgb(28,10,8)";
        ctx.fill();
        hexPath(cell, size, 0);
        ctx.fillStyle = fill;
        ctx.fill();
        const spec = L * L * L;
        if (spec > 0.16) {
          hexPath(cell, size * 0.52, 0.004);
          ctx.fillStyle = `rgba(252,234,252,${0.08 + spec * 0.28})`;
          ctx.fill();
        }
        hexPath(cell, size, 0);
        ctx.strokeStyle = "#080601";
        ctx.lineWidth = node ? 1.7 : 1.35;
        ctx.stroke();
        if (node) {
          ctx.strokeStyle = isSelected || isYours
            ? "rgba(252,234,252,0.95)"
            : "rgba(252,160,251,0.55)";
          ctx.lineWidth = isSelected ? 2 : 1.15;
          ctx.stroke();
        }
      }

      const vig = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.2,
        W / 2,
        H / 2,
        Math.min(W, H) * 0.58,
      );
      vig.addColorStop(0, "rgba(8,6,1,0)");
      vig.addColorStop(1, "rgba(8,6,1,0.28)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      BRAIN.nodes.forEach((n, i) => {
        const nz = rotN(n.nx, n.ny, n.nz);
        proj(n.x, n.y, n.z);
        screen[i].x = tmp.x;
        screen[i].y = tmp.y;
        screen[i].z = tmp.z;
        screen[i].vis = nz > 0.02 ? 1 : 0;
      });

      if (busy) {
        ctx.strokeStyle = "rgba(251,103,197,0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        BRAIN.links.forEach((link) => {
          const a = screen[link.a];
          const b = screen[link.b];
          if (!a?.vis || !b?.vis) return;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        });
        ctx.stroke();
      }

      const next: typeof pulsesRef.current = [];
      pulsesRef.current.forEach((p) => {
        p.t += reducedRef.current ? 1 : 0.045;
        if (p.t >= 1) {
          if (p.gen > 0) {
            (BRAIN.neighbors[p.b] ?? []).forEach((j) => {
              if (Math.random() < 0.55) next.push({ a: p.b, b: j, t: 0, gen: p.gen - 1 });
            });
          }
          return;
        }
        next.push(p);
        const na = BRAIN.nodes[p.a];
        const nb = BRAIN.nodes[p.b];
        proj(
          na.x + (nb.x - na.x) * p.t,
          na.y + (nb.y - na.y) * p.t,
          na.z + (nb.z - na.z) * p.t,
        );
        ctx.fillStyle = "#ec3f27";
        ctx.fillRect(Math.round(tmp.x) - 2, Math.round(tmp.y) - 2, 4, 4);
      });
      pulsesRef.current = next.length > 80 ? next.slice(-80) : next;

      if (selectedIndex !== null) {
        const n = BRAIN.nodes[selectedIndex];
        const sp = reducedRef.current ? 1 : 0.035;
        probeDepth = Math.min(1, probeDepth + sp);
        const off = 0.78 * (1 - probeDepth) - 0.05;
        const tip = [n.x + n.nx * off, n.y + n.ny * off, n.z + n.nz * off];
        const top = [tip[0] + n.nx * 0.7, tip[1] + n.ny * 0.7, tip[2] + n.nz * 0.7];
        const A = { ...proj(tip[0], tip[1], tip[2]) };
        const B = { ...proj(top[0], top[1], top[2]) };
        ctx.strokeStyle = "rgba(242,242,242,0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(B.x, B.y);
        ctx.lineTo(A.x, A.y);
        ctx.stroke();
        ctx.fillStyle = "#ec3f27";
        ctx.fillRect(B.x - 3, B.y - 3, 6, 6);
        ctx.fillStyle = (frameN >> 4) % 2 ? "#f2f2f2" : "#0a0a0a";
        ctx.fillRect(B.x - 1.5, B.y - 1.5, 3, 3);
      } else {
        probeDepth = 0;
      }

      const hover = hoverRef.current;
      if (hover !== null && screen[hover]?.vis) {
        ctx.strokeStyle = "#f2f2f2";
        ctx.lineWidth = 1;
        ctx.strokeRect(screen[hover].x - 5, screen[hover].y - 5, 10, 10);
      }
    }

    function local(e: PointerEvent) {
      const b = canvas.getBoundingClientRect();
      return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H];
    }

    function hit(lx: number, ly: number) {
      let best = -1;
      let bd = 28 * 28;
      screen.forEach((s, i) => {
        if (!s.vis) return;
        const d = (s.x - lx) ** 2 + (s.y - ly) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    }

    function lookAt(i: number) {
      const n = BRAIN.nodes[i];
      tgtY = Math.atan2(-n.nx, n.nz) + 0.85;
      tgtX = 0.28 + Math.max(-0.3, Math.min(0.4, n.ny * 0.5));
      lastInteract = performance.now();
    }

    const onDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
      moved = 0;
      dragging = true;
      vY = 0;
      tgtY = null;
      tgtX = null;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (dragging && down) {
        const dx = e.clientX - down[0];
        const dy = e.clientY - down[1];
        moved += Math.abs(dx) + Math.abs(dy);
        rotY += dx * 0.008;
        rotX = Math.max(-0.9, Math.min(1.1, rotX + dy * 0.006));
        vY = dx * 0.008;
        down = [e.clientX, e.clientY];
        lastInteract = performance.now();
      }
      const [lx, ly] = local(e);
      const best = hit(lx, ly);
      hoverRef.current = best >= 0 ? best : null;
      if (best >= 0 && screen[best]) {
        hoverCb.current?.({
          index: best,
          left: (screen[best].x / W) * 100,
          top: (screen[best].y / H) * 100,
        });
      } else {
        hoverCb.current?.(null);
      }
      if (!dragging) canvas.style.cursor = best >= 0 ? "pointer" : "grab";
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = "grab";
      if (moved < 6 && hoverRef.current !== null) {
        const i = hoverRef.current;
        const node = nodesRef.current.find((n) => n.index === i);
        if (node) {
          if (node.status === "available") claimFn.current(node.id);
          else selectNode(node.id);
          lookAt(i);
          probeDepth = 0;
          (BRAIN.neighbors[i] ?? []).forEach((j) =>
            pulsesRef.current.push({ a: i, b: j, t: 0, gen: 2 }),
          );
        }
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") rotY -= 0.15;
      if (e.key === "ArrowRight") rotY += 0.15;
      if (e.key === "ArrowUp") rotX -= 0.1;
      if (e.key === "ArrowDown") rotX += 0.1;
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0);
        paused = !onScreen;
        if (onScreen) lastDraw = 0;
      },
      { threshold: [0, 0.01, 0.1] },
    );
    io.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(frame);
    const start = nodesRef.current.find((n) => n.status === "available")?.index
      ?? nodesRef.current.findIndex((n) => n.label === "07");
    if (typeof start === "number" && start >= 0) lookAt(start);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("keydown", onKey);
    };
  }, [selectNode]);

  return (
    <div className="relative h-full min-h-[420px] w-full">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Rotatable 3D honeycomb brain. Drag to rotate, click a cell to select a node."
        className="pixel h-full w-full touch-none cursor-grab outline-none"
      />
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between font-mono text-[10px] text-nexus-mute">
        <span>drag · chunky cells bloom</span>
        <span>click a free cell to lock it</span>
      </div>
    </div>
  );
}
