"use client";

import { motion } from "motion/react";
import { Icon } from "../primitives";
import { MotionCard, ease } from "../motion";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Reference: Spending. Agent spend today vs combined daily limits. */
export function SpendingCard({ spent, limit, byAgent }: { spent: number; limit: number; byAgent: { name: string; amount: number }[] }) {
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <MotionCard className="flex h-full flex-col bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full border border-line"><Icon name="bag" /></span>
          <span className="font-semibold">Agent spending</span>
        </div>
        <span className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold">Today</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <div className="relative size-44">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-line)" strokeWidth="12" />
            <motion.circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-lime-deep)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.2, ease, delay: 0.3 }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-3xl font-semibold tracking-tight">${usd(spent)}</div>
              <div className="text-xs font-semibold text-grass">of ${usd(limit)}</div>
            </div>
          </div>
        </div>
        <span className="mt-3 rounded-full border border-line px-3.5 py-1.5 text-xs font-medium">
          <Icon name="spark" className="mr-1 inline size-3" /> {Math.round(pct * 100)}% of daily limits used
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
        {byAgent.map((a) => (
          <div key={a.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-dim"><Icon name="bot" className="size-3.5" /> {a.name}</span>
            <span className="font-semibold">${usd(a.amount)}</span>
          </div>
        ))}
      </div>
    </MotionCard>
  );
}
