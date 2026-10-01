"use client";

import { motion } from "motion/react";

/** Shared easing for the dashboard. */
export const ease = [0.22, 1, 0.36, 1] as const;

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const rise = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } },
};

/** Card that fades/rises in and lifts on hover. */
export function MotionCard({ children, className = "", lift = true }: { children: React.ReactNode; className?: string; lift?: boolean }) {
  return (
    <motion.div
      variants={rise}
      whileHover={lift ? { y: -3, transition: { duration: 0.25, ease } } : undefined}
      className={`rounded-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Number that fades/blurs in once; re-fades when the value changes. No counting. */
export function FadeNumber({ value, prefix = "", suffix = "", decimals = 2, className = "" }: { value: number; prefix?: string; suffix?: string; decimals?: number; className?: string }) {
  const text = `${prefix}${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return (
    <motion.span
      key={text}
      initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease }}
      className={`inline-block ${className}`}
    >
      {text}
    </motion.span>
  );
}

/** Horizontal bar that grows to `pct` (0..1). */
export function Bar({ pct, className = "bg-lime-deep", track = "bg-line", h = "h-2" }: { pct: number; className?: string; track?: string; h?: string }) {
  return (
    <div className={`${h} w-full overflow-hidden rounded-full ${track}`}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.max(pct, 0), 1) * 100}%` }} transition={{ duration: 0.9, ease, delay: 0.2 }} className={`${h} rounded-full ${className}`} />
    </div>
  );
}

export const PressButton = motion.button;
