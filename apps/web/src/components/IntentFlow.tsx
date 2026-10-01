"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { buildSteps, spendTarget } from "@/lib/actions";
import { config } from "@/lib/config";
import { short, ts } from "@/lib/format";
import { useTx } from "@/lib/hooks/useTx";
import { useUsdcAllowance, useUsdcBalance } from "@/lib/hooks/useUsdc";
import type { Intent, ParseResult } from "@/lib/intent/schema";
import { resolveIntent, unresolvedNames, type ResolvedIntent } from "@/lib/intent/validator";
import { Button, Card, Row, TxStatus } from "./ui";

const EXAMPLES = [
  "Pay Alex $5 when he finishes the website",
  "Give my research agent $20 per day, max $2 per transaction",
  "Pay Sarah $20/hour until $100",
  "Pay Bob $10 after 2 days",
  "Send Dana $1 for coffee",
];

export function IntentFlow() {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<(ParseResult & { source?: string }) | null>(null);
  const [resolve, setResolve] = useState<Record<string, string>>({});
  const { address } = useAccount();
  const tx = useTx();

  async function parse(t = text) {
    setParsing(true);
    setResult(null);
    setResolve({});
    tx.reset();
    try {
      const res = await fetch("/api/intent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) });
      setResult(await res.json());
    } catch (e) {
      setResult({ intent: null, note: e instanceof Error ? e.message : "parse failed" });
    } finally {
      setParsing(false);
    }
  }

  const intent = result?.intent ?? null;
  const names = useMemo(() => (intent ? unresolvedNames(intent) : []), [intent]);
  const resolution = useMemo(() => (intent ? resolveIntent(intent, resolve, address) : null), [intent, resolve, address]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) parse(); }}
        className="space-y-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe a payment…"
          rows={2}
          className="w-full rounded-md border border-neutral-300 p-3 text-base focus:border-black focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={parsing || !text.trim()}>{parsing ? "Parsing…" : "Parse"}</Button>
          <span className="text-xs text-neutral-500">Nothing moves until you confirm and sign.</span>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => { setText(ex); parse(ex); }} className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs hover:bg-neutral-100">
            {ex}
          </button>
        ))}
      </div>

      {result && !intent && <Card className="text-sm text-amber-800">{result.note || "Could not parse that."}</Card>}

      {intent && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Preview</h2>
            <span className="text-xs text-neutral-500">parsed by {result?.source ?? "?"}{result?.note ? ` · ${result.note}` : ""}</span>
          </div>
          <IntentSummary intent={intent} />
          {names.length > 0 && (
            <div className="space-y-2 border-t border-neutral-200 pt-3">
              <p className="text-sm text-neutral-600">Who is this? Paste a wallet address for each name.</p>
              {names.map((n) => (
                <label key={n} className="block text-sm">
                  <span className="font-medium">{n}</span>
                  <input
                    value={resolve[n] ?? ""}
                    onChange={(e) => setResolve({ ...resolve, [n]: e.target.value.trim() })}
                    placeholder="0x…"
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 font-mono text-xs"
                  />
                </label>
              ))}
            </div>
          )}
          {resolution && !resolution.ok && (
            <ul className="list-disc pl-5 text-sm text-red-700">{resolution.errors.map((e) => <li key={e}>{e}</li>)}</ul>
          )}
          {resolution?.ok && <Confirm resolved={resolution.intent} tx={tx} />}
        </Card>
      )}
    </div>
  );
}

