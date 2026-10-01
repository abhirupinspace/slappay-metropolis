"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { ArrowRight, Bot, Globe, ShieldCheck } from "lucide-react";
import { formatUsdc } from "@slappay/core";
import { VirtualCard } from "@/components/card/VirtualCard";
import { ease } from "@/components/motion";
import { useBalances } from "@/lib/hooks/useBalances";

const PREVIEW = "0x5f1aPpaYc0ffee00000000000000000000000001" as const;

export default function CardPage() {
  const { user } = usePrivy();
  const { address } = useAccount();
  const { usdc } = useBalances();
  const name = user?.google?.name ?? user?.email?.address?.split("@")[0] ?? "Your name";

  return (
    <div className="flex min-h-[calc(100svh-5.25rem)] flex-col items-center justify-center text-center">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-forest">
        Coming soon
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.05 }} className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        A card that follows your rules
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.1 }} className="mx-auto mt-3 max-w-md text-sm text-dim">
        Spend your USDC anywhere cards are accepted. Limits, merchants and freezes enforced by the same policies that govern your agents.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 30, rotateX: 12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.7, ease, delay: 0.15 }} className="mt-10 w-full">
        <VirtualCard address={address ?? PREVIEW} name={name} balance={usdc === undefined ? "USDC" : `$${formatUsdc(usdc)}`} frozen={false} />
      </motion.div>

      <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }} className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Policy-enforced", s: "Per-swipe and daily caps live onchain." },
          { icon: Bot, t: "Agents welcome", s: "Give an agent a card, not your keys." },
          { icon: Globe, t: "Settles on Monad", s: "USDC in, instant finality out." },
        ].map((f) => (
          <motion.li key={f.t} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl bg-card p-4 text-left">
            <span className="grid size-9 place-items-center rounded-full bg-canvas"><f.icon className="size-4" /></span>
            <div className="mt-3 text-sm font-semibold">{f.t}</div>
            <div className="mt-0.5 text-xs text-dim">{f.s}</div>
          </motion.li>
        ))}
      </motion.ul>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8">
        <Link href="/new" className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest-deep">
          Meanwhile, set a spending rule <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    </div>
  );
}
