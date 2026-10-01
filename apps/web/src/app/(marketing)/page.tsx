"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "motion/react";
import { ArrowRight, Bot, Lock, Waves } from "lucide-react";
import { ease } from "@/components/motion";
import { TokenLogo } from "@/components/TokenLogo";

const EXAMPLES = ["Pay Alex $500 when the website is approved", "Give my research agent $20 a day, max $2 per call", "Pay Sarah $20 an hour until $2,000"];

export default function Landing() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  useEffect(() => { if (ready && authenticated) router.replace("/dashboard"); }, [ready, authenticated, router]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold">
          <TokenLogo symbol="MON" size={14} /> Live on Monad testnet
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.05 }} className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
          The programmable neobank.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.12 }} className="mt-5 max-w-xl text-lg text-dim">
          Your money. Your rules. Describe what your balance should do in plain English, sign once, and Monad enforces it.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.2 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="button" onClick={login} disabled={!ready} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-40">
            Open your account <ArrowRight className="size-4" />
          </motion.button>
          <span className="text-xs text-dim">Email, Google or wallet · no seed phrase</span>
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.45 } } }} className="mt-14 flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((e) => (
            <motion.span key={e} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="rounded-full bg-card px-4 py-2 text-sm font-medium">
              &ldquo;{e}&rdquo;
            </motion.span>
          ))}
        </motion.div>
      </section>

      {/* Three primitives */}
      <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="grid gap-4 pb-16 sm:grid-cols-3">
        {[
          { icon: Lock, t: "Rules", s: "Lock USDC for someone and release it when a condition is met. You approve, a verifier attests, or a date passes.", bg: "bg-card" },
          { icon: Bot, t: "Agents", s: "Give an AI agent a budget, not your keys. Per-call and daily caps and an allowlist, enforced by the contract.", bg: "bg-lime" },
          { icon: Waves, t: "Streams", s: "Pay by the second from a funded deposit. They withdraw any time; you can stop and reclaim the rest.", bg: "bg-card" },
        ].map((f) => (
          <motion.div key={f.t} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }} whileHover={{ y: -3 }} className={`rounded-[24px] p-6 ${f.bg}`}>
            <span className={`grid size-10 place-items-center rounded-full ${f.bg === "bg-lime" ? "bg-forest text-lime" : "bg-canvas text-ink"}`}><f.icon className="size-[18px]" /></span>
            <div className="mt-4 text-xl font-semibold tracking-tight">{f.t}</div>
            <div className={`mt-1.5 text-sm ${f.bg === "bg-lime" ? "text-forest/80" : "text-dim"}`}>{f.s}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* Line */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 rounded-[24px] bg-ink px-6 py-10 text-center text-white sm:px-12">
        <div className="text-2xl font-semibold tracking-tight sm:text-3xl">Banks give you balances. <span className="text-lime">Slappay gives your balances behavior.</span></div>
        <button type="button" onClick={login} disabled={!ready} className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink transition hover:bg-lime-deep disabled:opacity-40">
          Get started <ArrowRight className="size-4" />
        </button>
      </motion.section>
    </div>
  );
}