function IntentSummary({ intent }: { intent: Intent }) {
  switch (intent.type) {
    case "simple_payment":
      return <><Row k="Type" v="Simple payment" /><Row k="To" v={intent.recipient} /><Row k="Amount" v={`${intent.amount} USDC`} /></>;
    case "conditional_payment":
      return (
        <>
          <Row k="Type" v="Conditional payment (escrow)" />
          <Row k="To" v={intent.recipient} />
          <Row k="Amount" v={`${intent.amount} USDC`} />
          <Row k="Condition" v={intent.condition.type === "manual_approval" ? `You approve: "${intent.condition.description}"` : intent.condition.type === "attestation" ? `${intent.condition.verifier} confirms: "${intent.condition.description}"` : `After ${Math.round(intent.condition.releaseAfterSeconds / 3600)}h`} />
          <Row k="Expiry" v={`${intent.expiryDays} days`} />
        </>
      );
    case "agent_policy":
      return (
        <>
          <Row k="Type" v="Agent spending policy" />
          <Row k="Agent" v={intent.agentName} />
          <Row k="Daily limit" v={`${intent.dailyLimit} USDC`} />
          <Row k="Per transaction" v={`${intent.transactionLimit} USDC`} />
          <Row k="Recipients" v={intent.allowAnyRecipient ? "Any" : intent.allowedRecipients.join(", ") || "(none yet)"} />
        </>
      );
    case "payment_stream":
      return (
        <>
          <Row k="Type" v="Payment stream" />
          <Row k="To" v={intent.recipient} />
          <Row k="Rate" v={`${intent.ratePerUnit} USDC / ${intent.unit}`} />
          <Row k="Maximum" v={`${intent.maxAmount} USDC (deposited now)`} />
        </>
      );
  }
}

function Confirm({ resolved, tx }: { resolved: ResolvedIntent; tx: ReturnType<typeof useTx> }) {
  const target = spendTarget(resolved);
  const allowance = useUsdcAllowance(target?.spender);
  const balance = useUsdcBalance();
  const need = target?.amount ?? (resolved.type === "simple_payment" ? resolved.amount : 0n);
  const insufficient = balance.data !== undefined && balance.data < need;
  const steps = buildSteps(resolved, allowance.data ?? 0n);

  return (
    <div className="space-y-2 border-t border-neutral-200 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">You are about to</p>
      <ResolvedSummary r={resolved} />
      {insufficient && <p className="text-sm text-red-700">Insufficient USDC balance. Need {formatUsdc(need)} USDC, have {formatUsdc(balance.data ?? 0n)}.</p>}
      <div className="flex items-center gap-2">
        <Button onClick={() => tx.run(steps, resolved.type)} disabled={tx.busy || insufficient || tx.state.status === "confirmed"}>
          {steps.length > 1 ? "Approve & Confirm" : "Confirm & Sign"}
        </Button>
        {steps.length > 1 && <span className="text-xs text-neutral-500">2 signatures: USDC approval, then create</span>}
      </div>
      <TxStatus state={tx.state} explorer={tx.explorer} />
    </div>
  );
}

function ResolvedSummary({ r }: { r: ResolvedIntent }) {
  switch (r.type) {
    case "simple_payment":
      return <><Row k="Send" v={`${formatUsdc(r.amount)} USDC`} /><Row k="To" v={short(r.recipient)} /></>;
    case "conditional_payment":
      return (
        <>
          <Row k="Lock" v={`${formatUsdc(r.amount)} USDC in PaymentMandate`} />
          <Row k="Recipient" v={short(r.recipient)} />
          <Row k="Releases when" v={r.conditionType === 0 ? "you approve" : r.conditionType === 1 ? `${short(r.verifier)} approves` : ts(r.releaseAfter)} />
          <Row k="Refundable after" v={ts(r.expiry)} />
        </>
      );
    case "agent_policy":
      return (
        <>
          <Row k="Fund" v={`${formatUsdc(r.initialDeposit)} USDC into SpendingPolicy`} />
          <Row k="Agent wallet" v={short(r.agent)} />
          <Row k="Limits" v={`${formatUsdc(r.txLimit)} / tx · ${formatUsdc(r.dailyLimit)} / day`} />
          <Row k="Recipients" v={r.allowAnyRecipient ? "any" : r.recipients.map(short).join(", ")} />
          <Row k="You can" v="pause, resume, revoke, withdraw anytime" />
        </>
      );
    case "payment_stream":
      return (
        <>
          <Row k="Deposit" v={`${formatUsdc(r.maxAmount)} USDC into PaymentStream`} />
          <Row k="Recipient" v={short(r.recipient)} />
          <Row k="Rate" v={`${formatUsdc(r.ratePerSecond * 3600n, 4)} USDC / hour`} />
          <Row k="Runs for" v={`~${(Number(r.maxAmount / r.ratePerSecond) / 3600).toFixed(1)} hours`} />
        </>
      );
  }
  void config;
}
