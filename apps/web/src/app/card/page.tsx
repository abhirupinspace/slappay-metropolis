"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Bot, Copy, Check, Pause, Play, ShieldCheck, Snowflake } from "lucide-react";
import { formatUsdc } from "@slappay/core";
import { Gate } from "@/components/Gate";
import { VirtualCard, cardDetails } from "@/components/card/VirtualCard";
import { Bar, MotionCard, stagger } from "@/components/motion";
import { TxStatus } from "@/components/primitives";
import { policyCall } from "@/lib/actions";
import { useBalances } from "@/lib/hooks/useBalances";
import { usePolicies } from "@/lib/hooks/useContracts";
import { useTx } from "@/lib/hooks/useTx";

export default function CardPage() {
  return (
    <Gate>
      <CardView />
    </Gate>
  );
}

const usd = (n: bigint) => `$${formatUsdc(n)}`;

function CardView() {
  const { user } = usePrivy();
  const { address } = useAccount();
  const { usdc } = useBalances();
  const { mine } = usePolicies();
  const tx = useTx();
  const [copied, setCopied] = useState(false);

  const my = useMemo(() => mine.filter((p) => p.data.owner.toLowerCase() === address?.toLowerCase() && !p.data.revoked), [mine, address]);
  const active = my.filter((p) => p.data.active);
  const frozen = my.length > 0 && active.length === 0;
  const dailyLimit = my.reduce((a, p) => a + p.data.dailyLimit, 0n);
  const spentToday = my.reduce((a, p) => a + p.data.spentToday, 0n);
  const name = user?.google?.name ?? user?.email?.address?.split("@")[0] ?? "Slappay member";
  if (!address) return null;
  const d = cardDetails(address);

  const toggleFreeze = () => {
    const targets = frozen ? my : active;
    if (targets.length === 0) return;
    tx.run(targets.map((p) => policyCall(frozen ? "resume" : "pause", p.id)), frozen ? "card_unfreeze" : "card_freeze");
  };
  const copy = async () => { await navigator.clipboard?.writeText(d.number.replace(/\s/g, "")); setCopied(true); setTimeout(() => setCopied(false), 1200); };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <MotionCard lift={false} className="flex h-full flex-col items-center justify-center bg-card p-8">
          <VirtualCard address={address} name={name} balance={usdc === undefined ? "…" : usd(usdc)} frozen={frozen} />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={toggleFreeze} disabled={tx.busy || my.length === 0} className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${frozen ? "bg-lime text-ink hover:bg-lime-deep" : "bg-forest text-white hover:bg-forest-deep"}`}>
              {frozen ? <Play className="size-4" /> : <Snowflake className="size-4" />} {frozen ? "Unfreeze card" : "Freeze card"}
            </motion.button>
            <button type="button" onClick={copy} className="flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-canvas">
              {copied ? <Check className="size-4 text-grass" /> : <Copy className="size-4" />} Copy number
            </button>
          </div>
          <p className="mt-4 max-w-sm text-center text-[11px] text-dim">
            Freezing pauses every spending policy you own, onchain. Card details are a preview; network card issuing is not live yet.
          </p>
          <TxStatus state={tx.state} explorer={tx.explorer} />
        </MotionCard>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-5">
        <MotionCard className="bg-lime p-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-forest px-3 py-1.5 text-[11px] font-bold tracking-wide text-white"><ShieldCheck className="size-3.5 text-lime" /> SPENDING CONTROLS</span>
            <span className="text-xs font-semibold text-ink/60">{my.length} {my.length === 1 ? "policy" : "policies"}</span>
          </div>
          <div className="mt-5 text-xs text-ink/70">Spent today</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-[-0.03em]">{usd(spentToday)}</span>
            <span className="text-sm text-ink/60">of {usd(dailyLimit)} daily</span>
          </div>
          <div className="mt-4"><Bar pct={dailyLimit > 0n ? Number(spentToday) / Number(dailyLimit) : 0} className="bg-forest" track="bg-white/50" /></div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white/55 p-3"><div className="text-[11px] text-ink/60">Active</div><div className="mt-1 text-xl font-semibold">{active.length}</div></div>
            <div className="rounded-2xl bg-white/55 p-3"><div className="text-[11px] text-ink/60">Escrowed</div><div className="mt-1 text-xl font-semibold">{usd(my.reduce((a, p) => a + p.data.balance, 0n))}</div></div>
          </div>
        </MotionCard>

        <MotionCard className="flex-1 bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Who can spend</span>
            <Link href="/" className="text-xs font-semibold text-forest">+ New policy</Link>
          </div>
          {my.length === 0 && <p className="mt-4 text-sm text-dim">No spending policies yet. Say &ldquo;Give my research agent $20 per day, max $2 per transaction&rdquo; on the New rule page.</p>}
          <ul className="mt-3 divide-y divide-line">
            {my.map((p) => (
              <li key={String(p.id)} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-canvas"><Bot className="size-4" /></span>
                  <div>
                    <div className="text-sm font-semibold">{p.data.name || `Policy #${p.id}`}</div>
                    <div className="text-[11px] text-dim">{usd(p.data.txLimit)}/tx · {usd(p.data.dailyLimit)}/day · {usd(p.data.spentToday)} today</div>
                  </div>
                </div>
                <button type="button" onClick={() => tx.run([policyCall(p.data.active ? "pause" : "resume", p.id)], "policy_toggle")} disabled={tx.busy} className={`grid size-8 place-items-center rounded-full transition ${p.data.active ? "bg-mint text-forest hover:bg-lime" : "bg-canvas text-dim hover:bg-line"}`} title={p.data.active ? "Pause" : "Resume"}>
                  {p.data.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </MotionCard>
      </div>
    </motion.div>
  );
}
