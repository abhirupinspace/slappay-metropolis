"use client";

import type { Activity } from "@/lib/mock";
import { Card, CardTitle, Icon } from "../primitives";

const usd = (n: number) => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ActivityCard({ items, onApprove, onDecline }: { items: Activity[]; onApprove?: (id: string) => void; onDecline?: (id: string) => void }) {
  return (
    <Card>
      <CardTitle icon={<Icon name="list" />} right={<button type="button" className="grid size-8 place-items-center rounded-full border border-line text-dim"><Icon name="dots" /></button>}>Activity</CardTitle>
      <ul className="space-y-1">
        {items.map((a) =>
          a.pending ? (
            <li key={a.id} className="flex items-center justify-between rounded-2xl border border-lime-deep bg-mint/40 p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-forest text-lime"><Icon name={a.icon} /></span>
                <div>
                  <div className="text-sm font-semibold">{a.title} <span className="text-dim">${usd(a.amount)}</span></div>
                  <div className="text-[11px] text-ember">{a.subtitle}</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => onApprove?.(a.id)} className="grid size-7 place-items-center rounded-full bg-lime-deep text-ink"><Icon name="check" className="size-3.5" /></button>
                <button type="button" onClick={() => onDecline?.(a.id)} className="grid size-7 place-items-center rounded-full border border-line text-dim"><Icon name="x" className="size-3.5" /></button>
              </div>
            </li>
          ) : (
            <li key={a.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full border border-line text-ink"><Icon name={a.icon} /></span>
                <div>
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-[11px] text-dim">{a.subtitle}</div>
                </div>
              </div>
              <span className={`text-sm font-bold ${a.amount >= 0 ? "text-forest" : "text-red-600"}`}>{a.amount >= 0 ? "+" : "-"}${usd(a.amount)}</span>
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}
