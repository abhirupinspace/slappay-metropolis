"use client";

import Link from "next/link";
import type { SmartAccount } from "@/lib/mock";
import { Card, Icon } from "../primitives";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The lime card: money that is working under rules right now. */
export function RulesCard({ accounts, committed }: { accounts: SmartAccount[]; committed: number }) {
  const agents = accounts.filter((a) => a.kind === "agent" && a.status === "active").length;
  const streams = accounts.filter((a) => a.kind === "stream" && a.status === "streaming").length;
  const mandates = accounts.filter((a) => a.kind === "mandate" && a.status === "active").length;
  return (
    <Card tone="lime" className="relative flex min-h-[260px] flex-col justify-between overflow-hidden">
      <Icon name="spark" className="absolute -right-6 -top-6 size-44 text-lime-deep/70" />
      <div className="relative flex items-start justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-xs font-bold text-lime">
          YOUR RULES <Icon name="spark" className="size-3" />
        </span>
        <Link href="/" className="grid size-8 place-items-center rounded-full bg-card/70 text-ink hover:bg-card"><Icon name="plus" /></Link>
      </div>
      <div className="relative">
        <div className="text-xs text-ink/70">Money working for you</div>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-4xl font-bold tracking-tight text-ink">${usd(committed)}</span>
          <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] font-semibold text-lime">{agents + streams + mandates} active</span>
        </div>
      </div>
      <div className="relative grid grid-cols-3 gap-2">
        {[
          { label: "Agents", n: agents, icon: "bot" as const, href: "/agents" },
          { label: "Streams", n: streams, icon: "stream" as const, href: "/streams" },
          { label: "Mandates", n: mandates, icon: "lock" as const, href: "/mandates" },
        ].map((t) => (
          <Link key={t.label} href={t.href} className="rounded-2xl bg-card/70 p-3 hover:bg-card">
            <div className="text-[11px] text-ink/70">{t.label}</div>
            <div className="mt-1 flex items-center gap-1.5 text-lg font-bold"><Icon name={t.icon} className="size-4" /> {t.n}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
