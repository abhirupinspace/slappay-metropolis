"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { ArrowDownUp, ArrowRight } from "lucide-react";
import { formatUsdc } from "@slappay/core";
import { config } from "@/lib/config";
import { useBalances } from "@/lib/hooks/useBalances";
import type { Asset } from "@/lib/pay-link";
import { TokenLogo } from "@/components/TokenLogo";
import { BigAmount } from "@/components/modals/BigAmount";
import { FullScreen, Stage } from "@/components/modals/FullScreen";
import { Cta, Footer } from "@/components/modals/TransferModal";

const NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/** Swap takeover: same typing surface as Transfer. Quotes come from /api/swap/quote (0x). */
export function SwapTool({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { address } = useAccount();
  const { usdc, mon } = useBalances();
  const [from, setFrom] = useState<Asset>("USDC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{ buyAmount?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const to: Asset = from === "USDC" ? "MON" : "USDC";
  const close = useCallback(() => { onOpenChange(false); setTimeout(() => { setAmount(""); setQuote(null); }, 300); }, [onOpenChange]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!amount || !address) { setQuote(null); return; }
      setLoading(true);
      try {
        const sellAmount = parseUnits(amount, from === "USDC" ? 6 : 18).toString();
        const q = new URLSearchParams({ sellToken: from === "USDC" ? config.usdc : NATIVE, buyToken: to === "USDC" ? config.usdc : NATIVE, sellAmount, taker: address, chainId: String(config.chainId) });
        const r = await fetch(`/api/swap/quote?${q}`);
        setQuote(await r.json());
      } catch (e) {
        setQuote({ error: e instanceof Error ? e.message : "quote failed" });
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [amount, from, to, address]);

  const bal = from === "USDC" ? usdc : mon;
  const fmtBal = bal === undefined ? "…" : from === "USDC" ? formatUsdc(bal) : Number(formatUnits(bal, 18)).toFixed(4);
  const buy = quote?.buyAmount ? (to === "USDC" ? formatUsdc(BigInt(quote.buyAmount)) : Number(formatUnits(BigInt(quote.buyAmount), 18)).toFixed(4)) : null;

  return (
    <FullScreen open={open} onClose={close} title="Swap">
      <AnimatePresence mode="wait" initial={false}>
        <Stage k="swap">
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <BigAmount value={amount} onChange={setAmount} asset={from} />
            <div className="mt-3 text-sm text-dim">Available {fmtBal} {from}</div>

            <motion.button whileHover={{ rotate: 180 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.35 }} onClick={() => { setFrom(to); setAmount(""); }} className="my-8 grid size-12 place-items-center rounded-full bg-canvas text-ink hover:bg-line" aria-label="Flip">
              <ArrowDownUp className="size-5" />
            </motion.button>

            <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              <span className="text-dim">to</span>
              <TokenLogo symbol={to} size={28} />
              <span>{loading ? <span className="inline-block animate-pulse text-dim">quoting…</span> : buy ? `${to === "USDC" ? "$" : ""}${buy}` : "—"}</span>
              <span className="text-base text-dim">{to}</span>
            </div>
            {quote?.error && <div className="mt-4 max-w-sm rounded-2xl bg-canvas px-4 py-3 text-xs text-dim">{quote.error}</div>}
          </div>
          <Footer>
            <Cta disabled={!buy}>Review swap <ArrowRight className="size-4" /></Cta>
          </Footer>
        </Stage>
      </AnimatePresence>
    </FullScreen>
  );
}
