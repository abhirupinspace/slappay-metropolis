"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { formatUnits } from "viem";
import { formatUsdc } from "@slappay/core";
import { short } from "@/lib/format";
import { useBalances } from "@/lib/hooks/useBalances";
import { RequestModal } from "../modals/RequestModal";
import { TransferModal } from "../modals/TransferModal";
import { Icon } from "../primitives";
import { TokenLogo } from "../TokenLogo";
import { FadeNumber, MotionCard, ease } from "../motion";

export function BalanceCard({ committed }: { committed: number }) {
  const { address, usdc, mon } = useBalances();
  const [asset, setAsset] = useState<"USDC" | "MON">("USDC");
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const copy = () => { if (!address) return; navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const usdcNum = usdc === undefined ? 0 : Number(formatUsdc(usdc, 2));
  const monNum = mon === undefined ? 0 : Number(formatUnits(mon, 18));

  return (
    <MotionCard lift={false} className="relative flex h-full flex-col justify-between bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="relative flex rounded-full bg-canvas p-1">
          {(["USDC", "MON"] as const).map((a) => (
            <button key={a} type="button" onClick={() => setAsset(a)} className={`relative z-10 flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${asset === a ? "text-ink" : "text-dim hover:text-ink"}`}>
              {asset === a && <motion.span layoutId="asset-pill" className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm" transition={{ duration: 0.3, ease }} />}
              <TokenLogo symbol={a} size={18} />
              {a}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="text-[11px] text-dim">Account</div>
          <button type="button" onClick={copy} className="flex items-center gap-1.5 font-mono text-sm font-semibold" title={address}>
            {address ? short(address) : "Not signed in"}
            <motion.span animate={copied ? { scale: [1, 1.3, 1] } : {}} className={copied ? "text-forest" : "text-dim"}>
              <Icon name={copied ? "check" : "copy"} className="size-3.5" />
            </motion.span>
          </button>
        </div>
      </div>

      <div>
        <div className="text-sm text-dim">Active Balance</div>
        <div className="mt-1 flex items-center gap-4">
          <span className="text-6xl font-semibold tracking-[-0.03em]">
            {hidden ? "••••••" : asset === "USDC" ? <FadeNumber value={usdcNum} prefix="$" /> : <FadeNumber value={monNum} suffix=" MON" decimals={3} />}
          </span>
          <button type="button" onClick={() => setHidden(!hidden)} className="grid size-9 place-items-center rounded-full bg-canvas text-dim transition hover:text-ink">
            <Icon name="eye" className="size-4" />
          </button>
        </div>
        <div className="mt-1 text-xs text-dim">+ ${committed.toLocaleString("en-US", { minimumFractionDigits: 2 })} working in rules</div>
      </div>

      <div className="flex items-center gap-2.5">
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setSendOpen(true)} disabled={!address} className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-deep">
          <Icon name="send" className="size-4" /> Transfer Balance
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setRequestOpen(true)} disabled={!address} className="inline-flex items-center gap-2 rounded-full border border-forest/40 bg-card px-4 py-2.5 text-sm font-semibold text-forest transition hover:bg-mint">
          <Icon name="request" className="size-4" /> Request Balance
        </motion.button>
        <button type="button" className="grid size-9 place-items-center rounded-full text-dim transition hover:bg-canvas"><Icon name="dots" /></button>
      </div>

      <motion.button whileHover={{ scale: 1.06, rotate: 8 }} whileTap={{ scale: 0.95 }} className="absolute bottom-6 right-6 grid size-16 place-items-center rounded-full bg-lime text-forest" title="Deposit">
        <Icon name="arrow" className="size-7" />
      </motion.button>

      {address && <TransferModal open={sendOpen} onOpenChange={setSendOpen} />}
      {address && <RequestModal open={requestOpen} onOpenChange={setRequestOpen} />}
    </MotionCard>
  );
}
