"use client";

import { Icon } from "../primitives";
import { Bar, FadeNumber, MotionCard } from "../motion";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Reference: Earning. Streams flowing to you. */
export function EarningCard({ total, deltaPct, streams }: { total: number; deltaPct: number; streams: { name: string; accrued: number; max: number }[] }) {
  return (
    <MotionCard className="flex h-full flex-col bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full border border-line"><Icon name="coin" /></span>
          <span className="font-semibold">Earning</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold"><Icon name="stream" className="mr-1 inline size-3.5" />${usd(streams.reduce((a, s) => a + s.max, 0))}</div>
          <div className="ml-auto mt-1 h-1 w-12 rounded-full bg-ember" />
        </div>
      </div>

      <div className="mt-6 text-5xl font-semibold tracking-[-0.03em]"><FadeNumber value={total} prefix="$" /></div>
      <div className="mt-1 text-xs text-dim"><span className="font-semibold text-grass">+{deltaPct}%</span> vs last week</div>

      <div className="mt-auto space-y-4 pt-6">
        {streams.map((s) => {
          const pct = s.max > 0 ? Math.min(s.accrued / s.max, 1) : 0;
          return (
            <div key={s.name}>
              <div className="flex justify-between text-xs">
                <span className={pct >= 1 ? "text-dim" : "font-semibold"}>{s.name}</span>
                <span className="text-dim">${usd(s.accrued)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Bar pct={pct} className={pct >= 1 ? "bg-lime-deep" : "bg-forest"} />
                {pct < 1 && <span className="rounded-full bg-forest px-1.5 py-0.5 text-[10px] font-bold text-white">{Math.round(pct * 100)}%</span>}
              </div>
            </div>
          );
        })}
      </div>
    </MotionCard>
  );
}
