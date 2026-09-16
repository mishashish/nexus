export const REGION_MYTH: Record<string, { title: string; line: string }> = {
  frontal: { title: "the asking edge", line: "Questions arrive here first." },
  parietal: { title: "the map of touch", line: "Shape without names." },
  temporal: { title: "the shore of names", line: "Sound and story pool here." },
  occipital: { title: "the light well", line: "Pictures collect here." },
  cingulate: { title: "the inner seam", line: "Two feelings can sit at once." },
  insula: { title: "the hidden weather", line: "Mood shifts before the room notices." },
  hippocampus: { title: "the room of returns", line: "What you sent comes back thinner." },
  cerebellum: { title: "the quiet timing", line: "Rhythm without speech." },
};

export function hashKey(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function shortKey(key: string) {
  if (key.length < 12) return key;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export function makeKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

export function sigilBits(key: string) {
  const h = hashKey(key);
  return Array.from({ length: 64 }, (_, i) => ((h >>> (i % 32)) ^ (i * 17)) & 1);
}
