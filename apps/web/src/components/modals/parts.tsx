"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { TokenLogo } from "@/components/TokenLogo";
import type { Asset } from "@/lib/pay-link";
import { ease } from "@/components/motion";

export function AssetToggle({ value, onChange, id, disabled }: { value: Asset; onChange: (a: Asset) => void; id: string; disabled?: boolean }) {
  return (
    <div className="flex rounded-full bg-canvas p-1">
      {(["USDC", "MON"] as const).map((a) => (
        <button key={a} type="button" onClick={() => onChange(a)} disabled={disabled} className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold transition ${value === a ? "text-ink" : "text-dim hover:text-ink"}`}>
          {value === a && <motion.span layoutId={id} className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm" transition={{ duration: 0.3, ease }} />}
          <TokenLogo symbol={a} size={16} /> {a}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-dim">{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}

export const inputCls = "mt-1.5 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm outline-none transition focus:border-forest focus:bg-card";

export function AmountInput({ value, onChange, asset, disabled, placeholder = "0.00" }: { value: string; onChange: (v: string) => void; asset: Asset; disabled?: boolean; placeholder?: string }) {
  return (
    <div className="mt-1.5 flex items-center rounded-2xl border border-line bg-canvas px-4 transition focus-within:border-forest focus-within:bg-card">
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} disabled={disabled} inputMode="decimal" placeholder={placeholder} className="w-full bg-transparent py-3 text-3xl font-semibold tracking-tight outline-none placeholder:text-line" />
      <span className="flex items-center gap-1.5 text-sm font-semibold text-dim"><TokenLogo symbol={asset} size={16} /> {asset}</span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, tone = "forest" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: "forest" | "lime" | "ghost" }) {
  const cls = { forest: "bg-forest text-white hover:bg-forest-deep", lime: "bg-lime text-ink hover:bg-lime-deep", ghost: "border border-line bg-card text-ink hover:bg-canvas" }[tone];
  return (
    <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={onClick} disabled={disabled} className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}>
      {children}
    </motion.button>
  );
}

/** Step wrapper: slides in from the right, out to the left. */
export function Step({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div key={k} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease }}>
      {children}
    </motion.div>
  );
}

/** Success mark: lime disc pops, check draws. */
export function SuccessMark() {
  return (
    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto grid size-20 place-items-center rounded-full bg-lime">
      <motion.svg viewBox="0 0 24 24" className="size-10 text-forest" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12l5 5L20 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2, ease }} />
      </motion.svg>
    </motion.div>
  );
}

/** Progress list for a transaction: Signing → Submitting → Confirmed. */
export function TxProgress({ status }: { status: "preparing" | "signing" | "submitting" | "confirming" | "confirmed" | "error" }) {
  const steps = [
    { k: "signing", label: "Sign in your wallet" },
    { k: "confirming", label: "Settling on Monad" },
    { k: "confirmed", label: "Confirmed" },
  ];
  const order = ["preparing", "signing", "submitting", "confirming", "confirmed"];
  const idx = order.indexOf(status);
  return (
    <ul className="space-y-3">
      {steps.map((s, i) => {
        const at = order.indexOf(s.k);
        const done = idx > at || status === "confirmed";
        const active = !done && (idx === at || (s.k === "confirming" && status === "submitting") || (s.k === "signing" && status === "preparing"));
        return (
          <li key={s.k} className="flex items-center gap-3 text-sm">
            <span className={`grid size-7 place-items-center rounded-full ${done ? "bg-lime text-forest" : active ? "border-2 border-forest" : "border border-line text-dim"}`}>
              {done ? <Check className="size-3.5" /> : active ? <motion.span animate={{ scale: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} className="size-2.5 rounded-full bg-forest" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </span>
            <span className={done || active ? "font-semibold" : "text-dim"}>{s.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
