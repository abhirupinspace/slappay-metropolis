"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ease, rise, stagger } from "@/components/motion";
import { Candles, CoinStack, StatusPills, SwapArrows } from "@/components/tools/Illustrations";
import { LiveFeed } from "@/components/tools/LiveFeed";
import { SwapTool } from "@/components/tools/SwapTool";

type Banner = { title: string; sub: string; status: "live" | "preview" | "soon"; bg: string; fg: string; split: string; art: React.ReactNode; href?: string; action?: "swap" };

const BANNERS: Banner[] = [
  { title: "Swap", sub: "Exchange USDC and MON at the best aggregated price", status: "preview", bg: "bg-[#0e2a17]", fg: "text-lime", split: "bg-forest", art: <SwapArrows />, action: "swap" },
  { title: "Earn", sub: "Put idle USDC to work in Aave and Morpho vaults on Monad", status: "soon", bg: "bg-lime", fg: "text-forest", split: "bg-lime-deep", art: <CoinStack /> },
  { title: "Trade", sub: "Limit orders on Kuru, perps on Perpl, from your account", status: "soon", bg: "bg-mint", fg: "text-forest", split: "bg-[#d9f2b8]", art: <Candles /> },
  { title: "Agents", sub: "Fund an agent with a policy. It pays APIs with x402.", status: "live", bg: "bg-[#ffe9dc]", fg: "text-[#8a2f0b]", split: "bg-[#ffd6c2]", art: <StatusPills />, href: "/agents" },
];

const EXPLORE = [
  { label: "Agent CLI", href: "https://github.com/", ext: true },
  { label: "Paid API demo (x402)", href: "/api/paid/weather", ext: true },
  { label: "Payment links", href: "/dashboard" },
  { label: "Virtual card", href: "/card" },
  { label: "Contract addresses", href: "https://testnet.monadvision.com/address/0x517243E456Cbe561EA34693f68CE58D9B71bA298", ext: true },
  { label: "Developer docs", href: "https://github.com/", ext: true },
  { label: "Agent marketplace", soon: true },
  { label: "Transaction history (Envio)", soon: true },
];

const ABOUT = [
  { label: "Settles on Monad", href: "https://monad.xyz", ext: true },
  { label: "Wallets by Privy", href: "https://privy.io", ext: true },
  { label: "USDC by Circle", href: "https://circle.com", ext: true },
];

const pill = { live: "bg-forest text-white", preview: "bg-ink text-lime", soon: "bg-white/60 text-ink" } as const;

export default function ToolsPage() {
  const [swap, setSwap] = useState(false);
  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 lg:h-[calc(100svh-5.5rem)] lg:min-h-[680px] lg:grid-cols-12">
        {/* Hero */}
        <motion.div variants={rise} className="flex flex-col rounded-[24px] bg-lime p-7 lg:col-span-3">
          <div className="text-4xl font-semibold tracking-[-0.03em] text-forest">Tools</div>
          <div className="mt-2 text-sm text-forest/80">Everything your money can plug into. Swap, earn, trade, and let agents pay for you.</div>
          <div className="mt-6 flex-1"><LiveFeed /></div>
          <div className="mt-5 text-[11px] text-forest/70">That feed is the real x402 flow: 402 → policy spend → 200, verified onchain.</div>
        </motion.div>

        {/* Banners */}
        <div className="flex flex-col gap-4 lg:col-span-6">
          {BANNERS.map((b) => {
            const inner = (
              <motion.div variants={rise} whileHover={b.status === "soon" ? {} : { y: -3 }} transition={{ duration: 0.3, ease }} className={`group relative flex min-h-36 flex-1 overflow-hidden rounded-[24px] ${b.bg} ${b.status === "soon" ? "cursor-default" : "cursor-pointer"}`}>
                <div className={`absolute inset-y-0 right-0 w-[46%] ${b.split} [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)] transition-transform duration-500 group-hover:translate-x-1`} />
                <div className="relative z-10 flex flex-1 flex-col justify-center p-7">
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-semibold tracking-[-0.03em] ${b.fg}`}>{b.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill[b.status]}`}>{b.status}</span>
                  </div>
                  <div className={`mt-1.5 max-w-[260px] text-sm ${b.fg} opacity-80`}>{b.sub}</div>
                  {b.status !== "soon" && <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${b.fg}`}>Open <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>}
                </div>
                <div className="relative z-10 w-[40%] max-w-56 p-5">{b.art}</div>
              </motion.div>
            );
            if (b.action === "swap") return <button key={b.title} type="button" onClick={() => setSwap(true)} className="flex flex-1 text-left">{inner}</button>;
            if (b.href) return <Link key={b.title} href={b.href} className="flex flex-1">{inner}</Link>;
            return <div key={b.title} className="flex flex-1">{inner}</div>;
          })}
        </div>

        {/* Explore */}
        <motion.div variants={rise} className="flex flex-col rounded-[24px] bg-card p-7 lg:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-dim">Explore more</div>
          <ul className="mt-3 space-y-2.5">
            {EXPLORE.map((e) => (
              <li key={e.label}>
                {"soon" in e && e.soon ? (
                  <span className="flex items-center justify-between text-lg font-semibold text-dim/60">{e.label}<span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase text-dim">Soon</span></span>
                ) : (
                  <Link href={e.href!} target={e.ext ? "_blank" : undefined} className="group flex items-center justify-between text-lg font-semibold transition hover:text-forest">
                    {e.label}<ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-auto border-t border-line pt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-dim">Built on</div>
            <ul className="mt-2 space-y-1.5">
              {ABOUT.map((a) => (
                <li key={a.label}><Link href={a.href} target="_blank" className="text-sm font-medium text-dim transition hover:text-ink">{a.label}</Link></li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
      <SwapTool open={swap} onOpenChange={setSwap} />
    </>
  );
}
