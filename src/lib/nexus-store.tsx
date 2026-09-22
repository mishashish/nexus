"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_CHARACTER,
  INITIAL_MEMORIES,
  INITIAL_MESSAGES,
  INITIAL_THOUGHTS,
  memoryTitleFrom,
  mockReply,
  NETWORK,
  SYSTEM_TOTAL,
} from "./data";
import { makeKey, sigilBits as bitsFromKey } from "./chamber";
import { firstFree, lotPrice, lotTag } from "./lots";
import { playBuyChime } from "./linen-sound";
import {
  CHAIN_CONFIG,
  CHAIN_EXPLORER,
  formatSeatPrice,
  priceAmountForIndex,
  treasuryAddress,
} from "./contracts";
import {
  WalletError,
  connectInjected,
  ensureChain,
  explorerTxUrl,
  getInjectedProvider,
  hasInjectedWallet,
  payForLot,
  readAccounts,
  subscribeWallet,
} from "./wallet";
import type {
  ChatMessage,
  CharacterState,
  MemoryEntry,
  NetworkNode,
  SystemStats,
  Thought,
} from "./types";

const KEY_ID = "nexus-key";
const ALIAS_KEY = "nexus-alias";
const SIGIL_KEY = "nexus-sigil";
const WALLET_KEY = "nexus-wallet";
const ACTIVATED_KEY = "nexus-activated";
const OPEN = firstFree(NETWORK.nodes);

type ServerSeat = {
  seatId: string;
  wallet: string;
  txHash: string;
  ethPaid: string;
  claimedAt: number;
  nodeIndex: number;
};

function applySeatsToNodes(
  nodes: NetworkNode[],
  seats: ServerSeat[],
  wallet: string | null,
): { nodes: NetworkNode[]; yoursId: string | null } {
  const byId = new Map(seats.map((s) => [s.seatId, s]));
  const walletLc = wallet?.toLowerCase() ?? null;
  let yoursId: string | null = null;

  const next = nodes.map((node) => {
    const seat = byId.get(node.id);
    if (!seat) {
      if (node.status === "yours" || node.status === "claimed") {
        return { ...node, status: "available" as const, kind: "idle" as const };
      }
      return node;
    }
    const mine = walletLc && seat.wallet === walletLc;
    if (mine) yoursId = node.id;
    return {
      ...node,
      status: mine ? ("yours" as const) : ("claimed" as const),
      kind: mine ? ("signal" as const) : ("memory" as const),
    };
  });

  return { nodes: next, yoursId };
}

export interface LotReceipt {
  tag: string;
  price: number;
  region: string;
  at: number;
  tx?: string;
  explorerUrl?: string;
  paid?: boolean;
  ethPaid?: string;
}

interface NexusStore {
  nodes: NetworkNode[];
  selectedId: string;
  yoursId: string | null;
  memories: MemoryEntry[];
  messages: ChatMessage[];
  thoughts: Thought[];
  character: CharacterState;
  busy: boolean;
  visualTick: number;
  stats: SystemStats;
  selected: NetworkNode | null;
  yours: NetworkNode | null;
  entered: boolean;
  keyId: string | null;
  alias: string;
  receipt: LotReceipt | null;
  claimingId: string | null;
  sigil: number[];
  stirred: number;
  wallet: string | null;
  walletBusy: boolean;
  walletError: string | null;
  activated: boolean;
  hasWalletExt: boolean;
  selectNode: (id: string) => void;
  claimNode: (id: string) => boolean;
  buyLot: (id: string, paid?: boolean, tx?: string, ethPaid?: string) => boolean;
  startClaim: (id: string) => boolean;
  finishClaim: () => Promise<boolean>;
  cancelClaim: () => void;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  clearWalletError: () => void;
  activateCell: () => void;
  enterNode: () => void;
  enterBrowser: () => void;
  leaveBrowser: () => void;
  setAlias: (name: string) => void;
  toggleSigil: (index: number) => void;
  stir: () => void;
  clearReceipt: () => void;
  sendScenario: (text: string) => Promise<boolean>;
}

const NexusContext = createContext<NexusStore | null>(null);

