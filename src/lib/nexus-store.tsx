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
import type {
  ChatMessage,
  CharacterState,
  MemoryEntry,
  NetworkNode,
  SystemStats,
  Thought,
} from "./types";

const STORAGE_KEY = "nexus-claimed-node";
const KEY_ID = "nexus-key";
const ALIAS_KEY = "nexus-alias";
const SIGIL_KEY = "nexus-sigil";
const WALLET_KEY = "nexus-wallet";
const ACTIVATED_KEY = "nexus-activated";
const OPEN = firstFree(NETWORK.nodes);

export interface LotReceipt {
  tag: string;
  price: number;
  region: string;
  at: number;
  tx?: string;
  paid?: boolean;
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
  activated: boolean;
  selectNode: (id: string) => void;
  claimNode: (id: string) => boolean;
  buyLot: (id: string, paid?: boolean) => boolean;
  startClaim: (id: string) => boolean;
  finishClaim: (paid?: boolean) => boolean;
  cancelClaim: () => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
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
  const [activated, setActivated] = useState(false);

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
    const savedNode = window.localStorage.getItem(STORAGE_KEY);
    const key = savedKey || (savedNode ? makeKey() : null);
    if (key) {
      if (!savedKey) window.localStorage.setItem(KEY_ID, key);
      setKeyId(key);
      setEntered(true);
      setAliasState(savedAlias);
      const painted = window.localStorage.getItem(SIGIL_KEY);
      setSigil(
        painted && painted.length === 64
          ? painted.split("").map((c) => (c === "1" ? 1 : 0))
          : bitsFromKey(key),
      );
    }
    if (savedNode) {
      setYoursId(savedNode);
      setSelectedId(savedNode);
      setNodes((prev) =>
        prev.map((node) =>
          node.id === savedNode ? { ...node, status: "yours", kind: "signal" } : node,
        ),
      );
    }
    const savedWallet = window.localStorage.getItem(WALLET_KEY);
    if (savedWallet) setWallet(savedWallet);
    if (window.localStorage.getItem(ACTIVATED_KEY) === "1") setActivated(true);
  }, []);

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
      window.localStorage.setItem(STORAGE_KEY, id);
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
    (id: string, paid = false) => {
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
        tx: paid ? `0x${Date.now().toString(16)}…demo` : undefined,
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
      if (target.status === "yours") return true;
      if (target.status !== "available") return false;
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return buyLot(id);
      }
      setClaimingId(id);
      return true;
    },
    [buyLot, nodes],
  );

  const finishClaim = useCallback(
    (paid = false) => {
      if (!claimingId) return false;
      const id = claimingId;
      setClaimingId(null);
      return buyLot(id, paid);
    },
    [buyLot, claimingId],
  );

  const cancelClaim = useCallback(() => setClaimingId(null), []);

  const connectWallet = useCallback(() => {
    const hex = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const addr = `0x${hex}…${hex.slice(0, 4)}`;
    window.localStorage.setItem(WALLET_KEY, addr);
    setWallet(addr);
  }, []);

  const disconnectWallet = useCallback(() => {
    window.localStorage.removeItem(WALLET_KEY);
    setWallet(null);
  }, []);

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
      activated,
      selectNode,
      claimNode,
      buyLot,
      startClaim,
      finishClaim,
      cancelClaim,
      connectWallet,
      disconnectWallet,
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
