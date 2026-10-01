"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAccount } from "wagmi";
import { ArrowRight, Check, Copy, Share2 } from "lucide-react";
import { buildPayLink, type Asset } from "@/lib/pay-link";
import { TokenLogo } from "@/components/TokenLogo";
import { BigAmount } from "./BigAmount";
import { FullScreen, Stage } from "./FullScreen";
import { Cta, Footer } from "./TransferModal";

const useOrigin = () => useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");

export function RequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { address } = useAccount();
  const origin = useOrigin();
  const [asset, setAsset] = useState<Asset>("USDC");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [stage, setStage] = useState<"amount" | "link">("amount");
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => (address && origin ? buildPayLink(origin, { to: address, asset, amount: amount || undefined, memo: memo || undefined }) : ""), [address, origin, asset, amount, memo]);
  const close = useCallback(() => { onOpenChange(false); setTimeout(() => setStage("amount"), 300); }, [onOpenChange]);

  async function copy() { await navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  async function share() {
    if (navigator.share) await navigator.share({ title: "Pay me on Slappay", text: memo || `Request for ${amount || "any amount"} ${asset}`, url: link }).catch(() => {});
    else copy();
  }

  const toggle = (
    <div className="flex rounded-full bg-canvas p-1">
      {(["USDC", "MON"] as const).map((a) => (
        <button key={a} type="button" onClick={() => setAsset(a)} className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${asset === a ? "text-ink" : "text-dim"}`}>
          {asset === a && <motion.span layoutId="fs-req-asset" className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm" />}
          <TokenLogo symbol={a} size={14} /> {a}
        </button>
      ))}
    </div>
  );

  return (
    <FullScreen open={open} onClose={close} title="Request" right={stage === "amount" ? toggle : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {stage === "amount" ? (
          <Stage k="amount">
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <BigAmount value={amount} onChange={setAmount} asset={asset} placeholder="Any" />
              <div className="mt-4 text-sm text-dim">Leave empty to let them choose the amount</div>
              <div className="mt-12 flex items-baseline gap-2 text-lg sm:text-xl">
                <span className="text-dim">for</span>
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="dinner, invoice #12…" size={Math.max(memo.length, 18)} className={`border-b-2 bg-transparent text-center font-semibold outline-none placeholder:font-normal placeholder:text-dim/60 ${memo ? "border-forest" : "border-line"} focus:border-forest`} />
              </div>
            </div>
            <Footer><Cta onClick={() => setStage("link")} disabled={!link}>Create link <ArrowRight className="size-4" /></Cta></Footer>
          </Stage>
        ) : (
          <Stage k="link">
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-dim">Your payment link</div>
              <div className="mt-4 flex items-center gap-4">
                <TokenLogo symbol={asset} size={48} />
                <div className="text-[64px] font-semibold leading-none tracking-[-0.05em] sm:text-[88px]">{amount ? `${asset === "USDC" ? "$" : ""}${amount}` : "Any"}<span className="ml-2 text-2xl text-dim">{asset}</span></div>
              </div>
              {memo && <div className="mt-3 text-lg text-dim">{memo}</div>}
              <motion.button whileTap={{ scale: 0.98 }} onClick={copy} className="mt-10 max-w-xl break-all rounded-2xl bg-canvas px-5 py-3 font-mono text-xs text-ink transition hover:bg-line" title="Copy">
                {link}
              </motion.button>
            </div>
            <Footer>
              <button type="button" onClick={() => setStage("amount")} className="rounded-full px-5 py-3.5 text-sm font-semibold text-dim transition hover:text-ink">Edit</button>
              <Cta onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy link"}</Cta>
              <Cta tone="lime" onClick={share}><Share2 className="size-4" /> Share</Cta>
            </Footer>
          </Stage>
        )}
      </AnimatePresence>
    </FullScreen>
  );
}
