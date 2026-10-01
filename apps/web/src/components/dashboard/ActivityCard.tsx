"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Activity } from "@/lib/mock";
import { Icon } from "../primitives";
import { MotionCard, ease } from "../motion";

const usd = (n: number) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Reference: Transactions. Pending approval row on top, then history. */
export function ActivityCard({ items, onApprove, onDecline }: { items: Activity[]; onApprove?: (id: string) => void; onDecline?: (id: string) => void }) {
  return (
    <MotionCard className="flex h-full flex-col bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full border border-line"><Icon name="list" /></span>
          <span className="font-semibold">Transactions</span>
        </div>
        <button type="button" className="grid size-9 place-items-center rounded-full border border-line text-dim transition hover:text-ink"><Icon name="dots" /></button>
      </div>

      <ul className="mt-4 flex-1 space-y-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {items.map((a, i) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.06, duration: 0.4, ease } }}
              exit={{ opacity: 0, height: 0 }}
              className={a.pending ? "flex items-center justify-between rounded-2xl border border-lime-deep bg-mint/40 p-3" : "flex items-center justify-between rounded-2xl p-3 transition hover:bg-canvas"}
            >
              <div className="flex items-center gap-3">
                <span className={`grid size-10 place-items-center rounded-full ${a.pending ? "bg-forest text-lime" : "border border-line text-ink"}`}><Icon name={a.icon} /></span>
                <div>
                  <div className="text-sm font-semibold">{a.title}{a.pending && <span className="ml-1 text-dim">${usd(a.amount)}</span>}</div>
                  <div className={`text-[11px] ${a.pending ? "text-ember" : "text-dim"}`}>{a.subtitle}</div>
                </div>
              </div>
              {a.pending ? (
                <div className="flex gap-1.5">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => onApprove?.(a.id)} className="grid size-8 place-items-center rounded-full bg-lime-deep text-ink"><Icon name="check" className="size-4" /></motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDecline?.(a.id)} className="grid size-8 place-items-center rounded-full border border-line text-dim"><Icon name="x" className="size-4" /></motion.button>
                </div>
              ) : (
                <span className={`text-sm font-bold ${a.amount >= 0 ? "text-grass" : "text-ember"}`}>{a.amount >= 0 ? "+" : "-"}${usd(a.amount)}</span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </MotionCard>
  );
}
