"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { ArrowUp, Bot, Clock, ExternalLink, Lock, Send, Sparkles, Waves } from "lucide-react";
import { buildSteps, spendTarget } from "@/lib/actions";
import { short, ts } from "@/lib/format";
import { useTx } from "@/lib/hooks/useTx";
import { useUsdcAllowance, useUsdcBalance } from "@/lib/hooks/useUsdc";
import type { Intent, ParseResult } from "@/lib/intent/schema";
import { resolveIntent, unresolvedNames, type ResolvedIntent } from "@/lib/intent/validator";
import { ease } from "./motion";
import { PrimaryButton, SuccessMark, TxProgress, inputCls } from "./modals/parts";

const EXAMPLES = [
  { icon: Lock, label: "Escrow until approved", text: "Pay Alex $5 when he finishes the website" },
  { icon: Bot, label: "Budget for an agent", text: "Give my research agent $20 per day, max $2 per transaction" },
  { icon: Waves, label: "Stream by the hour", text: "Pay Sarah $20/hour until $100" },
  { icon: Clock, label: "Release on a date", text: "Pay Bob $10 after 2 days" },
];

const TYPE_META: Record<Intent["type"], { label: string; icon: typeof Lock }> = {
  simple_payment: { label: "Instant payment", icon: Send },
  conditional_payment: { label: "Conditional payment", icon: Lock },
  agent_policy: { label: "Agent spending policy", icon: Bot },
  payment_stream: { label: "Payment stream", icon: Waves },
};

