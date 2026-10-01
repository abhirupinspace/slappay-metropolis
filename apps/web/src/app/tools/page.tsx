"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownUp, Bot, BookOpen, Boxes, Database, Globe, Landmark, LineChart, Terminal, type LucideIcon } from "lucide-react";
import { Gate } from "@/components/Gate";
import { MotionCard, stagger } from "@/components/motion";
import { SwapTool } from "@/components/tools/SwapTool";

type Tool = { icon: LucideIcon; name: string; blurb: string; status: "live" | "preview" | "soon"; href?: string; action?: "swap" };

const TOOLS: Tool[] = [
  { icon: ArrowDownUp, name: "Swap", blurb: "USDC ↔ MON via 0x aggregated liquidity.", status: "preview", action: "swap" },
  { icon: Globe, name: "x402 paid API", blurb: "Let an agent pay per request. Demo endpoint settles through your policy.", status: "live", href: "/api/paid/weather" },
  { icon: Terminal, name: "Agent CLI", blurb: "keygen · status · pay · fetch. Policy-routed payments from any script.", status: "live", href: "https://github.com/" },
  { icon: Landmark, name: "Earn on idle USDC", blurb: "Route idle balances to Aave or Morpho vaults on Monad.", status: "soon" },
  { icon: LineChart, name: "Kuru order book", blurb: "Limit orders on the fully onchain CLOB.", status: "soon" },
  { icon: Boxes, name: "Perpl", blurb: "Perps execution and risk view from your account.", status: "soon" },
  { icon: Database, name: "Envio indexer", blurb: "Full transaction history and analytics via HyperIndex.", status: "soon" },
  { icon: Bot, name: "Agent marketplace", blurb: "Discover ERC-8004 agents and fund them with a policy.", status: "soon" },
  { icon: BookOpen, name: "Developer docs", blurb: "Contracts, ABIs and the intent schema.", status: "live", href: "https://github.com/" },
];

const badge = { live: "bg-mint text-forest", preview: "bg-lime text-ink", soon: "bg-canvas text-dim" } as const;
const label = { live: "Live", preview: "Preview", soon: "Soon" } as const;

export default function ToolsPage() {
  return (
    <Gate>
      <Tools />
    </Gate>
  );
}

function Tools() {
  const [swap, setSwap] = useState(false);
  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const inner = (
            <MotionCard className="flex h-full flex-col bg-card p-5">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-canvas text-ink"><t.icon className="size-[18px]" /></span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge[t.status]}`}>{label[t.status]}</span>
              </div>
              <div className="mt-4 text-base font-semibold">{t.name}</div>
              <div className="mt-1 text-sm text-dim">{t.blurb}</div>
              {t.status !== "soon" && <div className="mt-auto pt-4 text-xs font-semibold text-forest">{t.action ? "Open →" : "View →"}</div>}
            </MotionCard>
          );
          if (t.action === "swap") return <button key={t.name} type="button" onClick={() => setSwap(true)} className="text-left">{inner}</button>;
          if (t.href && t.status !== "soon") return <Link key={t.name} href={t.href} target={t.href.startsWith("http") ? "_blank" : undefined} className="block">{inner}</Link>;
          return <div key={t.name} className="opacity-70">{inner}</div>;
        })}
      </motion.div>
      <SwapTool open={swap} onOpenChange={setSwap} />
    </>
  );
}
