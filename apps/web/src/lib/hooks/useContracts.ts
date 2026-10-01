"use client";

import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { PaymentMandateAbi, PaymentStreamAbi, SpendingPolicyAbi } from "@slappay/core";
import { config } from "../config";

const MAX_SCAN = 200n;

function idRange(nextId?: bigint): bigint[] {
  if (!nextId || nextId <= 1n) return [];
  const start = nextId - 1n > MAX_SCAN ? nextId - MAX_SCAN : 1n;
  const ids: bigint[] = [];
  for (let i = nextId - 1n; i >= start; i--) ids.push(i);
  return ids;
}

/** Generic "scan all ids and fetch each" reader. Fine for demo scale; Envio replaces this later. */
function useScan<TAbi extends readonly unknown[]>(address: `0x${string}`, abi: TAbi, getter: string) {
  const next = useReadContract({ address, abi, functionName: "nextId", query: { refetchInterval: 4000 } } as never);
  const ids = useMemo(() => idRange(next.data as bigint | undefined), [next.data]);
  const items = useReadContracts({
    contracts: ids.map((id) => ({ address, abi, functionName: getter, args: [id] })) as never,
    query: { enabled: ids.length > 0, refetchInterval: 4000 },
  });
  const results = items.data as { result?: unknown }[] | undefined;
  const rows = useMemo(
    () => ids.map((id, i) => ({ id, data: results?.[i]?.result })).filter((r) => r.data !== undefined),
    [ids, results],
  );
  return { rows, isLoading: next.isLoading || items.isLoading, refetch: items.refetch };
}

export type Mandate = {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  conditionType: number;
  verifier: `0x${string}`;
  releaseAfter: bigint;
  expiry: bigint;
  approved: boolean;
  status: number;
  memo: string;
};

export type Policy = {
  owner: `0x${string}`;
  agent: `0x${string}`;
  token: `0x${string}`;
  txLimit: bigint;
  dailyLimit: bigint;
  balance: bigint;
  spentToday: bigint;
  dayIndex: bigint;
  active: boolean;
  revoked: boolean;
  allowAnyRecipient: boolean;
  name: string;
};

export type Stream = {
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  ratePerSecond: bigint;
  startTime: bigint;
  endTime: bigint;
  maxAmount: bigint;
  withdrawn: bigint;
  cancelled: boolean;
  memo: string;
};

export function useMandates() {
  const { address } = useAccount();
  const d = config.deployment;
  const scan = useScan(d.paymentMandate, PaymentMandateAbi, "getMandate");
  const rows = scan.rows as { id: bigint; data: Mandate }[];
  const mine = rows.filter((r) => r.data.sender === address || r.data.recipient === address);
  return { ...scan, all: rows, mine };
}

export function usePolicies() {
  const { address } = useAccount();
  const d = config.deployment;
  const scan = useScan(d.spendingPolicy, SpendingPolicyAbi, "getPolicy");
  const rows = scan.rows as { id: bigint; data: Policy }[];
  const mine = rows.filter((r) => r.data.owner === address || r.data.agent === address);
  return { ...scan, all: rows, mine };
}

export function useStreams() {
  const { address } = useAccount();
  const d = config.deployment;
  const scan = useScan(d.paymentStream, PaymentStreamAbi, "getStream");
  const rows = scan.rows as { id: bigint; data: Stream }[];
  const mine = rows.filter((r) => r.data.sender === address || r.data.recipient === address);
  return { ...scan, all: rows, mine };
}

export function useStreamAccrued(id: bigint) {
  return useReadContract({
    address: config.deployment.paymentStream,
    abi: PaymentStreamAbi,
    functionName: "accrued",
    args: [id],
    query: { refetchInterval: 1000 },
  });
}
