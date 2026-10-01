"use client";

import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { config } from "../config";
import type { TxRequest } from "./useTx";

export function useUsdcBalance(address?: `0x${string}`) {
  const { address: me } = useAccount();
  const who = address ?? me;
  return useReadContract({
    address: config.usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: who ? [who] : undefined,
    query: { enabled: Boolean(who), refetchInterval: 4000 },
  });
}

export function useUsdcAllowance(spender?: `0x${string}`) {
  const { address: me } = useAccount();
  return useReadContract({
    address: config.usdc,
    abi: erc20Abi,
    functionName: "allowance",
    args: me && spender ? [me, spender] : undefined,
    query: { enabled: Boolean(me && spender) },
  });
}

/** Approve step to prepend when allowance < amount. */
export function approveStep(spender: `0x${string}`, amount: bigint): TxRequest {
  return { address: config.usdc, abi: erc20Abi, functionName: "approve", args: [spender, amount] };
}
