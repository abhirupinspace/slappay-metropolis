"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ease } from "@/components/motion";

/** Full-screen takeover. Fades the canvas in, springs the content up. Escape closes. */
export function FullScreen({ open, onClose, title, right, children }: { open: boolean; onClose: () => void; title: string; right?: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="fs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-50 flex flex-col bg-card">
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex h-full flex-col">
            <header className="flex items-center justify-between px-6 py-5 sm:px-10">
              <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-canvas text-ink transition hover:bg-line" aria-label="Close"><X className="size-4" /></button>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-dim">{title}</span>
              <div className="min-w-10">{right}</div>
            </header>
            <div className="flex flex-1 flex-col">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Horizontal stage transition inside a takeover. */
export function Stage({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <motion.div key={k} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.35, ease }} className="flex flex-1 flex-col">
      {children}
    </motion.div>
  );
}
