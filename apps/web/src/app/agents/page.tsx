"use client";

import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { Gate } from "@/components/Gate";
import { Addr, Badge, Button, Card, Row, TxStatus } from "@/components/ui";
import { policyCall } from "@/lib/actions";
import { usePolicies, type Policy } from "@/lib/hooks/useContracts";
import { useTx } from "@/lib/hooks/useTx";

export default function AgentsPage() {
  return (
    <Gate>
      <List />
    </Gate>
  );
}

function List() {
  const { mine, isLoading } = usePolicies();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Agents</h1>
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && mine.length === 0 && <p className="text-sm text-neutral-500">No agent policies yet. Try “Give my research agent $20 per day, max $2 per transaction”.</p>}
      {mine.map((r) => <PolicyCard key={String(r.id)} id={r.id} p={r.data} />)}
    </div>
  );
}

function PolicyCard({ id, p }: { id: bigint; p: Policy }) {
  const { address } = useAccount();
  const tx = useTx();
  const isOwner = address === p.owner;
  const status = p.revoked ? "Revoked" : p.active ? "Active" : "Paused";
  const tone = p.revoked ? "red" : p.active ? "green" : "amber";
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">#{String(id)} · {p.name || "Agent"}</span>
        <Badge tone={tone}>{status}</Badge>
      </div>
      <Row k="Agent wallet" v={<Addr a={p.agent} />} />
      <Row k="Owner" v={<Addr a={p.owner} />} />
      <Row k="Per transaction" v={`${formatUsdc(p.txLimit)} USDC`} />
      <Row k="Daily limit" v={`${formatUsdc(p.dailyLimit)} USDC`} />
      <Row k="Spent today" v={`${formatUsdc(p.spentToday)} USDC`} />
      <Row k="Escrowed balance" v={`${formatUsdc(p.balance)} USDC`} />
      <Row k="Recipients" v={p.allowAnyRecipient ? "Any address" : "Allowlist only"} />
      {isOwner && !p.revoked && (
        <div className="mt-2 flex gap-2">
          {p.active ? (
            <Button variant="secondary" onClick={() => tx.run([policyCall("pause", id)], "policy_pause")} disabled={tx.busy}>Pause</Button>
          ) : (
            <Button variant="secondary" onClick={() => tx.run([policyCall("resume", id)], "policy_resume")} disabled={tx.busy}>Resume</Button>
          )}
          <Button variant="danger" onClick={() => tx.run([policyCall("revoke", id)], "policy_revoke")} disabled={tx.busy}>Revoke & refund</Button>
        </div>
      )}
      <TxStatus state={tx.state} explorer={tx.explorer} />
    </Card>
  );
}
