import {
  CHAIN_CONFIG,
  CHAIN_ID,
  PAY_TOKEN_DECIMALS,
  PAY_TOKEN_SYMBOL,
  isTokenPayment,
  payTokenAddress,
  paymentAssetLabel,
  priceAmountForIndex,
  treasuryAddress,
} from "./contracts";

export type PaymentCheck = {
  ok: true;
  from: string;
  to: string;
  valueRaw: bigint;
  asset: "eth" | "erc20";
  blockNumber: string;
};

export type PaymentFail = {
  ok: false;
  reason: string;
};

export function parseUnits(amount: string, decimals: number): bigint {
  const cleaned = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error("Invalid amount");
  }
  const [whole, frac = ""] = cleaned.split(".");
  if (frac.length > decimals) throw new Error("Too many decimals");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return (
    BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded || "0")
  );
}

export function formatUnits(raw: bigint, decimals: number): string {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(CHAIN_CONFIG.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = (await res.json()) as { result?: T; error?: { message?: string } };
  if (data.error?.message) throw new Error(data.error.message);
  return data.result as T;
}

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function topicAddress(topic: string): string {
  return `0x${topic.slice(-40)}`.toLowerCase();
}

/**
 * Verify seat payment: ETH transfer to treasury, or ERC-20 Transfer to treasury.
 */
export async function verifySeatPayment(opts: {
  txHash: string;
  wallet: string;
  nodeIndex: number;
  amountPaid?: string;
}): Promise<PaymentCheck | PaymentFail> {
  const treasury = treasuryAddress();
  if (!treasury) {
    return { ok: false, reason: "Treasury not configured (NEXT_PUBLIC_CELLS_TREASURY)." };
  }

  const txHash = opts.txHash.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ok: false, reason: "Invalid transaction hash." };
  }

  const wallet = opts.wallet.trim().toLowerCase();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return { ok: false, reason: "Invalid wallet address." };
  }

  let chainHex: string;
  try {
    chainHex = await rpc<string>("eth_chainId", []);
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Could not read chain id",
    };
  }
  const chainId = Number.parseInt(chainHex, 16);
  if (chainId !== CHAIN_ID) {
    return {
      ok: false,
      reason: `Wrong chain: tx network ${chainId}, expected ${CHAIN_ID}.`,
    };
  }

  type Log = { address?: string; topics?: string[]; data?: string };
  type Receipt = {
    status?: string;
    from?: string;
    to?: string;
    blockNumber?: string;
    logs?: Log[];
  };
  type Tx = {
    from?: string;
    to?: string;
    value?: string;
  };

  let receipt: Receipt | null;
  let tx: Tx | null;
  try {
    receipt = await rpc<Receipt | null>("eth_getTransactionReceipt", [txHash]);
    tx = await rpc<Tx | null>("eth_getTransactionByHash", [txHash]);
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "RPC lookup failed",
    };
  }

  if (!receipt || !tx) {
    return { ok: false, reason: "Transaction not found or not yet mined." };
  }

  if (receipt.status !== "0x1") {
    return { ok: false, reason: "Transaction reverted on-chain." };
  }

  const from = (tx.from || receipt.from || "").toLowerCase();
  if (from !== wallet) {
    return { ok: false, reason: "Transaction sender does not match wallet." };
  }

  const expectedHuman = opts.amountPaid?.trim() || priceAmountForIndex(opts.nodeIndex);
  const token = payTokenAddress();

  if (isTokenPayment() && token) {
    let minRaw: bigint;
    try {
      minRaw = parseUnits(expectedHuman, PAY_TOKEN_DECIMALS);
    } catch {
      return { ok: false, reason: `Invalid expected ${PAY_TOKEN_SYMBOL} amount.` };
    }

    const logs = receipt.logs ?? [];
    const match = logs.find((log) => {
      if ((log.address || "").toLowerCase() !== token.toLowerCase()) return false;
      const topics = log.topics ?? [];
      if (topics[0]?.toLowerCase() !== TRANSFER_TOPIC) return false;
      if (topics.length < 3) return false;
      const logFrom = topicAddress(topics[1]);
      const logTo = topicAddress(topics[2]);
      return logFrom === wallet && logTo === treasury.toLowerCase();
    });

    if (!match) {
      return {
        ok: false,
        reason: `No ${PAY_TOKEN_SYMBOL} transfer to treasury found in this tx.`,
      };
    }

    const valueRaw = BigInt(match.data || "0x0");
    if (valueRaw < minRaw) {
      return {
        ok: false,
        reason: `Paid amount too low (need ≥ ${expectedHuman} ${PAY_TOKEN_SYMBOL}).`,
      };
    }

    return {
      ok: true,
      from,
      to: treasury.toLowerCase(),
      valueRaw,
      asset: "erc20",
      blockNumber: receipt.blockNumber || "0x0",
    };
  }

  const to = (tx.to || receipt.to || "").toLowerCase();
  if (to !== treasury.toLowerCase()) {
    return { ok: false, reason: "Payment was not sent to the CELLS treasury." };
  }

  let minWei: bigint;
  try {
    minWei = parseUnits(expectedHuman, 18);
  } catch {
    return { ok: false, reason: "Invalid expected ETH amount." };
  }

  const valueWei = BigInt(tx.value || "0x0");
  if (valueWei < minWei) {
    return {
      ok: false,
      reason: `Paid amount too low (need ≥ ${expectedHuman} ETH).`,
    };
  }

  return {
    ok: true,
    from,
    to,
    valueRaw: valueWei,
    asset: "eth",
    blockNumber: receipt.blockNumber || "0x0",
  };
}

export function paidAmountLabel(raw: bigint, asset: "eth" | "erc20"): string {
  if (asset === "erc20") {
    return `${formatUnits(raw, PAY_TOKEN_DECIMALS)} ${PAY_TOKEN_SYMBOL}`;
  }
  return `${formatUnits(raw, 18)} ETH`;
}

/** @deprecated use formatUnits — kept for claim route compatibility */
export function weiToEthString(wei: bigint): string {
  return formatUnits(wei, 18);
}

export { paymentAssetLabel };
