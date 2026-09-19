export const CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID || "84532",
); // Base Sepolia
export const CHAIN_NAME =
  process.env.NEXT_PUBLIC_CHAIN_NAME || "Base Sepolia";
export const CHAIN_RPC =
  process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
export const CHAIN_EXPLORER =
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.basescan.org";
export const CHAIN_LABEL = `${CHAIN_NAME}`;

/** Optional treasury / lot contract — real 0x address. If unset, pay settles to self (demo). */
export const LOT_CONTRACT =
  process.env.NEXT_PUBLIC_LOT_CONTRACT ||
  process.env.NEXT_PUBLIC_CELLS_TREASURY ||
  "";

export function treasuryAddress(): string | null {
  const addr = LOT_CONTRACT.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return addr;
  return null;
}

export function isLiveSettlement() {
  return Boolean(treasuryAddress());
}

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

/** Featured lots shown in the contracts bar. */
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

export function priceEthForIndex(index: number): string {
  const featured = FEATURED.find((c) => c.nodeIndex === index);
  if (featured) return featured.priceEth;
  const nx = 25 + (index % 8) * 5;
  return (nx * 0.0004).toFixed(4);
}

export const CHAIN_CONFIG = {
  chainId: CHAIN_ID,
  chainName: CHAIN_NAME,
  rpcUrl: CHAIN_RPC,
  explorerUrl: CHAIN_EXPLORER,
};
