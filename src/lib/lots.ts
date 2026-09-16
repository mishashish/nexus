import type { NetworkNode } from "./types";

const REGION_BASE = [25, 40, 55, 70, 35, 45, 60, 30];

export function lotPrice(index: number) {
  const region = Math.floor(index / 16) % 8;
  return REGION_BASE[region] + (index % 8) * 5;
}

export function lotTag(index: number) {
  return `#${String(index + 1).padStart(3, "0")}`;
}

export function firstFree(nodes: NetworkNode[]) {
  return (
    nodes.find((n) => n.status === "available" && (n.tint ?? 0) > 0.4) ??
    nodes.find((n) => n.status === "available") ??
    null
  );
}
