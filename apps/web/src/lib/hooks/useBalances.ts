"use client";

import { useAccount, useBalance } from "wagmi";
import { useUsdcBalance } from "./useUsdc";

/** Wallet balances for the signed-in account. Undefined while loading or signed out. */
export function useBalances() {
  const { address } = useAccount();
  const usdc = useUsdcBalance();
  const mon = useBalance({ address, query: { enabled: Boolean(address), refetchInterval: 4000 } });
  return { address, usdc: usdc.data, mon: mon.data?.value, refetch: () => { usdc.refetch(); mon.refetch(); } };
}
