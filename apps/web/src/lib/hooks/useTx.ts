"use client";

import { useCallback, useState } from "react";
import { BaseError, ContractFunctionRevertedError, type Hash } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";
import { explorerTxUrl } from "@slappay/core";
import { config } from "../config";
import { log } from "../log";

export type TxState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "signing" }
  | { status: "submitting" }
  | { status: "confirming"; hash: Hash }
  | { status: "confirmed"; hash: Hash }
  | { status: "error"; message: string; hash?: Hash };

export type TxRequest = {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args: readonly unknown[];
};

/** Map raw viem errors to short, user-facing reasons. */
export function describeTxError(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((err) => err instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? revert.reason ?? "reverted";
      const args = revert.data?.args?.map(String).join(", ");
      return args ? `${name}(${args})` : name;
    }
    const msg = e.shortMessage || e.message;
    if (/user rejected|denied/i.test(msg)) return "Signature rejected.";
    if (/insufficient funds/i.test(msg)) return "Insufficient MON for gas.";
    if (/chain/i.test(msg) && /mismatch|switch/i.test(msg)) return "Wrong network. Switch to Monad.";
    return msg;
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * Runs one or more contract writes sequentially with explicit UI states.
 * Each step is simulated first so reverts surface before the wallet prompt.
 */
export function useTx() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [state, setState] = useState<TxState>({ status: "idle" });

  const run = useCallback(
    async (steps: TxRequest[], label = "tx"): Promise<Hash | undefined> => {
      if (!publicClient || !walletClient) {
        setState({ status: "error", message: "Wallet not ready." });
        return;
      }
      let last: Hash | undefined;
      try {
        for (const step of steps) {
          setState({ status: "preparing" });
          log("transaction_started", { label, fn: step.functionName });
          const { request } = await publicClient.simulateContract({
            ...step,
            account: walletClient.account,
            chain: config.chain,
          } as Parameters<typeof publicClient.simulateContract>[0]);
          setState({ status: "signing" });
          const hash = await walletClient.writeContract(request);
          setState({ status: "confirming", hash });
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status !== "success") throw new Error("Transaction reverted onchain.");
          log("transaction_confirmed", { label, fn: step.functionName, hash });
          last = hash;
        }
        setState({ status: "confirmed", hash: last! });
        return last;
      } catch (e) {
        const message = describeTxError(e);
        log("transaction_failed", { label, message });
        setState({ status: "error", message });
        return;
      }
    },
    [publicClient, walletClient],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);
  const explorer = "hash" in state && state.hash ? explorerTxUrl(config.chainId, state.hash) : undefined;
  return { state, run, reset, explorer, busy: !["idle", "confirmed", "error"].includes(state.status) };
}
