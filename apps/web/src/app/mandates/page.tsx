"use client";

import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { Gate } from "@/components/Gate";
import Link from "next/link";
import { Addr, Badge, Button, Card, Icon, Row, TxStatus } from "@/components/ui";
import { mandateCall } from "@/lib/actions";
import { conditionLabel, mandateStatus, ts } from "@/lib/format";
import { useMandates, type Mandate } from "@/lib/hooks/useContracts";
import { useNow } from "@/lib/hooks/useNow";
import { useTx } from "@/lib/hooks/useTx";

export default function MandatesPage() {
  return (
    <Gate>
      <List />
    </Gate>
  );
}

function List() {
  const { mine, isLoading } = useMandates();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="flex items-center gap-2 text-lg font-bold"><span className="grid size-8 place-items-center rounded-full bg-card"><Icon name="lock" /></span> Rules</h1>
        <Link href="/" className="flex items-center gap-1 text-xs font-semibold text-forest"><Icon name="plus" className="size-3.5" /> New rule</Link>
      </div>
      {isLoading && <p className="px-1 text-sm text-muted">Loading…</p>}
      {!isLoading && mine.length === 0 && <p className="px-1 text-sm text-muted">No mandates yet. Create one from the home page.</p>}
      <div className="grid gap-3 md:grid-cols-2">{mine.map((r) => <MandateCard key={String(r.id)} id={r.id} m={r.data} />)}</div>
    </div>
  );
}

function MandateCard({ id, m }: { id: bigint; m: Mandate }) {
  const { address } = useAccount();
  const tx = useTx();
  const isSender = address === m.sender;
  const isRecipient = address === m.recipient;
  const isVerifier = address === m.verifier;
  const now = useNow(5000);
  const active = m.status === 0;
  const canApprove = active && ((m.conditionType === 0 && isSender) || (m.conditionType === 1 && isVerifier));
  const canRelease = active && m.conditionType === 2 && now >= m.releaseAfter;
  const canCancel = active && (isRecipient || (isSender && now >= m.expiry));
  const tone = m.status === 1 ? "green" : m.status === 2 ? "red" : "amber";
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">#{String(id)} · {formatUsdc(m.amount)} USDC</span>
        <Badge tone={tone}>{mandateStatus(m.status)}</Badge>
      </div>
      <Row k="From" v={<Addr a={m.sender} />} />
      <Row k="To" v={<Addr a={m.recipient} />} />
      <Row k="Condition" v={m.conditionType === 1 ? <>Attestation by <Addr a={m.verifier} /></> : m.conditionType === 2 ? `After ${ts(m.releaseAfter)}` : conditionLabel(m.conditionType)} />
      {m.memo && <Row k="Memo" v={m.memo} />}
      <Row k="Expiry" v={ts(m.expiry)} />
      <div className="mt-2 flex gap-2">
        {canApprove && <Button onClick={() => tx.run([mandateCall("approve", id)], "mandate_approve")} disabled={tx.busy}>Approve & release</Button>}
        {canRelease && <Button onClick={() => tx.run([mandateCall("release", id)], "mandate_release")} disabled={tx.busy}>Release</Button>}
        {canCancel && <Button variant="danger" onClick={() => tx.run([mandateCall("cancel", id)], "mandate_cancel")} disabled={tx.busy}>{isRecipient ? "Decline" : "Cancel & refund"}</Button>}
        {active && isSender && m.conditionType !== 0 && !canCancel && <span className="text-xs text-neutral-500">Waiting on condition. Refundable after expiry.</span>}
      </div>
      <TxStatus state={tx.state} explorer={tx.explorer} />
    </Card>
  );
}
