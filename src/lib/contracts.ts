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

/**
 * Required treasury for live settlement.
 * NEXT_PUBLIC_LOT_CONTRACT is a future NFT hook; treasury is the pay destination now.
 */
export const LOT_CONTRACT =
  process.env.NEXT_PUBLIC_LOT_CONTRACT ||
  process.env.NEXT_PUBLIC_CELLS_TREASURY ||
  "";

export function treasuryAddress(): string | null {
  const addr = (process.env.NEXT_PUBLIC_CELLS_TREASURY || LOT_CONTRACT).trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return addr;
  return null;
}

/**
 * Future project token (ERC-20). When set, seats are paid in this token.
 * Leave unset → pay in native ETH (fallback until the coin launches).
 *
 * Pricing targets ~Base membership band (~0.015–0.035 ETH / ~$25–55):
 * token amounts below mirror that band once the coin has a market price.
 */
export const PAY_TOKEN = (process.env.NEXT_PUBLIC_PAY_TOKEN || "").trim();
export const PAY_TOKEN_SYMBOL =
  (process.env.NEXT_PUBLIC_PAY_TOKEN_SYMBOL || "CELLS").trim() || "CELLS";
export const PAY_TOKEN_DECIMALS = Number(
  process.env.NEXT_PUBLIC_PAY_TOKEN_DECIMALS || "18",
);

export function payTokenAddress(): string | null {
  if (/^0x[a-fA-F0-9]{40}$/.test(PAY_TOKEN)) return PAY_TOKEN;
  return null;
}

export function isTokenPayment(): boolean {
  return Boolean(payTokenAddress());
}

export function paymentAssetLabel(): string {
  return isTokenPayment() ? PAY_TOKEN_SYMBOL : "ETH";
}

export function isLiveSettlement() {
  return Boolean(treasuryAddress());
}

export function settlementBlockedReason(): string | null {
  if (treasuryAddress()) return null;
  return "Set NEXT_PUBLIC_CELLS_TREASURY to enable purchases.";
}

export type FeaturedContract = {
  id: string;
  tag: string;
  region: string;
  title: string;
  blurb: string;
  /** Display NX label (costume score, not the pay asset). */
  priceNx: number;
  /** Native ETH price (used when PAY_TOKEN unset). */
  priceEth: string;
  /** ERC-20 amount in human units (used when PAY_TOKEN set). */
  priceToken: string;
  status: "open" | "held" | "yours";
  nodeIndex: number;
};

/**
 * Seat tiers ~ comparable Base membership mints (~0.02 ETH mid).
 * Token column is ready for launch — plug NEXT_PUBLIC_PAY_TOKEN and go.
 */
export const FEATURED: FeaturedContract[] = [
  {
    id: "c-frontal-01",
    tag: "#001",
    region: "frontal",
    title: "asking edge",
    blurb: "First questions land here. A seat for curiosity.",
    priceNx: 25,
    priceEth: "0.015",
    priceToken: "1000",
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
    priceEth: "0.025",
    priceToken: "2500",
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
    priceEth: "0.035",
    priceToken: "5000",
    status: "open",
    nodeIndex: 63,
  },
];

export function priceEthForIndex(index: number): string {
  const featured = FEATURED.find((c) => c.nodeIndex === index);
  if (featured) return featured.priceEth;
  // ~0.015–0.036 band across the grid
  const nx = 25 + (index % 8) * 5;
  return (0.012 + (nx - 25) * 0.0006).toFixed(4);
}

export function priceTokenForIndex(index: number): string {
  const featured = FEATURED.find((c) => c.nodeIndex === index);
  if (featured) return featured.priceToken;
  const nx = 25 + (index % 8) * 5;
  return String(800 + nx * 20);
}

/** Human amount the buyer must pay (ETH or token, depending on config). */
export function priceAmountForIndex(index: number): string {
  return isTokenPayment() ? priceTokenForIndex(index) : priceEthForIndex(index);
}

export function formatSeatPrice(index: number): string {
  return `${priceAmountForIndex(index)} ${paymentAssetLabel()}`;
}

export const CHAIN_CONFIG = {
  chainId: CHAIN_ID,
  chainName: CHAIN_NAME,
  rpcUrl: CHAIN_RPC,
  explorerUrl: CHAIN_EXPLORER,
};
