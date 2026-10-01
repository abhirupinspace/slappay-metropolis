"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { Gate } from "@/components/Gate";
import { Card, Row } from "@/components/ui";
import { useMandates, usePolicies, useStreams } from "@/lib/hooks/useContracts";
import { useUsdcBalance } from "@/lib/hooks/useUsdc";

export default function Dashboard() {
  return (
    <Gate>
      <Inner />
    </Gate>
  );
}

function Inner() {
  const { address } = useAccount();
  const bal = useUsdcBalance();
  const m = useMandates();
  const p = usePolicies();
  const s = useStreams();
  const activeM = m.mine.filter((r) => r.data.status === 0);
  const activeP = p.mine.filter((r) => r.data.active && !r.data.revoked);
  const activeS = s.mine.filter((r) => !r.data.cancelled && r.data.withdrawn < r.data.maxAmount);
  const locked = activeM.reduce((a, r) => a + r.data.amount, 0n) + activeP.filter((r) => r.data.owner === address).reduce((a, r) => a + r.data.balance, 0n) + activeS.filter((r) => r.data.sender === address).reduce((a, r) => a + r.data.maxAmount - r.data.withdrawn, 0n);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><Row k="Wallet USDC" v={bal.data !== undefined ? `${formatUsdc(bal.data)} USDC` : "…"} /><Row k="Committed in Slappay" v={`${formatUsdc(locked)} USDC`} /></Card>
        <Card>
          <Row k="Active mandates" v={<Link className="underline" href="/mandates">{activeM.length}</Link>} />
          <Row k="Active agents" v={<Link className="underline" href="/agents">{activeP.length}</Link>} />
          <Row k="Active streams" v={<Link className="underline" href="/streams">{activeS.length}</Link>} />
        </Card>
      </div>
      <p className="text-xs text-neutral-500">Reads directly from Monad every few seconds. Chain state is the source of truth.</p>
    </div>
  );
}