export function IntentFlow() {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<(ParseResult & { source?: string }) | null>(null);
  const [resolve, setResolve] = useState<Record<string, string>>({});
  const { address } = useAccount();
  const tx = useTx();
  const resultRef = useRef<HTMLDivElement>(null);

  async function parse(t = text) {
    if (!t.trim()) return;
    setParsing(true);
    setResult(null);
    setResolve({});
    tx.reset();
    try {
      const res = await fetch("/api/intent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t }) });
      setResult(await res.json());
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setResult({ intent: null, note: e instanceof Error ? e.message : "parse failed" });
    } finally {
      setParsing(false);
    }
  }

  const intent = result?.intent ?? null;
  const names = useMemo(() => (intent ? unresolvedNames(intent) : []), [intent]);
  const resolution = useMemo(() => (intent ? resolveIntent(intent, resolve, address) : null), [intent, resolve, address]);
  const done = tx.state.status === "confirmed";

  const hasResult = Boolean(result);

  return (
    <div className={`mx-auto ${hasResult ? "max-w-5xl" : "max-w-2xl"}`}>
      {/* Hero: full when idle, collapsed once there is a result */}
      <AnimatePresence initial={false}>
        {!hasResult && (
          <motion.div key="hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden pt-10 text-center sm:pt-16">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-forest"><Sparkles className="size-3" /> New rule</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">What should your money do?</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-dim">Describe it in plain English. Review exactly what will happen. Sign once. Monad enforces it.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer: tall when idle, one compact line once parsed */}
      <motion.form
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        onSubmit={(e) => { e.preventDefault(); parse(); }}
        className={`rounded-[28px] bg-card shadow-[0_20px_60px_-30px_rgba(18,20,18,0.25)] transition focus-within:shadow-[0_24px_70px_-30px_rgba(18,20,18,0.35)] ${hasResult ? "mt-4 flex items-center gap-2 p-2 pl-5" : "mt-8 p-3"}`}
      >
        {hasResult ? (
          <>
            <Sparkles className="size-4 shrink-0 text-forest" />
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") parse(); }} className="w-full bg-transparent py-2 text-sm font-medium outline-none" />
            <button type="submit" disabled={parsing || !text.trim()} className="shrink-0 rounded-full bg-canvas px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-line disabled:opacity-40">{parsing ? "Parsing…" : "Re-parse"}</button>
            <button type="button" onClick={() => { setResult(null); tx.reset(); }} className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-dim transition hover:text-ink">Clear</button>
          </>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") parse(); }}
              placeholder="Pay Alex $500 when the website is approved…"
              rows={3}
              className="w-full resize-none bg-transparent px-3 py-2 text-lg leading-relaxed outline-none placeholder:text-dim/60"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] text-dim">Nothing moves until you confirm and sign · ⌘↵</span>
              <motion.button whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.04 }} type="submit" disabled={parsing || !text.trim()} className="grid size-11 place-items-center rounded-full bg-forest text-white transition disabled:opacity-30" aria-label="Parse">
                {parsing ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} className="size-4 rounded-full border-2 border-white/30 border-t-white" /> : <ArrowUp className="size-5" />}
              </motion.button>
            </div>
          </>
        )}
      </motion.form>

      {/* Examples */}
      {!hasResult && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }} className="mt-5 grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <motion.button
              key={ex.text}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2 }}
              type="button"
              onClick={() => { setText(ex.text); parse(ex.text); }}
              className="flex items-start gap-3 rounded-2xl bg-card p-4 text-left transition hover:shadow-[0_12px_30px_-18px_rgba(18,20,18,0.3)]"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas text-ink"><ex.icon className="size-4" /></span>
              <span>
                <span className="block text-xs font-semibold text-dim">{ex.label}</span>
                <span className="mt-0.5 block text-sm font-medium">{ex.text}</span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Result */}
      <div ref={resultRef} className="scroll-mt-6">
        <AnimatePresence mode="wait">
          {result && !intent && (
            <motion.div key="no" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-2xl bg-ember/10 p-4 text-sm">
              <span className="font-semibold text-ember">Couldn&apos;t turn that into a rule.</span> <span className="text-ink">{result.note}</span>
            </motion.div>
          )}

          {intent && done && (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} className="mt-4 rounded-[28px] bg-card">
              <Done intent={resolution?.ok ? resolution.intent : null} explorer={tx.explorer} onNew={() => { setResult(null); setText(""); tx.reset(); }} />
            </motion.div>
          )}

          {intent && !done && (
            <motion.div key="yes" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease }} className="mt-4 grid gap-4 lg:grid-cols-2">
              {/* Left: what we understood */}
              <div className="rounded-[28px] bg-card">
                <div className="flex items-center gap-2.5 border-b border-line px-6 py-4">
                  {(() => { const I = TYPE_META[intent.type].icon; return <span className="grid size-9 place-items-center rounded-full bg-lime text-forest"><I className="size-4" /></span>; })()}
                  <div>
                    <div className="text-sm font-semibold">{TYPE_META[intent.type].label}</div>
                    <div className="text-[11px] text-dim">parsed by {result?.source === "llm" ? "Claude" : "offline parser"}</div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <IntentSummary intent={intent} />
                  {names.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-canvas p-4">
                      <div className="text-xs font-semibold">Who is this?</div>
                      <div className="mt-0.5 text-[11px] text-dim">Paste a wallet address for each name.</div>
                      <div className="mt-3 space-y-3">
                        {names.map((n) => (
                          <label key={n} className="block">
                            <span className="text-xs font-semibold text-dim">{n}</span>
                            <input value={resolve[n] ?? ""} onChange={(e) => setResolve({ ...resolve, [n]: e.target.value.trim() })} placeholder="0x…" spellCheck={false} className={`${inputCls} bg-card font-mono text-xs`} />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {resolution && !resolution.ok && names.every((n) => resolve[n]) && (
                    <ul className="mt-4 list-disc pl-5 text-xs text-ember">{resolution.errors.map((e) => <li key={e}>{e}</li>)}</ul>
                  )}
                </div>
              </div>

              {/* Right: what will happen + sign */}
              <div className="rounded-[28px] bg-card px-6 py-5">
                {resolution?.ok ? (
                  <Confirm resolved={resolution.intent} tx={tx} />
                ) : (
                  <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                    <span className="grid size-10 place-items-center rounded-full bg-canvas text-dim"><Lock className="size-4" /></span>
                    <div className="mt-3 text-sm font-semibold">Review appears here</div>
                    <div className="mt-1 text-xs text-dim">{names.length > 0 ? "Fill in the addresses on the left." : "Fix the issues on the left."}</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2 text-sm">
      <span className="text-dim">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

function IntentSummary({ intent }: { intent: Intent }) {
  switch (intent.type) {
    case "simple_payment":
      return <div className="divide-y divide-line"><Line k="To" v={intent.recipient} /><Line k="Amount" v={`${intent.amount} USDC`} /></div>;
    case "conditional_payment":
      return (
        <div className="divide-y divide-line">
          <Line k="To" v={intent.recipient} />
          <Line k="Amount" v={`${intent.amount} USDC`} />
          <Line k="Releases when" v={intent.condition.type === "manual_approval" ? `You approve: "${intent.condition.description}"` : intent.condition.type === "attestation" ? `${intent.condition.verifier} confirms: "${intent.condition.description}"` : `After ${Math.round(intent.condition.releaseAfterSeconds / 3600)} hours`} />
          <Line k="Expires" v={`${intent.expiryDays} days`} />
        </div>
      );
    case "agent_policy":
      return (
        <div className="divide-y divide-line">
          <Line k="Agent" v={intent.agentName} />
          <Line k="Daily limit" v={`${intent.dailyLimit} USDC`} />
          <Line k="Per transaction" v={`${intent.transactionLimit} USDC`} />
          <Line k="Recipients" v={intent.allowAnyRecipient ? "Any address" : intent.allowedRecipients.join(", ") || "(none yet)"} />
        </div>
      );
    case "payment_stream":
      return (
        <div className="divide-y divide-line">
          <Line k="To" v={intent.recipient} />
          <Line k="Rate" v={`${intent.ratePerUnit} USDC / ${intent.unit}`} />
          <Line k="Maximum" v={`${intent.maxAmount} USDC, deposited now`} />
        </div>
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
  const s = tx.state.status;
  const inFlight = s !== "idle" && s !== "error";

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {inFlight ? (
          <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl bg-canvas p-5">
            <div className="mb-4 text-xs font-bold uppercase tracking-wide text-forest">{steps.length > 1 ? "Two signatures: approve USDC, then create" : "One signature"}</div>
            <TxProgress status={s as "preparing" | "signing" | "submitting" | "confirming"} />
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-2xl bg-mint/60 p-5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-forest">You are about to</div>
              <div className="mt-2 divide-y divide-forest/10"><ResolvedSummary r={resolved} /></div>
            </div>
            {insufficient && <p className="mt-3 text-xs text-ember">Insufficient USDC. Need {formatUsdc(need)}, have {formatUsdc(balance.data ?? 0n)}.</p>}
            {s === "error" && <p className="mt-3 text-xs text-ember">{tx.state.status === "error" ? tx.state.message : ""}</p>}
            <div className="mt-4">
              <PrimaryButton onClick={() => tx.run(steps, resolved.type)} disabled={insufficient}>
                <Send className="size-4" /> {steps.length > 1 ? "Approve & confirm" : "Confirm & sign"}
              </PrimaryButton>
              {steps.length > 1 && <p className="mt-2 text-center text-[11px] text-dim">Two signatures: USDC approval, then the rule.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResolvedSummary({ r }: { r: ResolvedIntent }) {
  switch (r.type) {
    case "simple_payment":
      return <><Line k="Send" v={`${formatUsdc(r.amount)} USDC`} /><Line k="To" v={short(r.recipient)} /></>;
    case "conditional_payment":
      return (
        <>
          <Line k="Lock" v={`${formatUsdc(r.amount)} USDC in escrow`} />
          <Line k="Recipient" v={short(r.recipient)} />
          <Line k="Releases when" v={r.conditionType === 0 ? "you approve" : r.conditionType === 1 ? `${short(r.verifier)} approves` : ts(r.releaseAfter)} />
          <Line k="Refundable after" v={ts(r.expiry)} />
        </>
      );
    case "agent_policy":
      return (
        <>
          <Line k="Fund" v={`${formatUsdc(r.initialDeposit)} USDC into the policy`} />
          <Line k="Agent wallet" v={short(r.agent)} />
          <Line k="Limits" v={`${formatUsdc(r.txLimit)} / tx · ${formatUsdc(r.dailyLimit)} / day`} />
          <Line k="Recipients" v={r.allowAnyRecipient ? "any" : r.recipients.map(short).join(", ")} />
          <Line k="You keep" v="pause, resume, revoke, withdraw" />
        </>
      );
    case "payment_stream":
      return (
        <>
          <Line k="Deposit" v={`${formatUsdc(r.maxAmount)} USDC`} />
          <Line k="Recipient" v={short(r.recipient)} />
          <Line k="Rate" v={`${formatUsdc(r.ratePerSecond * 3600n, 4)} USDC / hour`} />
          <Line k="Runs for" v={`~${(Number(r.maxAmount / r.ratePerSecond) / 3600).toFixed(1)} hours`} />
        </>
      );
  }
}

function Done({ intent, explorer, onNew }: { intent: ResolvedIntent | null; explorer?: string; onNew: () => void }) {
  const href = intent?.type === "agent_policy" ? "/agents" : intent?.type === "payment_stream" ? "/streams" : intent?.type === "conditional_payment" ? "/mandates" : "/dashboard";
  return (
    <div className="px-6 py-10 text-center">
      <SuccessMark />
      <div className="mt-4 text-2xl font-semibold tracking-tight">Rule is live on Monad</div>
      <div className="mt-1 text-sm text-dim">The contract enforces it from here.</div>
      {explorer && <a href={explorer} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest underline underline-offset-2">View on MonadVision <ExternalLink className="size-3" /></a>}
      <div className="mx-auto mt-6 flex max-w-xs gap-2">
        <a href={href} className="flex flex-1 items-center justify-center rounded-full bg-lime py-3 text-sm font-semibold text-ink hover:bg-lime-deep">See it</a>
        <button type="button" onClick={onNew} className="flex flex-1 items-center justify-center rounded-full border border-line py-3 text-sm font-semibold hover:bg-canvas">New rule</button>
      </div>
    </div>
  );
}
