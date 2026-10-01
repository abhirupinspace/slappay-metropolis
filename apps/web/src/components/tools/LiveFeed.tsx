"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SCRIPT = [
  { t: "GET /api/paid/weather?city=Berlin", tone: "dim" },
  { t: "← 402 Payment Required · 0.01 USDC", tone: "ember" },
  { t: "policy #1 pre-check: ok", tone: "dim" },
  { t: "spend(0.01 USDC → 0x3C44…93BC)", tone: "white" },
  { t: "confirmed on Monad · 0x9d5d…dc7f", tone: "lime" },
  { t: "← 200 OK · 21°C, clear", tone: "lime" },
] as const;

/** Looping terminal feed of the x402 flow, for the Tools hero. */
export function LiveFeed() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v >= SCRIPT.length ? 1 : v + 1)), 1100);
    return () => clearInterval(t);
  }, []);
  const tone = { dim: "text-white/50", ember: "text-[#ffb088]", white: "text-white", lime: "text-lime" };
  return (
    <div className="flex h-full flex-col rounded-[20px] bg-ink p-4 font-mono text-[11px] leading-6">
      <div className="mb-2 flex gap-1.5"><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-lime" /></div>
      <div className="text-white/40">$ agent fetch …/weather</div>
      <AnimatePresence initial={false}>
        {SCRIPT.slice(0, n).map((l) => (
          <motion.div key={l.t} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={tone[l.tone]}>{l.t}</motion.div>
        ))}
      </AnimatePresence>
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="inline-block h-3 w-1.5 bg-lime align-middle" />
    </div>
  );
}
