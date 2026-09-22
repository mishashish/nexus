# CELLS (NEXUS)

**One mind. 128 cells.** A shared digital character. Honeycomb cortex. Public memory.

Live stack: MetaMask purchase (Base Sepolia or Base mainnet via env), server-verified seat ownership, Gemini lore chat.

## Run locally

```bash
npm install
cp .env.example .env.local
# set GEMINI_API_KEY and NEXT_PUBLIC_CELLS_TREASURY
npm run dev
```

Open http://localhost:3000

- `/` — mind, nodes, archive
- `/memory` — public traces
- `/docs` — what it is, glossary, how to try it, FAQ
- `/about` — short constitution
- `/me` — cabinet for your wallet-owned seat

## Product loop

1. **Watch** — drag the honeycomb. No account needed.
2. **Buy** — MetaMask pays ETH to treasury; server verifies tx and records the seat.
3. **Send** — a short public scenario. Gemini replies when `GEMINI_API_KEY` is set.

## Env

See `.env.example` for Sepolia staging vs Base mainnet presets, treasury, Gemini, and Vercel KV (`KV_REST_API_*`). Without KV, local/dev uses `.data/seats.json`.

## Lore

`CONSTITUTION.md` is the character. `LORE.md` is the short public version. `DISCLAIMER.md` is the honesty text.

CELLS is collaborative fiction. It does not think, feel, or contain real neurons. Seats are not investments.
