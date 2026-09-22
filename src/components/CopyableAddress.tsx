"use client";

import { useCallback, useState } from "react";
import { shortAddress } from "@/lib/wallet";

type Props = {
  address: string;
  className?: string;
};

export function CopyableAddress({ address, className = "wallet-addr" }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore clipboard failures */
    }
  }, [address]);

  return (
    <button
      type="button"
      className={`${className} wallet-addr-btn`}
      title={copied ? "Copied!" : `Copy ${address}`}
      aria-label={copied ? "Address copied" : "Copy wallet address"}
      onClick={() => void onCopy()}
    >
      {copied ? "copied" : shortAddress(address)}
    </button>
  );
}
