"use client";

import { Card, CardTitle, Icon } from "../primitives";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Streams flowing to you: accrued so far, bar per stream. */
export function EarningCard({ total, deltaPct, streams }: { total: number; deltaPct: number; streams: { name: string; accrued: number; max: number }[] }) {
  return (
    <Card>
      <CardTitle icon={<Icon name="coin" />} right={<span className="text-xs font-semibold"><Icon name="stream" className="mr-1 inline size-3.5" />${usd(streams.reduce((a, s) => a + s.max, 0))}</span>}>Earning</CardTitle>
      <div className="h-1 w-12 rounded-full bg-ember" />
      <div className="mt-5 text-4xl font-bold tracking-tight">${usd(total)}</div>
      <div className="mt-1 text-[11px] text-dim"><span className="font-semibold text-forest">+{deltaPct}%</span> vs last week</div>
      <div className="mt-5 space-y-3">
        {streams.map((s) => {
          const pct = s.max > 0 ? Math.min(s.accrued / s.max, 1) : 0;
          const done = pct >= 1;
          return (
            <div key={s.name}>
              <div className="flex justify-between text-xs">
                <span className={done ? "text-dim" : "font-semibold"}>{s.name}</span>
                <span className="text-dim">${usd(s.accrued)}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-lime-deep" style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
