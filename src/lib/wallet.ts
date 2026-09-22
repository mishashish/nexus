/**
 * MetaMask / injected EIP-1193 wallet — connect → switch chain → pay ETH or ERC-20.
 */

import {
  PAY_TOKEN_DECIMALS,
  isTokenPayment,
  payTokenAddress,
} from "./contracts";

export type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export class WalletError extends Error {
  code?: number | string;
  constructor(message: string, code?: number | string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

export function shortAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = window.ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length) {
    return (
      eth.providers.find((p) => p.isMetaMask) ?? eth.providers[0] ?? null
    );
  }
  return eth;
}

export function hasInjectedWallet() {
  return Boolean(getInjectedProvider()?.request);
}

function toHexChainId(id: number) {
  return `0x${id.toString(16)}`;
}

/** Parse human decimal amount into base units for given decimals. */
export function parseUnitsToHex(amount: string, decimals: number): string {
  const cleaned = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new WalletError("Invalid payment amount");
  }
  const [whole, frac = ""] = cleaned.split(".");
  if (frac.length > decimals) {
    throw new WalletError("Too many decimals in amount");
  }
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const base =
    BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded || "0");
  if (base <= BigInt(0)) throw new WalletError("Payment amount must be greater than 0");
  return `0x${base.toString(16)}`;
}

function padAddress(addr: string): string {
  return addr.replace(/^0x/i, "").toLowerCase().padStart(64, "0");
}

function padUint(hexAmount: string): string {
  return hexAmount.replace(/^0x/i, "").padStart(64, "0");
}

/** ERC-20 transfer(to, amount) calldata */
export function encodeErc20Transfer(to: string, amountHex: string): string {
  return `0xa9059cbb${padAddress(to)}${padUint(amountHex)}`;
}

export async function connectInjected(): Promise<{
  provider: EthereumProvider;
  address: string;
}> {
  const provider = getInjectedProvider();
  if (!provider?.request) {
    throw new WalletError(
      "MetaMask not found. Install the extension, then refresh.",
      "NO_PROVIDER",
    );
  }
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts[0]) throw new WalletError("No account returned.");
  return { provider, address: accounts[0] };
}

export async function readAccounts(provider: EthereumProvider) {
  try {
    const accounts = (await provider.request({
      method: "eth_accounts",
    })) as string[];
    return accounts ?? [];
  } catch {
    return [];
  }
}

export async function ensureChain(
  provider: EthereumProvider,
  chain: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    explorerUrl: string;
  },
) {
  const want = toHexChainId(chain.chainId);
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (current?.toLowerCase() === want.toLowerCase()) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: want }],
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: want,
            chainName: chain.chainName,
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.explorerUrl],
          },
        ],
      });
      return;
    }
    if (e?.code === 4001) {
      throw new WalletError("Network switch rejected in wallet.", 4001);
    }
    throw new WalletError("Could not switch network.");
  }
}

async function waitForReceipt(
  provider: EthereumProvider,
  hash: string,
  attempts = 40,
): Promise<{ status: "success" | "reverted"; blockNumber?: string }> {
  for (let i = 0; i < attempts; i += 1) {
    const receipt = (await provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })) as { status?: string; blockNumber?: string } | null;
    if (receipt?.status) {
      const ok = receipt.status === "0x1" || receipt.status === "1";
      return {
        status: ok ? "success" : "reverted",
        blockNumber: receipt.blockNumber,
      };
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new WalletError("Timed out waiting for transaction confirmation.");
}

/**
 * Pay for a lot: ERC-20 transfer when PAY_TOKEN is set, else native ETH to treasury.
 */
export async function payForLot(opts: {
  /** Human amount (ETH or token units). */
  amount: string;
  treasury: string | null;
  chain: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    explorerUrl: string;
  };
  expectedAddress?: string | null;
}): Promise<{
  hash: string;
  address: string;
  to: string;
  asset: "eth" | "erc20";
  token?: string;
}> {
  const { provider, address } = await connectInjected();
  if (
    opts.expectedAddress &&
    address.toLowerCase() !== opts.expectedAddress.toLowerCase()
  ) {
    throw new WalletError(
      "Connected wallet does not match the linked address. Reconnect.",
    );
  }

  if (!opts.treasury || !/^0x[a-fA-F0-9]{40}$/.test(opts.treasury)) {
    throw new WalletError(
      "Treasury not configured. Set NEXT_PUBLIC_CELLS_TREASURY.",
      "NO_TREASURY",
    );
  }

  await ensureChain(provider, opts.chain);

  const token = payTokenAddress();
  const useToken = isTokenPayment() && Boolean(token);

  let hash: string;
  try {
    if (useToken && token) {
      const amountHex = parseUnitsToHex(opts.amount, PAY_TOKEN_DECIMALS);
      const data = encodeErc20Transfer(opts.treasury, amountHex);
      hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: token,
            data,
            value: "0x0",
          },
        ],
      })) as string;
    } else {
      const value = parseUnitsToHex(opts.amount, 18);
      hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: opts.treasury,
            value,
          },
        ],
      })) as string;
    }
  } catch (err) {
    const e = err as { code?: number; message?: string };
    if (e?.code === 4001) {
      throw new WalletError("Payment rejected in wallet.", 4001);
    }
    throw new WalletError(e?.message || "Transaction failed.");
  }

  if (!hash) throw new WalletError("No transaction hash returned.");

  const receipt = await waitForReceipt(provider, hash);
  if (receipt.status !== "success") {
    throw new WalletError("Transaction reverted on-chain.");
  }

  return {
    hash,
    address,
    to: useToken && token ? token : opts.treasury,
    asset: useToken ? "erc20" : "eth",
    token: useToken && token ? token : undefined,
  };
}

export function explorerTxUrl(explorerBase: string, hash: string) {
  return `${explorerBase.replace(/\/$/, "")}/tx/${hash}`;
}

export function subscribeWallet(
  provider: EthereumProvider,
  handlers: {
    onAccounts?: (accounts: string[]) => void;
    onChain?: (chainId: string) => void;
  },
) {
  const onAcc = (accounts: unknown) => {
    handlers.onAccounts?.(Array.isArray(accounts) ? (accounts as string[]) : []);
  };
  const onChain = (chainId: unknown) => {
    handlers.onChain?.(String(chainId || ""));
  };
  provider.on?.("accountsChanged", onAcc);
  provider.on?.("chainChanged", onChain);
  return () => {
    provider.removeListener?.("accountsChanged", onAcc);
    provider.removeListener?.("chainChanged", onChain);
  };
}
