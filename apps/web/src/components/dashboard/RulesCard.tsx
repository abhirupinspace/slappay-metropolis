"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { SmartAccount } from "@/lib/types";
import { Icon } from "../primitives";
import { FadeNumber, MotionCard } from "../motion";

/** The lime card (reference: Rewards). Money currently working under rules. */
export function RulesCard({ accounts, committed }: { accounts: SmartAccount[]; committed: number }) {
  const agents = accounts.filter((a) => a.kind === "agent" && a.status === "active").length;
  const streams = accounts.filter((a) => a.kind === "stream" && a.status === "streaming").length;
  const mandates = accounts.filter((a) => a.kind === "mandate" && a.status === "active").length;
  return (
    <MotionCard lift={false} className="relative flex h-full flex-col justify-between overflow-hidden bg-lime p-6">
      <motion.div animate={{ rotate: [0, 6, 0], scale: [1, 1.04, 1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -right-10 -top-12 text-lime-deep">
        <Icon name="spark" className="size-72" />
      </motion.div>

      <div className="relative flex items-start justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-bold tracking-wide text-white">
          YOUR RULES <Icon name="spark" className="size-3.5 text-lime" />
        </span>
        <Link href="/" className="grid size-9 place-items-center rounded-full bg-white/50 text-ink transition hover:bg-white"><Icon name="dots" /></Link>
      </div>

      <div className="relative">
        <div className="text-sm text-ink/70">Money working for you</div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="text-5xl font-semibold tracking-[-0.03em]"><FadeNumber value={committed} prefix="$" /></span>
          <span className="rounded-full bg-forest px-2.5 py-1 text-[11px] font-semibold text-white">{agents + streams + mandates} active rules</span>
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-2.5">
        {[
          { label: "Agents", n: agents, icon: "bot" as const, href: "/agents" },
          { label: "Streams", n: streams, icon: "stream" as const, href: "/streams" },
          { label: "Mandates", n: mandates, icon: "lock" as const, href: "/mandates" },
        ].map((t) => (
          <motion.div key={t.label} whileHover={{ y: -2 }}>
            <Link href={t.href} className="block rounded-2xl bg-mint/80 p-3.5 transition hover:bg-mint">
              <div className="flex items-center justify-between text-[11px] text-ink/70">{t.label} <Icon name="eye" className="size-3.5" /></div>
              <div className="mt-1.5 flex items-center gap-2 text-xl font-semibold"><Icon name={t.icon} className="size-4" /> {t.n}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </MotionCard>
  );
}
