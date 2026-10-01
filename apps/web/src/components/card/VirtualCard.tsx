"use client";

import { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Eye, EyeOff, Snowflake } from "lucide-react";
import { TokenLogo } from "@/components/TokenLogo";

/** Deterministic, cosmetic card details derived from the wallet address. */
export function cardDetails(address: `0x${string}`) {
  const n = BigInt(address) % 10n ** 15n;
  const digits = ("5" + n.toString().padStart(15, "0")).slice(0, 16);
  const groups = digits.match(/.{4}/g) ?? [];
  const cvv = (BigInt(address) % 900n + 100n).toString();
  return { number: groups.join(" "), last4: groups[3], cvv, expiry: "12/28" };
}

export function VirtualCard({ address, name, balance, frozen }: { address: `0x${string}`; name: string; balance: string; frozen: boolean }) {
  const [reveal, setReveal] = useState(false);
  const d = cardDetails(address);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["20%", "80%"]);

  return (
    <div style={{ perspective: 1200 }} className="mx-auto w-full max-w-md">
      <motion.div
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
        onMouseLeave={() => { mx.set(0); my.set(0); }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className={`relative aspect-[1.586] w-full overflow-hidden rounded-[24px] p-6 text-white shadow-[0_40px_80px_-30px_rgba(18,20,18,0.6)] transition-[filter] duration-500 ${frozen ? "grayscale" : ""}`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b4d2c_0%,#0e2a17_55%,#121412_100%)]" />
        <motion.div style={{ left: glowX, top: glowY }} className="pointer-events-none absolute size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-[28px] border-lime/15" />

        <div className="relative flex h-full flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime">Slappay</div>
              <div className="text-[10px] text-white/50">Virtual · Monad</div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur"><TokenLogo symbol="USDC" size={14} /> {balance}</div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-[22px] tracking-[0.12em] sm:text-2xl">{reveal ? d.number : `•••• •••• •••• ${d.last4}`}</div>
              <button type="button" onClick={() => setReveal(!reveal)} className="grid size-7 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20" aria-label="Reveal">
                {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-white/50">Card holder</div>
                <div className="text-sm font-semibold uppercase">{name}</div>
              </div>
              <div className="flex gap-5 font-mono text-sm">
                <div><div className="text-[9px] uppercase tracking-widest text-white/50">Exp</div>{d.expiry}</div>
                <div><div className="text-[9px] uppercase tracking-widest text-white/50">CVV</div>{reveal ? d.cvv : "•••"}</div>
              </div>
            </div>
          </div>
        </div>

        {frozen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 grid place-items-center bg-ink/40 backdrop-blur-[2px]">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"><Snowflake className="size-4" /> Frozen</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
