"use client";

import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { Gate } from "@/components/Gate";
import { Addr, Badge, Button, Card, Row, TxStatus } from "@/components/ui";
import { streamCall } from "@/lib/actions";
import { ts } from "@/lib/format";
import { useStreamAccrued, useStreams, type Stream } from "@/lib/hooks/useContracts";
import { useTx } from "@/lib/hooks/useTx";

export default function StreamsPage() {
  return (
    <Gate>
      <List />
    </Gate>
  );
}

function List() {
  const { mine, isLoading } = useStreams();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Streams</h1>
      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && mine.length === 0 && <p className="text-sm text-neutral-500">No streams yet. Try “Pay Sarah $20/hour until $100”.</p>}
      {mine.map((r) => <StreamCard key={String(r.id)} id={r.id} s={r.data} />)}
    </div>
  );
}

function StreamCard({ id, s }: { id: bigint; s: Stream }) {
  const { address } = useAccount();
  const tx = useTx();
  const accrued = useStreamAccrued(id);
  const acc = accrued.data ?? s.withdrawn;
  const withdrawable = acc - s.withdrawn;
  const done = s.cancelled || s.withdrawn >= s.maxAmount;
  const isSender = address === s.sender;
  const isRecipient = address === s.recipient;
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">#{String(id)} · {formatUsdc(s.ratePerSecond * 3600n, 4)} USDC/hour</span>
        <Badge tone={s.cancelled ? "red" : done ? "neutral" : "green"}>{s.cancelled ? "Cancelled" : done ? "Complete" : "Streaming"}</Badge>
      </div>
      <Row k="From" v={<Addr a={s.sender} />} />
      <Row k="To" v={<Addr a={s.recipient} />} />
      <Row k="Accrued" v={`${formatUsdc(acc, 6)} USDC`} />
      <Row k="Withdrawn" v={`${formatUsdc(s.withdrawn, 6)} USDC`} />
      <Row k="Remaining" v={`${formatUsdc(s.maxAmount - acc, 6)} USDC`} />
      <Row k="Started" v={ts(s.startTime)} />
      <Row k="Ends" v={ts(s.endTime)} />
      {s.memo && <Row k="Memo" v={s.memo} />}
      <div className="mt-2 flex gap-2">
        {isRecipient && withdrawable > 0n && <Button onClick={() => tx.run([streamCall("withdraw", id)], "stream_withdraw")} disabled={tx.busy}>Withdraw {formatUsdc(withdrawable, 4)} USDC</Button>}
        {isSender && !s.cancelled && !done && <Button variant="danger" onClick={() => tx.run([streamCall("cancel", id)], "stream_cancel")} disabled={tx.busy}>Cancel stream</Button>}
      </div>
      <TxStatus state={tx.state} explorer={tx.explorer} />
    </Card>
  );
}
