"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "motion/react";

export function MarketingNav() {
  const { ready, authenticated, login } = usePrivy();
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-bold text-lime">S</span>
        <span className="text-sm font-bold">Slappay</span>
      </Link>
      <div className="flex items-center gap-2">
        {authenticated ? (
          <Link href="/dashboard" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-black">Open app</Link>
        ) : (
          <>
            <button type="button" onClick={login} disabled={!ready} className="rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-card disabled:opacity-40">Sign in</button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={login} disabled={!ready} className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lime-deep disabled:opacity-40">Get started</motion.button>
          </>
        )}
      </div>
    </header>
  );
}
