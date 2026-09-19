/**
 * MetaMask / injected EIP-1193 wallet — Void-style connect → switch chain → pay.
 */

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

function parseEtherToHex(ethAmount: string): string {
  const cleaned = ethAmount.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new WalletError("Invalid ETH amount");
  }
  const [whole, frac = ""] = cleaned.split(".");
  const fracPadded = (frac + "000000000000000000").slice(0, 18);
  const wei =
    BigInt(whole) * BigInt("1000000000000000000") + BigInt(fracPadded || "0");
  if (wei <= BigInt(0)) throw new WalletError("Payment amount must be greater than 0");
  return `0x${wei.toString(16)}`;
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
  let accounts: string[];
  try {
    accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[];
  } catch (err) {
    const e = err as { code?: number; message?: string };
    if (e?.code === 4001) {
      throw new WalletError("Connection rejected in wallet.", 4001);
    }
    throw new WalletError(e?.message || "Could not connect wallet.");
  }
  const raw = accounts?.[0];
  if (!raw) throw new WalletError("No account returned from wallet.");
  return { provider, address: raw };
}

export async function readAccounts(
  provider: EthereumProvider,
): Promise<string[]> {
  try {
    return (await provider.request({ method: "eth_accounts" })) as string[];
  } catch {
    return [];
  }
}

export async function readChainId(provider: EthereumProvider): Promise<string> {
  try {
    return String(
      (await provider.request({ method: "eth_chainId" })) || "",
    ).toLowerCase();
  } catch {
    return "";
  }
}

export async function ensureChain(
  provider: EthereumProvider,
  opts: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    explorerUrl: string;
    currency?: { name: string; symbol: string; decimals: number };
  },
) {
  const hexId = toHexChainId(opts.chainId).toLowerCase();
  const current = await readChainId(provider);
  if (current === hexId) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
  } catch (err) {
    const e = err as { code?: number; message?: string };
    const msg = String(e?.message || err || "");
    if (/already pending/i.test(msg)) {
      throw new WalletError(
        "Wallet has a pending network request. Open MetaMask → Reject, then retry.",
      );
    }
    if (e?.code === 4902 || /Unrecognized chain/i.test(msg)) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexId,
              chainName: opts.chainName,
              nativeCurrency: opts.currency ?? {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [opts.rpcUrl],
              blockExplorerUrls: [opts.explorerUrl],
            },
          ],
        });
      } catch (addErr) {
        const addMsg = String(
          (addErr as { message?: string })?.message || addErr || "",
        );
        if (/already pending/i.test(addMsg)) {
          throw new WalletError(
            "Pending Add Network in MetaMask. Reject it, then retry.",
          );
        }
        throw new WalletError(
          `Add ${opts.chainName} (id ${opts.chainId}) in MetaMask, switch to it, then retry.`,
        );
      }
      return;
    }
    if (e?.code === 4001) {
      throw new WalletError("Network switch rejected in wallet.", 4001);
    }
    throw new WalletError(msg || "Could not switch network.");
  }
}

export async function waitForReceipt(
  provider: EthereumProvider,
  hash: string,
  { timeoutMs = 120_000 } = {},
): Promise<{ status: "success" | "reverted"; blockNumber?: string }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const receipt = (await provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })) as { status?: string; blockNumber?: string } | null;
    if (receipt) {
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
 * Pay for a lot: send native ETH to treasury (or self if treasury unset — demo settlement).
 */
export async function payForLot(opts: {
  ethAmount: string;
  treasury: string | null;
  chain: {
    chainId: number;
    chainName: string;
    rpcUrl: string;
    explorerUrl: string;
  };
  expectedAddress?: string | null;
}): Promise<{ hash: string; address: string; to: string }> {
  const { provider, address } = await connectInjected();
  if (
    opts.expectedAddress &&
    address.toLowerCase() !== opts.expectedAddress.toLowerCase()
  ) {
    throw new WalletError(
      "Connected wallet does not match the linked address. Reconnect.",
    );
  }

  await ensureChain(provider, opts.chain);

  const to =
    opts.treasury && /^0x[a-fA-F0-9]{40}$/.test(opts.treasury)
      ? opts.treasury
      : address;
  const value = parseEtherToHex(opts.ethAmount);

  let hash: string;
  try {
    hash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: address,
          to,
          value,
        },
      ],
    })) as string;
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

  return { hash, address, to };
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
