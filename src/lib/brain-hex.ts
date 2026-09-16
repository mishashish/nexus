import type { HexLink, NetworkNode, NodeKind, NodeStatus } from "./types";

export const REGIONS = [
  "frontal",
  "parietal",
  "temporal",
  "occipital",
  "cingulate",
  "insula",
  "hippocampus",
  "cerebellum",
] as const;

export interface HexCell {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  t1x: number;
  t1y: number;
  t1z: number;
  t2x: number;
  t2y: number;
  t2z: number;
  tint: number;
  tone: number;
  size: number;
  nodeIndex: number | null;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hemiPoint(
  side: number,
  dx: number,
  dy: number,
  dz: number,
  noise: boolean,
): [number, number, number, number, number, number, number] {
  const rx = 0.56;
  const ry = 0.62;
  const rz = 0.96;
  const cx = side * 0.21;
  const cy = 0.14;
  if (dx * side < 0) dx *= 0.3;
  if (dy < 0) dy *= 0.62;
  let tone = 1;
  let k = 1;
  if (noise) {
    const f1 =
      Math.sin(dz * 7.5 + dy * 4 + side * 0.7 + Math.sin(dy * 5) * 1.3) *
      Math.sin(dy * 6.5 - dz * 2.6 + Math.sin(dz * 4.2) * 1.1 + side);
    const f2 = Math.sin(dx * side * 9 + dz * 5 + dy * 3);
    const sulc = Math.min(Math.abs(f1), Math.abs(f2) * 1.6);
    const lat = dx * side;
    const sylvian =
      lat > 0.35 && dz > -0.35 && dz < 0.7 && Math.abs(dy - (-0.08 + dz * 0.28)) < 0.07;
    const central = dy > -0.05 && Math.abs(dz - (0.02 + dy * 0.22)) < 0.045;
    if (sulc < 0.16 || sylvian || central) {
      tone = 0.22;
      k = 0.965;
    } else tone = 0.8 + sulc * 0.2;
  }
  const x = cx + dx * rx * k;
  let y = cy + dy * ry * k;
  const z = dz * rz * k;
  if (dy < -0.15 && dz > -0.1 && dz < 0.55 && dx * side > 0.45) y -= 0.1;
  if (dz > 0.7) y -= 0.04 * (dz - 0.7) * 10 * (0.2 - dy);
  const nl = Math.hypot(dx / rx, dy / ry, dz / rz) || 1;
  return [x, y, z, dx / rx / nl, dy / ry / nl, dz / rz / nl, tone];
}

function inBrain(x: number, y: number, z: number) {
  for (const side of [-1, 1]) {
    let dx = (x - side * 0.21) / 0.58;
    let dy = (y - 0.13) / 0.64;
    let dz = z / 0.98;
    if (y < -0.02 && z > -0.12 && z < 0.58 && x * side > 0.2) dy += 0.16;
    if (dx * side < 0) dx /= 0.36;
    if (dy < 0) dy /= 0.68;
    if (dx * dx + dy * dy + dz * dz < 1.02) return true;
  }
  const cbx = x / 0.52;
  const cby = (y + 0.34) / 0.26;
  const cbz = (z + 0.62) / 0.36;
  if (cbx * cbx + cby * cby + cbz * cbz < 1) return true;
  const stemZ = -0.36 + (y + 0.35) * 0.25;
  if (y < -0.18 && y > -0.98 && Math.hypot(x, z - stemZ) < 0.15) return true;
  return false;
}

function gyrusTone(x: number, y: number, z: number) {
  if (Math.abs(x) < 0.055) return 0.12;
  const f1 = Math.sin(z * 7.5 + y * 4 + Math.sin(y * 5) * 1.3) *
    Math.sin(y * 6.5 - z * 2.6 + Math.sin(z * 4.2) * 1.1);
  const f2 = Math.sin(x * 9 + z * 5 + y * 3);
  const sulc = Math.min(Math.abs(f1), Math.abs(f2) * 1.6);
  if (sulc < 0.16) return 0.16;
  return 0.86 + sulc * 0.18;
}

function basis(nx: number, ny: number, nz: number) {
  const up = Math.abs(ny) < 0.92 ? [0, 1, 0] : [1, 0, 0];
  let t1x = up[1] * nz - up[2] * ny;
  let t1y = up[2] * nx - up[0] * nz;
  let t1z = up[0] * ny - up[1] * nx;
  const t1l = Math.hypot(t1x, t1y, t1z) || 1;
  t1x /= t1l;
  t1y /= t1l;
  t1z /= t1l;
  return {
    t1x,
    t1y,
    t1z,
    t2x: ny * t1z - nz * t1y,
    t2y: nz * t1x - nx * t1z,
    t2z: nx * t1y - ny * t1x,
  };
}

function dist2(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

const TYPE_POOL = ["observation", "memory", "signal", "archive", "echo", "idle"] as const;
const OBSERVATIONS = [
  "The city looks different at night.",
  "Rain keeps returning to this cell.",
  "A word repeats here without a source.",
  "Someone described the ocean from above.",
  "The mountains arrived as a rumor.",
  "This node prefers questions to answers.",
  "A sweet taste with no origin.",
  "Lights stacked like unfinished thoughts.",
  "A creature drawn from three memories.",
  "Quiet enough to hear the network breathe.",
  "Two stories occupy the same coordinates.",
  "The sky here is always a little too purple.",
];
const DESCRIPTIONS = [
  "A public cell in the shared mind. Available traces settle here as weather, not as law.",
  "This node holds a fragment of the archive. It does not belong to a single voice.",
  "An open coordinate. Claiming it lets you leave a scenario in the common memory.",
  "A claimed cell. Its owner can speak; visitors can only watch the glow.",
  "A listening post. Recent answers leave a faint change in brightness.",
];

function padLabel(n: number) {
  return String(n).padStart(2, "0");
}

function makeCell(
  x: number,
  y: number,
  z: number,
  size: number,
): HexCell {
  let nx = x;
  let ny = y - 0.08;
  let nz = z - 0.02;
  const nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl;
  ny /= nl;
  nz /= nl;
  const b = basis(nx, ny, nz);
  const tone = gyrusTone(x, y, z);
  return {
    x,
    y,
    z,
    nx,
    ny,
    nz,
    ...b,
    tint: 0.4 + tone * 0.6,
    tone,
    size,
    nodeIndex: null,
  };
}

function buildBrain(seed = 0x4e585553) {
  const rand = mulberry32(seed);
  const s = 0.07;
  const hexR = s * 0.86;
  const sqrt3 = Math.sqrt(3);
  const HEX_NBR: Array<[number, number, number]> = [
    [1, 0, 0],
    [1, -1, 0],
    [0, -1, 0],
    [-1, 0, 0],
    [-1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  const keys = new Set<string>();
  const lattice: Array<{ q: number; r: number; k: number; x: number; y: number; z: number }> = [];
  const kOf = (q: number, r: number, k: number) => `${q},${r},${k}`;

  for (let k = -24; k <= 24; k += 1) {
    for (let r = -22; r <= 22; r += 1) {
      for (let q = -22; q <= 22; q += 1) {
        const x = s * sqrt3 * (q + r / 2 + (k % 2) * 0.18);
        const y = s * 1.5 * r + 0.06;
        const z = s * 1.08 * k;
        if (!inBrain(x, y, z)) continue;
        const key = kOf(q, r, k);
        keys.add(key);
        lattice.push({ q, r, k, x, y, z });
      }
    }
  }

  const surface: typeof lattice = [];
  lattice.forEach((p) => {
    const empty = HEX_NBR.some(([dq, dr, dk]) => !keys.has(kOf(p.q + dq, p.r + dr, p.k + dk)));
    if (empty) surface.push(p);
  });

  const cells: HexCell[] = surface.map((p) => makeCell(p.x, p.y, p.z, hexR));

  const nodeSeeds: Array<{ x: number; y: number; z: number; nx: number; ny: number; nz: number }> =
    [];
  for (const side of [-1, 1]) {
    const cand: typeof nodeSeeds = [];
    const M = 170;
    for (let i = 0; i < M; i += 1) {
      const y = 1 - ((i + 0.5) / M) * 2;
      const q = Math.sqrt(Math.max(0, 1 - y * y));
      const a = i * 2.39996;
      const dx = q * Math.cos(a);
      const dz = q * Math.sin(a);
      if (y < -0.45 || dx * side < -0.15) continue;
      const p = hemiPoint(side, dx, y, dz, false);
      cand.push({
        x: p[0] + p[3] * 0.03,
        y: p[1] + p[4] * 0.03,
        z: p[2] + p[5] * 0.03,
        nx: p[3],
        ny: p[4],
        nz: p[5],
      });
    }
    const step = cand.length / 64;
    for (let i = 0; i < 64; i += 1) nodeSeeds.push(cand[Math.floor(i * step)]);
  }

  const used = new Set<number>();
  const nodeCells: number[] = [];
  const surfaceCount = surface.length;
  nodeSeeds.forEach((seedPt) => {
    let best = -1;
    let bestD = Infinity;
    for (let idx = 0; idx < surfaceCount; idx += 1) {
      if (used.has(idx)) continue;
      const d = dist2(cells[idx], seedPt);
      if (d < bestD) {
        bestD = d;
        best = idx;
      }
    }
    if (best >= 0) {
      used.add(best);
      cells[best].nodeIndex = nodeCells.length;
      cells[best].size = hexR * 1.58;
      nodeCells.push(best);
    }
  });

  const nodes: NetworkNode[] = nodeCells.map((cellIndex, i) => {
    const cell = cells[cellIndex];
    const n = i + 1;
    const label = padLabel(n);
    const roll = rand();
    let status: NodeStatus = "claimed";
    let kind: NodeKind = "idle";
    let pulse = false;
    if (n === 7) {
      status = "active";
      kind = "observation";
      pulse = true;
    } else if (roll < 0.42) {
      status = "available";
      kind = "idle";
    } else if (roll < 0.52) {
      status = "active";
      kind = "signal";
      pulse = roll < 0.48;
    } else if (roll < 0.72) {
      status = "claimed";
      kind = "memory";
    } else {
      status = "claimed";
      kind = roll > 0.82 ? "signal" : "idle";
      pulse = roll > 0.93;
    }
    return {
      id: `node-${label}`,
      slug: `node-${label}`,
      label,
      status,
      kind,
      q: 0,
      r: 0,
      x: cell.x,
      y: cell.y,
      z: cell.z,
      nx: cell.nx,
      ny: cell.ny,
      nz: cell.nz,
      tint: cell.tint,
      pulse,
      type: n === 7 ? "observation" : TYPE_POOL[i % TYPE_POOL.length],
      timeOnline: n === 7 ? "2h 34m" : `${(i % 17) + 1}h ${(i * 7) % 56}m`,
      observation: n === 7 ? OBSERVATIONS[0] : OBSERVATIONS[i % OBSERVATIONS.length],
      description:
        n === 7
          ? "Central focus of the network. Recent answers gather here before they settle into memory."
          : DESCRIPTIONS[i % DESCRIPTIONS.length],
      region: REGIONS[Math.floor(i / 16) % REGIONS.length],
      index: i,
    };
  });

  const links: HexLink[] = [];
  const neighbors: number[][] = nodes.map(() => []);
  nodes.forEach((a, i) => {
    const ranked = nodes
      .map((b, j) => [j, dist2(a, b)] as const)
      .filter(([j]) => j !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 3);
    ranked.forEach(([j]) => {
      if (!neighbors[i].includes(j)) {
        neighbors[i].push(j);
        neighbors[j].push(i);
        links.push({
          id: `${i}-${j}`,
          a: i,
          b: j,
          x1: a.x,
          y1: a.y,
          z1: a.z,
          x2: nodes[j].x,
          y2: nodes[j].y,
          z2: nodes[j].z,
        });
      }
    });
  });

  const central = nodes.find((n) => n.label === "07") ?? nodes[0];

  return {
    cells,
    nodes,
    links,
    neighbors,
    centralId: central.id,
    yoursId: null as string | null,
  };
}

export const NETWORK = buildBrain();
export const BRAIN = NETWORK;