function clock() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NexusProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<NetworkNode[]>(NETWORK.nodes);
  const [selectedId, setSelectedId] = useState(OPEN?.id ?? NETWORK.centralId);
  const [yoursId, setYoursId] = useState<string | null>(null);
  const [memories, setMemories] = useState(INITIAL_MEMORIES);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [thoughts] = useState(INITIAL_THOUGHTS);
  const [character, setCharacter] = useState(INITIAL_CHARACTER);
  const [busy, setBusy] = useState(false);
  const [visualTick, setVisualTick] = useState(0);
  const [entered, setEntered] = useState(false);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [alias, setAliasState] = useState("");
  const [receipt, setReceipt] = useState<LotReceipt | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [sigil, setSigil] = useState<number[]>(() => bitsFromKey("unsigned"));
  const [stirred, setStirred] = useState(0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const [hasWalletExt, setHasWalletExt] = useState(false);

  const selected = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );
  const yours = useMemo(
    () => nodes.find((n) => n.id === yoursId) ?? null,
    [nodes, yoursId],
  );

  useEffect(() => {
    const savedKey = window.localStorage.getItem(KEY_ID);
    const savedAlias = window.localStorage.getItem(ALIAS_KEY) ?? "";
    if (savedKey) {
      setKeyId(savedKey);
      setEntered(true);
      setAliasState(savedAlias);
      const painted = window.localStorage.getItem(SIGIL_KEY);
      setSigil(
        painted && painted.length === 64
          ? painted.split("").map((c) => (c === "1" ? 1 : 0))
          : bitsFromKey(savedKey),
      );
    }
    const savedWallet = window.localStorage.getItem(WALLET_KEY);
    if (savedWallet) setWallet(savedWallet);
    if (window.localStorage.getItem(ACTIVATED_KEY) === "1") setActivated(true);
    setHasWalletExt(hasInjectedWallet());

    const provider = getInjectedProvider();
    if (!provider) return;

    void (async () => {
      const accounts = await readAccounts(provider);
      if (accounts[0]) {
        window.localStorage.setItem(WALLET_KEY, accounts[0]);
        setWallet(accounts[0]);
      }
    })();

    return subscribeWallet(provider, {
      onAccounts: (accounts) => {
        if (!accounts[0]) {
          window.localStorage.removeItem(WALLET_KEY);
          setWallet(null);
          return;
        }
        window.localStorage.setItem(WALLET_KEY, accounts[0]);
        setWallet(accounts[0]);
      },
      onChain: () => {
        /* UI reads chain at pay time */
      },
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncSeats() {
      try {
        const res = await fetch("/api/seats", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { seats?: ServerSeat[] };
        if (cancelled || !Array.isArray(data.seats)) return;
        setNodes((prev) => {
          const applied = applySeatsToNodes(prev, data.seats!, wallet);
          queueMicrotask(() => {
            if (cancelled) return;
            setYoursId(applied.yoursId);
            if (applied.yoursId) {
              setSelectedId(applied.yoursId);
              setEntered(true);
            }
          });
          return applied.nodes;
        });
      } catch {
        /* keep local map until API is up */
      }
    }
    void syncSeats();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const stats = useMemo<SystemStats>(() => {
    const yoursCount = yoursId ? 1 : 0;
    const claimed = nodes.filter((n) => n.status !== "available").length;
    const memory = Math.min(24, memories.length);
    const active = nodes.filter((n) => n.status === "active").length;
    const idle = Math.max(0, SYSTEM_TOTAL - claimed);
    return {
      total: SYSTEM_TOTAL,
      active,
      yours: yoursCount,
      memory,
      idle,
      claimed,
    };
  }, [memories.length, nodes, yoursId]);

  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const claimNode = useCallback(
    (id: string) => {
      const target = nodes.find((n) => n.id === id);
      if (!target) return false;
      if (target.status !== "available" && target.status !== "yours") return false;

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === id) return { ...node, status: "yours", kind: "signal" };
          if (node.status === "yours" && node.id !== id) {
            return { ...node, status: "claimed" };
          }
          return node;
        }),
      );
      setYoursId(id);
      setSelectedId(id);
      return true;
    },
    [nodes],
  );

  const enterBrowser = useCallback(() => {
    const existing = window.localStorage.getItem(KEY_ID);
    const key = existing || makeKey();
    window.localStorage.setItem(KEY_ID, key);
    setKeyId(key);
    setEntered(true);
    const painted = window.localStorage.getItem(SIGIL_KEY);
    setSigil(
      painted && painted.length === 64
        ? painted.split("").map((c) => (c === "1" ? 1 : 0))
        : bitsFromKey(key),
    );
  }, []);

  const buyLot = useCallback(
    (id: string, paid = false, tx?: string, ethPaid?: string) => {
      const ok = claimNode(id);
      if (!ok) return false;
      enterBrowser();
      const node = nodes.find((n) => n.id === id);
      const index = node?.index ?? 0;
      playBuyChime(index);
      setReceipt({
        tag: lotTag(index),
        price: lotPrice(index),
        region: node?.region ?? "cortex",
        at: Date.now(),
        paid,
        tx,
        ethPaid,
        explorerUrl: tx ? explorerTxUrl(CHAIN_EXPLORER, tx) : undefined,
      });
      return true;
    },
    [claimNode, enterBrowser, nodes],
  );

  const startClaim = useCallback(
    (id: string) => {
      const target = nodes.find((n) => n.id === id);
      if (!target) return false;
      setSelectedId(id);
      setWalletError(null);
      if (target.status === "yours") return true;
      if (target.status !== "available") return false;
      setClaimingId(id);
      return true;
    },
    [nodes],
  );

  const finishClaim = useCallback(async () => {
    if (!claimingId) return false;
    const id = claimingId;
    const treasury = treasuryAddress();
    if (!treasury) {
      setWalletError("Set NEXT_PUBLIC_CELLS_TREASURY to enable purchases.");
      return false;
    }

    setWalletBusy(true);
    setWalletError(null);
    try {
      const node = nodes.find((n) => n.id === id);
      const index = node?.index ?? 0;
      const ethAmount = priceAmountForIndex(index);
      const result = await payForLot({
        amount: ethAmount,
        treasury,
        chain: CHAIN_CONFIG,
        expectedAddress: wallet,
      });
      window.localStorage.setItem(WALLET_KEY, result.address);
      setWallet(result.address);

      const claimRes = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatId: id,
          wallet: result.address,
          txHash: result.hash,
          amountPaid: ethAmount,
          nodeIndex: index,
        }),
      });
      const claimData = (await claimRes.json()) as {
        error?: string;
        seat?: ServerSeat;
      };
      if (!claimRes.ok) {
        throw new WalletError(
          claimData.error || `Claim failed (${claimRes.status})`,
        );
      }

      setClaimingId(null);
      return buyLot(id, true, result.hash, formatSeatPrice(index));
    } catch (err) {
      const msg =
        err instanceof WalletError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Payment failed.";
      setWalletError(msg);
      return false;
    } finally {
      setWalletBusy(false);
    }
  }, [buyLot, claimingId, nodes, wallet]);

  const cancelClaim = useCallback(() => {
    setClaimingId(null);
    setWalletError(null);
  }, []);

  const connectWallet = useCallback(async () => {
    setWalletBusy(true);
    setWalletError(null);
    try {
      setHasWalletExt(hasInjectedWallet());
      const { provider, address } = await connectInjected();
      await ensureChain(provider, CHAIN_CONFIG);
      window.localStorage.setItem(WALLET_KEY, address);
      setWallet(address);
      return true;
    } catch (err) {
      const msg =
        err instanceof WalletError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not connect wallet.";
      setWalletError(msg);
      return false;
    } finally {
      setWalletBusy(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    window.localStorage.removeItem(WALLET_KEY);
    setWallet(null);
    setWalletError(null);
  }, []);

  const clearWalletError = useCallback(() => setWalletError(null), []);

  const activateCell = useCallback(() => {
    window.localStorage.setItem(ACTIVATED_KEY, "1");
    setActivated(true);
    setStirred((n) => n + 1);
    setVisualTick((n) => n + 1);
  }, []);

  const toggleSigil = useCallback((index: number) => {
    setSigil((prev) => {
      const next = [...prev];
      next[index] = next[index] ? 0 : 1;
      window.localStorage.setItem(SIGIL_KEY, next.join(""));
      return next;
    });
  }, []);

  const stir = useCallback(() => {
    setStirred((n) => n + 1);
    setVisualTick((n) => n + 1);
  }, []);

  const leaveBrowser = useCallback(() => {
    setEntered(false);
  }, []);

  const setAlias = useCallback((name: string) => {
    const next = name.trim().slice(0, 24);
    setAliasState(next);
    window.localStorage.setItem(ALIAS_KEY, next);
  }, []);

  const clearReceipt = useCallback(() => setReceipt(null), []);

  const enterNode = useCallback(() => {
    if (yoursId) {
      setSelectedId(yoursId);
      document.getElementById("active-node")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    const open = firstFree(nodes);
    if (open) startClaim(open.id);
  }, [nodes, startClaim, yoursId]);

  const sendScenario = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return false;
      if (!yoursId) return false;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: content,
        time: clock(),
      };
      const prior = messages.slice(-8);
      setMessages((prev) => [...prev, userMsg]);
      setBusy(true);

      let reply = mockReply(content);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            region: yours?.region ?? selected?.region,
            nodeLabel: yours?.label ?? selected?.label,
            mood: character.mood,
            wallet: wallet ?? undefined,
            history: prior.map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { reply?: string };
          if (data.reply?.trim()) reply = data.reply.trim();
        }
      } catch {
        /* keep mock fallback */
      }

      const replyMsg: ChatMessage = {
        id: `n-${Date.now()}`,
        role: "nexus",
        text: reply,
        time: clock(),
      };
      setMessages((prev) => [...prev, replyMsg]);
      setMemories((prev) => {
        const next: MemoryEntry = {
          id: `mem-${Date.now()}`,
          title: memoryTitleFrom(content),
          scenario: content,
          reply,
          nodeLabel: yours?.label ?? selected?.label ?? "00",
          nodeId: yoursId,
          timeAgo: "just now",
          createdAt: Date.now(),
          weight: 10 + (content.length % 9),
          thumb: "trace",
          mine: true,
        };
        return [next, ...prev].slice(0, 24);
      });
      setCharacter((prev) => ({
        ...prev,
        mood: content.length > 80 ? "restless" : "curious",
      }));
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === yoursId) {
            return {
              ...node,
              observation: reply,
              pulse: true,
              tint: Math.min(1, node.tint + 0.08),
            };
          }
          if (node.status === "active" || node.kind === "memory") {
            return { ...node, tint: Math.min(1, node.tint + 0.03) };
          }
          return node;
        }),
      );
      setVisualTick((n) => n + 1);
      setBusy(false);
      return true;
    },
    [
      busy,
      character.mood,
      messages,
      selected?.label,
      selected?.region,
      wallet,
      yours?.label,
      yours?.region,
      yoursId,
    ],
  );

  const value = useMemo<NexusStore>(
    () => ({
      nodes,
      selectedId,
      yoursId,
      memories,
      messages,
      thoughts,
      character,
      busy,
      visualTick,
      stats,
      selected,
      yours,
      entered,
      keyId,
      alias,
      receipt,
      claimingId,
      sigil,
      stirred,
      wallet,
      walletBusy,
      walletError,
      activated,
      hasWalletExt,
      selectNode,
      claimNode,
      buyLot,
      startClaim,
      finishClaim,
      cancelClaim,
      connectWallet,
      disconnectWallet,
      clearWalletError,
      activateCell,
      enterNode,
      enterBrowser,
      leaveBrowser,
      setAlias,
      toggleSigil,
      stir,
      clearReceipt,
      sendScenario,
    }),
    [
      busy,
      character,
      claimNode,
      buyLot,
      startClaim,
      finishClaim,
      cancelClaim,
      connectWallet,
      disconnectWallet,
      clearWalletError,
      activateCell,
      clearReceipt,
      enterBrowser,
      leaveBrowser,
      setAlias,
      toggleSigil,
      stir,
      entered,
      keyId,
      alias,
      receipt,
      claimingId,
      sigil,
      stirred,
      wallet,
      walletBusy,
      walletError,
      hasWalletExt,
      activated,
      enterNode,
      memories,
      messages,
      nodes,
      selectNode,
      selected,
      selectedId,
      sendScenario,
      stats,
      thoughts,
      visualTick,
      yours,
      yoursId,
    ],
  );

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

export function useNexus() {
  const ctx = useContext(NexusContext);
  if (!ctx) throw new Error("useNexus must be used within NexusProvider");
  return ctx;
}
