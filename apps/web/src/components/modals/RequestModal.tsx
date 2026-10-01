"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import { useAccount } from "wagmi";
import { ArrowRight, Check, Copy, Link2, Share2 } from "lucide-react";
import { buildPayLink, type Asset } from "@/lib/pay-link";
import { TokenLogo } from "@/components/TokenLogo";
import { Modal } from "./Modal";
import { AmountInput, AssetToggle, Field, PrimaryButton, Step, inputCls } from "./parts";

const useOrigin = () => useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");

export function RequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { address } = useAccount();
  const origin = useOrigin();
  const [asset, setAsset] = useState<Asset>("USDC");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [stage, setStage] = useState<"form" | "link">("form");
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => (address && origin ? buildPayLink(origin, { to: address, asset, amount: amount || undefined, memo: memo || undefined }) : ""), [address, origin, asset, amount, memo]);

  async function copy() { await navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  async function share() {
    if (navigator.share) await navigator.share({ title: "Pay me on Slappay", text: memo || `Request for ${amount || "any amount"} ${asset}`, url: link }).catch(() => {});
    else copy();
  }
  function close(o: boolean) { if (!o) setStage("form"); onOpenChange(o); }

  return (
    <Modal open={open} onOpenChange={close} title="Request balance" subtitle={stage === "form" ? "Anyone with the link can pay you in one tap." : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {stage === "form" ? (
          <Step k="form">
            <div className="space-y-4">
              <AssetToggle id="request-asset" value={asset} onChange={setAsset} />
              <Field label="Amount" hint={<span className="text-dim">optional</span>}>
                <AmountInput value={amount} onChange={setAmount} asset={asset} placeholder="Any" />
              </Field>
              <Field label="What for" hint={<span className="text-dim">optional</span>}>
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Dinner, invoice #12…" className={inputCls} />
              </Field>
              <PrimaryButton onClick={() => setStage("link")} disabled={!link}>Create link <ArrowRight className="size-4" /></PrimaryButton>
            </div>
          </Step>
        ) : (
          <Step k="link">
            <div className="rounded-3xl bg-lime p-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-forest"><Link2 className="size-3.5" /> Payment link</div>
              <div className="mt-2 flex items-center gap-3">
                <TokenLogo symbol={asset} size={32} />
                <div className="text-3xl font-semibold tracking-tight">{amount ? `${amount} ${asset}` : `Any ${asset}`}</div>
              </div>
              {memo && <div className="mt-1 text-sm text-ink/70">{memo}</div>}
              <div className="mt-4 break-all rounded-2xl bg-white/60 px-3 py-2 font-mono text-[11px] text-ink">{link}</div>
            </div>
            <div className="mt-5 flex gap-2">
              <PrimaryButton onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy link"}</PrimaryButton>
              <PrimaryButton tone="ghost" onClick={share}><Share2 className="size-4" /> Share</PrimaryButton>
            </div>
            <button type="button" onClick={() => setStage("form")} className="mt-3 w-full text-center text-xs font-semibold text-dim hover:text-ink">Edit request</button>
          </Step>
        )}
      </AnimatePresence>
    </Modal>
  );
}
