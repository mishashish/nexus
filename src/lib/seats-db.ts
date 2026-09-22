import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type SeatRecord = {
  seatId: string;
  nodeIndex: number;
  wallet: string;
  txHash: string;
  ethPaid: string;
  claimedAt: number;
};

type StoreShape = {
  seats: Record<string, SeatRecord>;
  txs: Record<string, string>;
};

const SEAT_PREFIX = "cells:seat:";
const TX_PREFIX = "cells:tx:";
const INDEX_KEY = "cells:seats:index";

function normalizeWallet(wallet: string) {
  return wallet.trim().toLowerCase();
}

function normalizeTx(txHash: string) {
  return txHash.trim().toLowerCase();
}

function hasKv() {
  return Boolean(
    process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim(),
  );
}

function filePath() {
  return join(process.cwd(), ".data", "seats.json");
}

function readFileStore(): StoreShape {
  const path = filePath();
  try {
    if (!existsSync(path)) return { seats: {}, txs: {} };
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      seats: parsed.seats ?? {},
      txs: parsed.txs ?? {},
    };
  } catch {
    return { seats: {}, txs: {} };
  }
}

function writeFileStore(store: StoreShape) {
  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath(), JSON.stringify(store, null, 2), "utf8");
}

async function kvClient() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

export async function listSeats(): Promise<SeatRecord[]> {
  if (hasKv()) {
    const kv = await kvClient();
    const ids = (await kv.smembers(INDEX_KEY)) as string[];
    if (!ids.length) return [];
    const records = await Promise.all(
      ids.map(async (id) => (await kv.get<SeatRecord>(`${SEAT_PREFIX}${id}`)) ?? null),
    );
    return records.filter((r): r is SeatRecord => Boolean(r));
  }

  return Object.values(readFileStore().seats);
}

export async function getSeat(seatId: string): Promise<SeatRecord | null> {
  if (hasKv()) {
    const kv = await kvClient();
    return (await kv.get<SeatRecord>(`${SEAT_PREFIX}${seatId}`)) ?? null;
  }
  return readFileStore().seats[seatId] ?? null;
}

export async function getSeatByTx(txHash: string): Promise<SeatRecord | null> {
  const key = normalizeTx(txHash);
  if (hasKv()) {
    const kv = await kvClient();
    const seatId = await kv.get<string>(`${TX_PREFIX}${key}`);
    if (!seatId) return null;
    return getSeat(seatId);
  }
  const store = readFileStore();
  const seatId = store.txs[key];
  if (!seatId) return null;
  return store.seats[seatId] ?? null;
}

/**
 * Atomically claim a seat. Returns existing record if already owned by same wallet+tx,
 * otherwise throws with code CONFLICT / TX_USED.
 */
export async function claimSeat(record: SeatRecord): Promise<SeatRecord> {
  const wallet = normalizeWallet(record.wallet);
  const txHash = normalizeTx(record.txHash);
  const next: SeatRecord = {
    ...record,
    wallet,
    txHash,
    claimedAt: record.claimedAt || Date.now(),
  };

  if (hasKv()) {
    const kv = await kvClient();
    const seatKey = `${SEAT_PREFIX}${next.seatId}`;
    const txKey = `${TX_PREFIX}${txHash}`;

    const existingTx = await kv.get<string>(txKey);
    if (existingTx && existingTx !== next.seatId) {
      throw Object.assign(new Error("Transaction already used for another seat"), {
        code: "TX_USED",
      });
    }

    const existing = await kv.get<SeatRecord>(seatKey);
    if (existing) {
      if (
        existing.wallet === wallet &&
        (existing.txHash === txHash || existingTx === next.seatId)
      ) {
        return existing;
      }
      throw Object.assign(new Error("Seat already claimed"), { code: "CONFLICT" });
    }

    const wrote = await kv.set(seatKey, next, { nx: true });
    if (wrote === null) {
      const again = await kv.get<SeatRecord>(seatKey);
      if (again?.wallet === wallet) return again;
      throw Object.assign(new Error("Seat already claimed"), { code: "CONFLICT" });
    }

    const txWrote = await kv.set(txKey, next.seatId, { nx: true });
    if (txWrote === null) {
      const owner = await kv.get<string>(txKey);
      if (owner !== next.seatId) {
        await kv.del(seatKey);
        throw Object.assign(new Error("Transaction already used for another seat"), {
          code: "TX_USED",
        });
      }
    }

    await kv.sadd(INDEX_KEY, next.seatId);
    return next;
  }

  const store = readFileStore();
  const existingTx = store.txs[txHash];
  if (existingTx && existingTx !== next.seatId) {
    throw Object.assign(new Error("Transaction already used for another seat"), {
      code: "TX_USED",
    });
  }
  const existing = store.seats[next.seatId];
  if (existing) {
    if (existing.wallet === wallet && existing.txHash === txHash) return existing;
    throw Object.assign(new Error("Seat already claimed"), { code: "CONFLICT" });
  }

  store.seats[next.seatId] = next;
  store.txs[txHash] = next.seatId;
  writeFileStore(store);
  return next;
}

export function seatsStorageMode(): "kv" | "file" {
  return hasKv() ? "kv" : "file";
}
