"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Asset } from "@/lib/pay-link";

/**
 * Typed amount rendered as display text (no box). A hidden input captures keystrokes;
 * each new digit pops in. Font shrinks as the number grows.
 */
export function BigAmount({ value, onChange, asset, autoFocus = true, placeholder = "0", disabled }: { value: string; onChange: (v: string) => void; asset: Asset; autoFocus?: boolean; placeholder?: string; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  const len = (value || placeholder).length;
  const size = len <= 6 ? "text-[88px] sm:text-[120px]" : len <= 9 ? "text-[64px] sm:text-[92px]" : "text-[44px] sm:text-[64px]";
  const chars = (value || "").split("");

  return (
    <button type="button" onClick={() => ref.current?.focus()} disabled={disabled} className="group relative mx-auto flex items-end justify-center gap-2 outline-none">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, "").replace(/^(\d*\.\d*)\..*$/, "$1"))}
        inputMode="decimal"
        disabled={disabled}
        className="absolute inset-0 h-full w-full opacity-0"
        aria-label="Amount"
      />
      <span className={`flex items-baseline font-semibold leading-none tracking-[-0.05em] ${size}`}>
        <span className={value ? "text-ink" : "text-line"}>{asset === "USDC" ? "$" : ""}</span>
        {value ? (
          <AnimatePresence initial={false}>
            {chars.map((c, i) => (
              <motion.span key={`${i}-${c}`} initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.22 }} className="inline-block">
                {c}
              </motion.span>
            ))}
          </AnimatePresence>
        ) : (
          <span className="text-line">{placeholder}</span>
        )}
        {!disabled && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.1, repeat: Infinity }} className="ml-1 inline-block h-[0.8em] w-[3px] translate-y-[0.08em] rounded-full bg-forest" />}
      </span>
      <span className="pb-3 text-xl font-semibold text-dim sm:pb-5 sm:text-2xl">{asset}</span>
    </button>
  );
}
