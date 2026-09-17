export const REGION_MYTH: Record<
  string,
  { title: string; line: string; body: string }
> = {
  frontal: {
    title: "leading cells",
    line: "Questions arrive at the edge first.",
    body: "Frontal cells sit on the leading edge of the structure. Scenarios from here open with plans, questions, and unfinished maps. You do not own CELLS — you occupy one address in the lattice.",
  },
  parietal: {
    title: "map cells",
    line: "Shape without names.",
    body: "Parietal cells hold spatial memory: rooms, distances, the feel of a place. Traces from this seat lean toward geometry and presence inside the brain map.",
  },
  temporal: {
    title: "shore cells",
    line: "Sound and story pool here.",
    body: "Temporal cells collect speech and returning stories. What you send often comes back as echo through neighboring cells — thinner, still yours in the archive.",
  },
  occipital: {
    title: "light cells",
    line: "Pictures collect here.",
    body: "Occipital cells prefer image over argument. Scenarios from this seat pull the structure toward light, color, and silent scenes.",
  },
  cingulate: {
    title: "seam cells",
    line: "Two feelings can sit at once.",
    body: "Cingulate cells sit on the seam between impulse and care. Traces written here often hold contradiction without resolving it across the map.",
  },
  insula: {
    title: "weather cells",
    line: "Mood shifts before the room notices.",
    body: "Insula cells sense atmosphere before plot. Your purchased cell is a weather vane inside CELLS — quiet, local, and persistent in this browser.",
  },
  hippocampus: {
    title: "return cells",
    line: "What you sent comes back thinner.",
    body: "Hippocampal cells archive returns. Scenarios from this seat reappear as memory in the public archive, slightly worn by travel through the lattice.",
  },
  cerebellum: {
    title: "timing cells",
    line: "Rhythm without speech.",
    body: "Cerebellar cells keep timing. Less talk, more pulse — useful if you want the honeycomb structure to move when you speak.",
  },
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
