"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { erc20Abi, formatUnits, isAddress, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { ArrowRight, ExternalLink, Send } from "lucide-react";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import { useBalances } from "@/lib/hooks/useBalances";
import { useTx, type TxRequest } from "@/lib/hooks/useTx";
import type { Asset } from "@/lib/pay-link";
import { Modal } from "./Modal";
import { AmountInput, AssetToggle, Field, PrimaryButton, Step, SuccessMark, TxProgress, inputCls } from "./parts";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; initial?: { to?: string; amount?: string; asset?: Asset; memo?: string } };

const GAS_RESERVE = parseUnits("0.05", 18);

export function TransferModal({ open, onOpenChange, initial }: Props) {
  const { address: me } = useAccount();
  const { usdc, mon, refetch } = useBalances();
  const tx = useTx();
  const [asset, setAsset] = useState<Asset>(initial?.asset ?? "USDC");
  const [to, setTo] = useState(initial?.to ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [stage, setStage] = useState<"form" | "review">("form");

  const decimals = asset === "USDC" ? 6 : 18;
  const balance = asset === "USDC" ? usdc : mon;
  const maxSendable = balance === undefined ? 0n : asset === "MON" ? (balance > GAS_RESERVE ? balance - GAS_RESERVE : 0n) : balance;
  const parsed = useMemo(() => { try { return amount ? parseUnits(amount, decimals) : 0n; } catch { return null; } }, [amount, decimals]);

  const errors: string[] = [];
  if (to && !isAddress(to)) errors.push("Recipient must be a 0x address");
  if (to && me && to.toLowerCase() === me.toLowerCase()) errors.push("That is your own wallet");
  if (amount && parsed === null) errors.push("Invalid amount");
  if (parsed !== null && parsed > 0n && parsed > maxSendable) errors.push(`Exceeds balance${asset === "MON" ? " (0.05 MON kept for gas)" : ""}`);
  const ready = isAddress(to) && parsed !== null && parsed > 0n && errors.length === 0;

  const fmt = (v?: bigint) => (v === undefined ? "…" : asset === "USDC" ? formatUsdc(v) : Number(formatUnits(v, 18)).toFixed(4));
  const step: TxRequest | null = ready ? (asset === "USDC" ? { address: config.usdc, abi: erc20Abi, functionName: "transfer", args: [to, parsed] } : { to: to as `0x${string}`, value: parsed }) : null;

  async function send() {
    if (!step) return;
    const hash = await tx.run([step], `transfer_${asset.toLowerCase()}`);
    if (hash) refetch();
  }
  function close(o: boolean) {
    if (!o) { tx.reset(); setStage("form"); setAmount(initial?.amount ?? ""); }
    onOpenChange(o);
  }

  const s = tx.state.status;
  const view = s === "confirmed" ? "done" : s === "error" ? "error" : s !== "idle" ? "progress" : stage;

  return (
    <Modal open={open} onOpenChange={close} title="Transfer balance" subtitle={view === "form" ? `From your account on ${config.chain.name}` : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {view === "form" && (
          <Step k="form">
            <div className="space-y-4">
              <AssetToggle id="transfer-asset" value={asset} onChange={(a) => { setAsset(a); setAmount(""); }} />
              <Field label="Recipient">
                <input value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…" spellCheck={false} className={`${inputCls} font-mono`} />
              </Field>
              <Field label="Amount" hint={<button type="button" onClick={() => setAmount(formatUnits(maxSendable, decimals))} className="font-semibold text-forest">Max {fmt(maxSendable)}</button>}>
                <AmountInput value={amount} onChange={setAmount} asset={asset} />
              </Field>
              {errors.length > 0 && <ul className="list-disc pl-5 text-xs text-ember">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
              <PrimaryButton onClick={() => setStage("review")} disabled={!ready}>Review <ArrowRight className="size-4" /></PrimaryButton>
            </div>
          </Step>
        )}

        {view === "review" && (
          <Step k="review">
            <div className="rounded-3xl bg-mint/60 p-5 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wide text-forest">You are about to send</div>
              <div className="mt-2 text-5xl font-semibold tracking-[-0.03em]">{fmt(parsed ?? 0n)} <span className="text-2xl text-dim">{asset}</span></div>
            </div>
            <dl className="mt-4 divide-y divide-line text-sm">
              <div className="flex justify-between py-2.5"><dt className="text-dim">To</dt><dd className="font-mono font-semibold" title={to}>{short(to)}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-dim">From</dt><dd className="font-mono font-semibold">{short(me)}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-dim">Network</dt><dd className="font-semibold">{config.chain.name}</dd></div>
              {initial?.memo && <div className="flex justify-between py-2.5"><dt className="text-dim">Note</dt><dd className="font-semibold">{initial.memo}</dd></div>}
            </dl>
            <div className="mt-5 flex gap-2">
              <PrimaryButton tone="ghost" onClick={() => setStage("form")}>Back</PrimaryButton>
              <PrimaryButton onClick={send}><Send className="size-4" /> Confirm & sign</PrimaryButton>
            </div>
          </Step>
        )}

        {view === "progress" && (
          <Step k="progress">
            <div className="py-2">
              <div className="mb-5 text-center text-3xl font-semibold tracking-tight">{fmt(parsed ?? 0n)} {asset}</div>
              <TxProgress status={s as "preparing" | "signing" | "submitting" | "confirming"} />
            </div>
          </Step>
        )}

        {view === "done" && (
          <Step k="done">
            <div className="py-2 text-center">
              <SuccessMark />
              <div className="mt-4 text-2xl font-semibold tracking-tight">Sent {fmt(parsed ?? 0n)} {asset}</div>
              <div className="mt-1 text-sm text-dim">to <span className="font-mono text-ink">{short(to)}</span></div>
              {tx.explorer && <a href={tx.explorer} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest underline underline-offset-2">View on MonadVision <ExternalLink className="size-3" /></a>}
              <div className="mt-6"><PrimaryButton tone="lime" onClick={() => close(false)}>Done</PrimaryButton></div>
            </div>
          </Step>
        )}

        {view === "error" && (
          <Step k="error">
            <div className="rounded-3xl bg-ember/10 p-5 text-sm">
              <div className="font-semibold text-ember">Transfer failed</div>
              <div className="mt-1 text-ink">{tx.state.status === "error" ? tx.state.message : ""}</div>
            </div>
            <div className="mt-5 flex gap-2">
              <PrimaryButton tone="ghost" onClick={() => { tx.reset(); setStage("form"); }}>Edit</PrimaryButton>
              <PrimaryButton onClick={send}>Try again</PrimaryButton>
            </div>
          </Step>
        )}
      </AnimatePresence>
    </Modal>
  );
}
