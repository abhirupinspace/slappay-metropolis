"use client";

import { Card, CardTitle, Icon } from "../primitives";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Agent spend today vs. combined daily limits. Donut is pure SVG. */
export function SpendingCard({ spent, limit, byAgent }: { spent: number; limit: number; byAgent: { name: string; amount: number }[] }) {
  const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <Card>
      <CardTitle icon={<Icon name="bag" />} right={<span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">Today</span>}>Agent spending</CardTitle>
      <div className="flex flex-col items-center">
        <div className="relative size-40">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-line)" strokeWidth="11" />
            <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-lime-deep)" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-bold">${usd(spent)}</div>
              <div className="text-[11px] text-dim">of ${usd(limit)} / day</div>
            </div>
          </div>
        </div>
        <span className="mt-2 rounded-full border border-line px-3 py-1 text-[11px] font-medium">
          <Icon name="spark" className="mr-1 inline size-3" /> {Math.round(pct * 100)}% of daily limits used
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {byAgent.map((a) => (
          <div key={a.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-dim"><Icon name="bot" className="size-3" /> {a.name}</span>
            <span className="font-semibold">${usd(a.amount)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
