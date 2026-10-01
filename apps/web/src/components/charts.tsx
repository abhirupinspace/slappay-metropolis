"use client";

import { motion } from "motion/react";
import { ease } from "./motion";

export const usd = (v: number, d = 2) => `$${v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;

/** Multi-segment donut. Segments animate in sequence. */
export function Donut({ segments, size = 168, label, sub }: { segments: { value: number; color: string }[]; size?: number; label: string; sub?: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-line)" strokeWidth="12" />
        {total > 0 && segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = <motion.circle key={i} cx="64" cy="64" r={r} fill="none" stroke={s.color} strokeWidth="12" strokeLinecap="butt" strokeDasharray={`${len} ${c - len}`} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: -offset }} transition={{ duration: 1, ease, delay: 0.1 + i * 0.1 }} />;
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{label}</div>
          {sub && <div className="text-[11px] text-dim">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/** Grouped bars per day: in vs out. */
export function DayBars({ days }: { days: { label: string; in: number; out: number }[] }) {
  const max = Math.max(1, ...days.flatMap((d) => [d.in, d.out]));
  return (
    <div className="flex h-44 items-end gap-3">
      {days.map((d, i) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end justify-center gap-1">
            <motion.div title={`In ${usd(d.in)}`} initial={{ height: 0 }} animate={{ height: `${(d.in / max) * 100}%` }} transition={{ duration: 0.8, ease, delay: i * 0.05 }} className="w-3 rounded-full bg-lime-deep sm:w-4" />
            <motion.div title={`Out ${usd(d.out)}`} initial={{ height: 0 }} animate={{ height: `${(d.out / max) * 100}%` }} transition={{ duration: 0.8, ease, delay: i * 0.05 + 0.05 }} className="w-3 rounded-full bg-forest sm:w-4" />
          </div>
          <div className={`text-[11px] ${i === 0 ? "font-semibold" : "text-dim"}`}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string; value?: string }[] }) {
  return (
    <ul className="space-y-1.5 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-dim"><span className="size-2.5 rounded-full" style={{ background: i.color }} /> {i.label}</span>
          {i.value && <span className="font-semibold">{i.value}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4">
      <div className="text-[11px] text-dim">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-dim">{hint}</div>}
    </div>
  );
}
