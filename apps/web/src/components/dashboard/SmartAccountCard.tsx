"use client";

import Link from "next/link";
import type { SmartAccount } from "@/lib/mock";
import { Badge, Icon } from "../ui";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const tone = (s: string) => (["active", "streaming"].includes(s) ? "green" : ["paused"].includes(s) ? "amber" : ["complete", "released"].includes(s) ? "neutral" : "red");

/** One compact tile per rule, used in the Smart Accounts strip and on feature pages. */
export function SmartAccountCard({ a }: { a: SmartAccount }) {
  const href = a.kind === "agent" ? "/agents" : a.kind === "stream" ? "/streams" : "/mandates";
  const icon = a.kind === "agent" ? "bot" : a.kind === "stream" ? "stream" : "lock";
  const line1 = a.kind === "agent" ? `$${usd(a.perDay)}/day · $${usd(a.perTx)}/tx` : a.kind === "stream" ? `$${usd(a.perHour)}/hour` : `$${usd(a.amount)} · ${a.condition}`;
  const line2 = a.kind === "agent" ? `$${usd(a.spentToday)} spent today` : a.kind === "stream" ? `$${usd(a.accrued)} of $${usd(a.max)} ${a.role === "sender" ? "paid" : "earned"}` : a.role === "sender" ? "You locked this" : "Locked for you";
  const pct = a.kind === "agent" ? a.spentToday / a.perDay : a.kind === "stream" ? a.accrued / a.max : 0;
  return (
    <Link href={href} className="block rounded-card border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-full bg-canvas text-ink"><Icon name={icon} /></span>
        <Badge tone={tone(a.status)}>{a.status}</Badge>
      </div>
      <div className="mt-3 text-sm font-bold">{a.name}</div>
      <div className="text-xs text-muted">{line1}</div>
      <div className="mt-3 text-xs font-medium">{line2}</div>
      {a.kind !== "mandate" && (
        <div className="mt-2 h-1.5 rounded-full bg-line">
          <div className="h-1.5 rounded-full bg-lime-deep" style={{ width: `${Math.min(pct, 1) * 100}%` }} />
        </div>
      )}
    </Link>
  );
}
