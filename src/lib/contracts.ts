export const LOT_CONTRACT = "0x7a3f…CELLS";
export const CHAIN_LABEL = "Base Sepolia · demo";

export type FeaturedContract = {
  id: string;
  tag: string;
  region: string;
  title: string;
  blurb: string;
  priceNx: number;
  priceEth: string;
  status: "open" | "held" | "yours";
  nodeIndex: number;
};

/** Stage-1 costume contracts — no live chain calls. */
export const FEATURED: FeaturedContract[] = [
  {
    id: "c-frontal-01",
    tag: "#001",
    region: "frontal",
    title: "asking edge",
    blurb: "First questions land here. A seat for curiosity.",
    priceNx: 25,
    priceEth: "0.012",
    status: "open",
    nodeIndex: 0,
  },
  {
    id: "c-insula-95",
    tag: "#095",
    region: "insula",
    title: "hidden weather",
    blurb: "Mood shifts before the room notices.",
    priceNx: 75,
    priceEth: "0.028",
    status: "open",
    nodeIndex: 94,
  },
  {
    id: "c-hippo-64",
    tag: "#064",
    region: "hippocampus",
    title: "room of returns",
    blurb: "What you send comes back thinner.",
    priceNx: 105,
    priceEth: "0.041",
    status: "open",
    nodeIndex: 63,
  },
];

export function mockWallet() {
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return `0x${hex}…${hex.slice(0, 4)}`;
}

export function mockTx() {
  return `0x${Date.now().toString(16)}…demo`;
}
