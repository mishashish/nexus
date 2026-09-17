"use client";

import { useEffect, useMemo, useRef } from "react";
import { BRAIN } from "@/lib/brain-hex";
import { lotPrice, lotTag } from "@/lib/lots";
import { useNexus } from "@/lib/nexus-store";

function hex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  squat = 0.92,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a) * squat;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Top-down (superior) 2D cortex map — same lattice as 3D, viewed from above.
 * Volume via soft light, shadows, bloom — no orbit camera.
 */
export function NodeMap() {
  const { nodes, selectedId, selectNode, yoursId, startClaim } = useNexus();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<number | null>(null);
  const snap = useRef({ nodes, selectedId, yoursId });
  snap.current = { nodes, selectedId, yoursId };

  const layout = useMemo(() => {
    const src = BRAIN.nodes;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    src.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minZ = Math.min(minZ, n.z);
      maxZ = Math.max(maxZ, n.z);
    });
    const dx = maxX - minX || 1;
    const dz = maxZ - minZ || 1;
    // Looking down −Y: X → right, Z → vertical on page (frontal toward top)
    const pts = src.map((n) => ({
      u: (n.x - minX) / dx,
      v: 1 - (n.z - minZ) / dz,
      elev: n.y,
    }));
    return { pts, neighbors: BRAIN.neighbors };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let sparks: Array<{ a: number; b: number; t: number; sp: number }> = [];
    let lastSpawn = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = parent.clientWidth;
      const h = Math.max(280, Math.min(540, w < 640 ? w * 0.92 : w * 0.55));
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
    }

    function paint(t: number) {
      const linen = document.documentElement.classList.contains("linen");
      const { nodes: ns, selectedId: sel, yoursId: yours } = snap.current;
      const W = canvas!.width;
      const H = canvas!.height;
      const padX = W * 0.09;
      const padY = H * 0.11;
      const mw = W - padX * 2;
      const mh = H - padY * 2;

      // deep void
      const bg = ctx!.createRadialGradient(W * 0.5, H * 0.48, 8, W * 0.5, H * 0.5, W * 0.65);
      if (linen) {
        bg.addColorStop(0, "#fffdf9");
        bg.addColorStop(0.55, "#ebe4da");
        bg.addColorStop(1, "#d9d1c5");
      } else {
        bg.addColorStop(0, "#161014");
        bg.addColorStop(0.45, "#0a0809");
        bg.addColorStop(1, "#040304");
      }
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, W, H);

      // hemisphere washes (volume cue under flat map)
      const gL = ctx!.createRadialGradient(W * 0.3, H * 0.5, 0, W * 0.3, H * 0.5, W * 0.32);
      gL.addColorStop(0, linen ? "rgba(236,63,39,0.06)" : "rgba(236,63,39,0.14)");
      gL.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = gL;
      ctx!.fillRect(0, 0, W, H);
      const gR = ctx!.createRadialGradient(W * 0.7, H * 0.5, 0, W * 0.7, H * 0.5, W * 0.32);
      gR.addColorStop(0, linen ? "rgba(251,103,197,0.05)" : "rgba(251,103,197,0.12)");
      gR.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = gR;
      ctx!.fillRect(0, 0, W, H);

      // soft cortex oval
      ctx!.strokeStyle = linen ? "rgba(8,6,1,0.12)" : "rgba(252,234,252,0.1)";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([5, 6]);
      ctx!.beginPath();
      ctx!.ellipse(W * 0.5, H * 0.5, mw * 0.5, mh * 0.48, 0, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.ellipse(W * 0.3, H * 0.5, mw * 0.28, mh * 0.44, 0, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.beginPath();
      ctx!.ellipse(W * 0.7, H * 0.5, mw * 0.28, mh * 0.44, 0, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.setLineDash([]);

      // fissure
      ctx!.strokeStyle = linen ? "rgba(8,6,1,0.16)" : "rgba(252,234,252,0.14)";
      ctx!.setLineDash([3, 5]);
      ctx!.beginPath();
      ctx!.moveTo(W * 0.5, padY);
      ctx!.lineTo(W * 0.5, H - padY);
      ctx!.stroke();
      ctx!.setLineDash([]);

      // dust
      if (!reduced) {
        for (let i = 0; i < 24; i += 1) {
          const px = padX + ((Math.sin(t / 1800 + i) * 0.5 + 0.5) * mw);
          const py = padY + ((Math.cos(t / 2100 + i * 1.4) * 0.5 + 0.5) * mh);
          ctx!.fillStyle = linen
            ? `rgba(8,6,1,${0.05 + (i % 3) * 0.02})`
            : `rgba(252,220,235,${0.07 + (i % 3) * 0.03})`;
          ctx!.fillRect(px, py, 1.5, 1.5);
        }
      }

      const screen = layout.pts.map((p) => ({
        x: padX + p.u * mw,
        y: padY + p.v * mh,
        elev: p.elev,
      }));
      const rBase = Math.max(6.5, Math.min(12, mw / 40));

      // links under cells
      ctx!.lineWidth = 1;
      layout.neighbors.forEach((nbrs, i) => {
        const A = screen[i];
        if (!A) return;
        nbrs.forEach((j) => {
          if (j <= i) return;
          const B = screen[j];
          if (!B) return;
          const hot =
            ns[i]?.id === yours ||
            ns[j]?.id === yours ||
            ns[i]?.status === "active" ||
            ns[j]?.status === "active";
          ctx!.strokeStyle = hot
            ? reduced
              ? "rgba(236,63,39,0.35)"
              : `rgba(236,63,39,${0.2 + 0.2 * Math.sin(t / 450 + i)})`
            : linen
              ? "rgba(8,6,1,0.1)"
              : "rgba(252,234,252,0.1)";
          ctx!.beginPath();
          ctx!.moveTo(A.x, A.y);
          ctx!.lineTo(B.x, B.y);
          ctx!.stroke();
        });
      });

      // sparks
      if (!reduced && t - lastSpawn > 400) {
        lastSpawn = t;
        const live = ns
          .map((_, i) => i)
          .filter((i) => ns[i]?.id === yours || ns[i]?.status === "active");
        if (live.length) {
          const a = live[(Math.random() * live.length) | 0];
          const nbrs = layout.neighbors[a] ?? [];
          if (nbrs.length) {
            sparks.push({
              a,
              b: nbrs[(Math.random() * nbrs.length) | 0],
              t: 0,
              sp: 0.015 + Math.random() * 0.02,
            });
          }
        }
        if (sparks.length > 12) sparks = sparks.slice(-12);
      }
      const next: typeof sparks = [];
      for (const s of sparks) {
        s.t += reduced ? 1 : s.sp;
        if (s.t > 1) continue;
        next.push(s);
        const A = screen[s.a];
        const B = screen[s.b];
        if (!A || !B) continue;
        const x = A.x + (B.x - A.x) * s.t;
        const y = A.y + (B.y - A.y) * s.t;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, linen ? "rgba(236,63,39,0.85)" : "rgba(255,245,250,0.9)");
        g.addColorStop(0.4, "rgba(236,63,39,0.35)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(x, y, 14, 0, Math.PI * 2);
        ctx!.fill();
      }
      sparks = next;

      // cells — slight size from elevation for depth, soft shadow + lit top
      screen.forEach((p, i) => {
        const node = ns[i];
        const yoursCell = node?.id === yours;
        const free = node?.status === "available";
        const active = node?.status === "active";
        const selected = node?.id === sel;
        const hover = hoverRef.current === i;
        const elev = 0.85 + (p.elev + 0.5) * 0.2;
        const r = rBase * elev * (selected || hover ? 1.15 : 1);

        // soft ground shadow
        ctx!.fillStyle = linen ? "rgba(8,6,1,0.08)" : "rgba(0,0,0,0.35)";
        hex(ctx!, p.x + 1.5, p.y + 2.5, r * 0.95);
        ctx!.fill();

        if (yoursCell || active) {
          const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4);
          glow.addColorStop(
            0,
            yoursCell ? "rgba(236,63,39,0.5)" : "rgba(251,103,197,0.45)",
          );
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = glow;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
          ctx!.fill();
        }

        hex(ctx!, p.x, p.y, r);

        if (free) {
          const rim = ctx!.createRadialGradient(
            p.x - r * 0.25,
            p.y - r * 0.3,
            0,
            p.x,
            p.y,
            r,
          );
          rim.addColorStop(0, linen ? "rgba(255,255,255,0.55)" : "rgba(40,32,36,0.9)");
          rim.addColorStop(1, linen ? "rgba(240,235,228,0.15)" : "rgba(12,10,12,0.4)");
          ctx!.fillStyle = rim;
          ctx!.fill();
          ctx!.strokeStyle = linen ? "#080601" : "#f2eaee";
          ctx!.lineWidth = 1.4;
          ctx!.stroke();
        } else {
          const top = yoursCell
            ? "#ec3f27"
            : active
              ? "#fb67c5"
              : linen
                ? "#6a635c"
                : "#322e2c";
          const lit = ctx!.createRadialGradient(
            p.x - r * 0.3,
            p.y - r * 0.35,
            0,
            p.x,
            p.y,
            r,
          );
          lit.addColorStop(0, yoursCell || active ? "#fff0f4" : linen ? "#9a948c" : "#5a5450");
          lit.addColorStop(0.35, top);
          lit.addColorStop(1, yoursCell ? "#8a1a0c" : active ? "#7a2858" : linen ? "#3a3530" : "#141210");
          ctx!.fillStyle = lit;
          ctx!.fill();
          ctx!.strokeStyle = linen ? "rgba(8,6,1,0.2)" : "rgba(252,234,252,0.15)";
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }

        if (selected) {
          ctx!.strokeStyle = "#ec3f27";
          ctx!.lineWidth = 2;
          hex(ctx!, p.x, p.y, r + 3.5);
          ctx!.stroke();
        }
      });

      ctx!.fillStyle = linen ? "rgba(8,6,1,0.4)" : "rgba(220,210,215,0.45)";
      ctx!.font = `${Math.max(10, W * 0.013)}px IBM Plex Mono, monospace`;
      ctx!.textAlign = "center";
      ctx!.fillText("FRONTAL", W * 0.5, padY * 0.55);
      ctx!.fillText("OCCIPITAL", W * 0.5, H - padY * 0.3);
      ctx!.fillText("L", padX * 0.4, H * 0.5);
      ctx!.fillText("R", W - padX * 0.4, H * 0.5);

      raf = requestAnimationFrame(paint);
    }

    function hit(lx: number, ly: number) {
      const dpr = canvas!.width / (canvas!.clientWidth || 1);
      const x = lx * dpr;
      const y = ly * dpr;
      const W = canvas!.width;
      const H = canvas!.height;
      const padX = W * 0.09;
      const padY = H * 0.11;
      const mw = W - padX * 2;
      const mh = H - padY * 2;
      const r = Math.max(6.5, Math.min(12, mw / 40)) * 1.25;
      let best = -1;
      let bd = r * r;
      layout.pts.forEach((p, i) => {
        const px = padX + p.u * mw;
        const py = padY + p.v * mh;
        const d = (px - x) ** 2 + (py - y) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    }

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    raf = requestAnimationFrame(paint);

    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      hoverRef.current = hit(e.clientX - b.left, e.clientY - b.top);
      canvas.style.cursor = hoverRef.current >= 0 ? "pointer" : "default";
    };
    const onLeave = () => {
      hoverRef.current = null;
    };
    const onClick = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      const i = hit(e.clientX - b.left, e.clientY - b.top);
      if (i < 0) return;
      const node = snap.current.nodes[i];
      if (!node) return;
      if (node.status === "available") startClaim(node.id);
      else selectNode(node.id);
      document.getElementById("network-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onClick);
    };
  }, [layout, selectNode, startClaim]);

  return (
    <section id="nodes" className="mt-10">
      <div className="cortex-raw cortex-vol">
        <div className="cortex-raw-bar">
          <span>cortex · top-down</span>
          <span>
            hollow = free · red = yours · {lotTag(0)}–{lotTag(nodes.length - 1)}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          className="cortex-raw-canvas"
          aria-label="Top-down cortex honeycomb"
        />
        <p className="cortex-raw-foot">
          View from above · click a hollow hex · from {lotPrice(0)} NX
        </p>
      </div>
    </section>
  );
}
