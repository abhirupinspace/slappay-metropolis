"use client";

import { motion } from "motion/react";
import { Bot, Lock, Waves } from "lucide-react";
import { Gate } from "@/components/Gate";
import { Bar, MotionCard, stagger } from "@/components/motion";
import { DayBars, Donut, Legend, Stat, usd } from "@/components/charts";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export default function AnalyticsPage() {
  return (
    <Gate>
      <Analytics />
    </Gate>
  );
}

function Analytics() {
  const a = useAnalytics();
  const totalCommitted = a.committed.mandates + a.committed.policies + a.committed.streams;
  const weekOut = a.days.reduce((s, d) => s + d.out, 0);
  const weekIn = a.days.reduce((s, d) => s + d.in, 0);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-12">
      {/* Committed breakdown */}
      <MotionCard className="bg-card p-6 lg:col-span-4">
        <div className="font-semibold">Where your money is</div>
        <div className="mt-5 flex items-center gap-6">
          <Donut label={usd(totalCommitted, 0)} sub="committed" segments={[{ value: a.committed.mandates, color: "#1b4d2c" }, { value: a.committed.policies, color: "#a9e04e" }, { value: a.committed.streams, color: "#ff6a1f" }]} />
          <Legend items={[{ color: "#1b4d2c", label: "Escrowed in rules", value: usd(a.committed.mandates) }, { color: "#a9e04e", label: "Agent budgets", value: usd(a.committed.policies) }, { color: "#ff6a1f", label: "Streaming out", value: usd(a.committed.streams) }]} />
        </div>
      </MotionCard>

      {/* 7-day projection */}
      <MotionCard className="bg-card p-6 lg:col-span-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold">Next 7 days</div>
            <div className="text-[11px] text-dim">Scheduled by your streams and time-locked rules</div>
          </div>
          <Legend items={[{ color: "#a9e04e", label: "In", value: usd(weekIn) }, { color: "#1b4d2c", label: "Out", value: usd(weekOut) }]} />
        </div>
        <div className="mt-5"><DayBars days={a.days} /></div>
      </MotionCard>

      {/* Agent budgets */}
      <MotionCard className="bg-card p-6 lg:col-span-7">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Agent budgets today</div>
          <span className="text-xs text-dim">{a.agents.length} {a.agents.length === 1 ? "policy" : "policies"}</span>
        </div>
        {a.agents.length === 0 && <p className="mt-4 text-sm text-dim">No agent policies yet.</p>}
        <ul className="mt-4 space-y-4">
          {a.agents.map((p) => (
            <li key={String(p.id)}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold"><Bot className="size-4" /> {p.name}{!p.active && <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] text-dim">paused</span>}</span>
                <span className="text-dim">{usd(p.spent)} / {usd(p.limit)}</span>
              </div>
              <div className="mt-2"><Bar pct={p.limit > 0 ? p.spent / p.limit : 0} className={p.spent / Math.max(p.limit, 1) > 0.8 ? "bg-ember" : "bg-lime-deep"} /></div>
              <div className="mt-1 flex justify-between text-[11px] text-dim"><span>{usd(p.perTx)} per call</span><span>{usd(p.balance)} escrowed · ~{p.runway} days of runway</span></div>
            </li>
          ))}
        </ul>
      </MotionCard>

      {/* Rates + status */}
      <div className="grid gap-4 lg:col-span-5">
        <MotionCard className="bg-lime p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-forest">Live rates</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><div className="text-[11px] text-ink/60">Earning</div><div className="text-2xl font-semibold tracking-tight">{usd(a.rates.inPerHour)}<span className="text-sm text-ink/60">/h</span></div></div>
            <div><div className="text-[11px] text-ink/60">Paying</div><div className="text-2xl font-semibold tracking-tight">{usd(a.rates.outPerHour)}<span className="text-sm text-ink/60">/h</span></div></div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-forest/80"><Waves className="size-3.5" /> From streams accruing right now</div>
        </MotionCard>
        <MotionCard className="bg-card p-6">
          <div className="flex items-center gap-2 font-semibold"><Lock className="size-4" /> Rules by status</div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Active" value={String(a.mandateStatus.active)} />
            <Stat label="Released" value={String(a.mandateStatus.released)} />
            <Stat label="Cancelled" value={String(a.mandateStatus.cancelled)} />
          </div>
        </MotionCard>
      </div>

      {/* Lifetime */}
      <MotionCard className="bg-card p-6 lg:col-span-12">
        <div className="font-semibold">Lifetime</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Rules created" value={String(a.lifetime.rulesCreated)} />
          <Stat label="Received via streams" value={usd(a.lifetime.receivedStreams)} hint="withdrawn to your wallet" />
          <Stat label="Paid via streams" value={usd(a.lifetime.paidStreams)} hint="accrued to recipients" />
          <Stat label="Received via rules" value={usd(a.lifetime.receivedMandates)} />
          <Stat label="Released via rules" value={usd(a.lifetime.releasedMandates)} />
          <Stat label="Agents spent today" value={usd(a.lifetime.agentSpentToday)} />
        </div>
        <p className="mt-3 text-[11px] text-dim">Derived from current contract state. Per-transaction history arrives with the Envio indexer.</p>
      </MotionCard>
    </motion.div>
  );
}
