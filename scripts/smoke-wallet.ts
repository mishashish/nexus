/**
 * Smoke-test MetaMask purchase path with a mock EIP-1193 provider.
 * Run: npx tsx scripts/smoke-wallet.ts
 */
import assert from "node:assert/strict";

async function main() {
  const ADDR = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";
  const TX =
    "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
  const TREASURY = "0x1111111111111111111111111111111111111111";

  const calls: string[] = [];
  let chainId = "0x1";

  const mock = {
    isMetaMask: true,
    async request({
      method,
      params,
    }: {
      method: string;
      params?: unknown;
    }) {
      calls.push(method);
      if (method === "eth_requestAccounts" || method === "eth_accounts") {
        return [ADDR];
      }
      if (method === "eth_chainId") return chainId;
      if (method === "wallet_switchEthereumChain") {
        const p = params as [{ chainId: string }];
        chainId = String(p[0].chainId).toLowerCase();
        return null;
      }
      if (method === "wallet_addEthereumChain") {
        const p = params as [{ chainId: string }];
        chainId = String(p[0].chainId).toLowerCase();
        return null;
      }
      if (method === "eth_sendTransaction") {
        const p = params as [{ from: string; to: string; value: string }];
        assert.equal(p[0].from.toLowerCase(), ADDR.toLowerCase());
        assert.equal(p[0].to.toLowerCase(), TREASURY.toLowerCase());
        assert.match(p[0].value, /^0x[0-9a-f]+$/i);
        assert.ok(BigInt(p[0].value) > BigInt(0));
        return TX;
      }
      if (method === "eth_getTransactionReceipt") {
        return { status: "0x1", blockNumber: "0x10", transactionHash: TX };
      }
      return null;
    },
    on() {},
    removeListener() {},
  };

  (globalThis as unknown as { window: unknown }).window = globalThis;
  (globalThis as unknown as { ethereum: unknown }).ethereum = mock;

  const {
    connectInjected,
    ensureChain,
    payForLot,
    shortAddress,
    explorerTxUrl,
    WalletError,
  } = await import("../src/lib/wallet");

  console.log("1) connectInjected");
  const { address } = await connectInjected();
  assert.equal(address, ADDR);
  assert.ok(calls.includes("eth_requestAccounts"));

  console.log("2) ensureChain switches to Base Sepolia");
  await ensureChain(mock as never, {
    chainId: 84532,
    chainName: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
  });
  assert.equal(chainId, "0x14a34");
  assert.ok(calls.includes("wallet_switchEthereumChain"));

  console.log("3) payForLot sends ETH + waits receipt");
  calls.length = 0;
  const paid = await payForLot({
    ethAmount: "0.012",
    treasury: TREASURY,
    chain: {
      chainId: 84532,
      chainName: "Base Sepolia",
      rpcUrl: "https://sepolia.base.org",
      explorerUrl: "https://sepolia.basescan.org",
    },
  });
  assert.equal(paid.hash, TX);
  assert.equal(paid.address, ADDR);
  assert.equal(paid.to.toLowerCase(), TREASURY.toLowerCase());
  assert.ok(calls.includes("eth_sendTransaction"));
  assert.ok(calls.includes("eth_getTransactionReceipt"));

  console.log("4) helpers");
  assert.equal(shortAddress(ADDR), "0xAbCd…Ef01");
  assert.equal(
    explorerTxUrl("https://sepolia.basescan.org", TX),
    `https://sepolia.basescan.org/tx/${TX}`,
  );

  console.log("5) reject path");
  const rejectMock = {
    ...mock,
    async request({ method }: { method: string }) {
      if (method === "eth_requestAccounts") {
        const err = new Error("User rejected") as Error & { code: number };
        err.code = 4001;
        throw err;
      }
      return mock.request({ method });
    },
  };
  (globalThis as unknown as { ethereum: unknown }).ethereum = rejectMock;
  try {
    await connectInjected();
    assert.fail("should throw");
  } catch (e) {
    assert.ok(e instanceof WalletError);
    assert.match((e as Error).message, /rejected/i);
  }

  console.log("\nALL WALLET SMOKE TESTS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
