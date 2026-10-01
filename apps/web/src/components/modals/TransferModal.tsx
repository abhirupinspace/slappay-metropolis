"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { erc20Abi, formatUnits, isAddress, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { ArrowRight, ExternalLink } from "lucide-react";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import { useBalances } from "@/lib/hooks/useBalances";
import { useTx, type TxRequest } from "@/lib/hooks/useTx";
import type { Asset } from "@/lib/pay-link";
import { TokenLogo } from "@/components/TokenLogo";
import { BigAmount } from "./BigAmount";
import { FullScreen, Stage } from "./FullScreen";
import { SuccessMark, TxProgress } from "./parts";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; initial?: { to?: string; amount?: string; asset?: Asset; memo?: string } };

const GAS_RESERVE = parseUnits("0.05", 18);

export function TransferModal({ open, onOpenChange, initial }: Props) {
  const { address: me } = useAccount();
  const { usdc, mon, refetch } = useBalances();
  const tx = useTx();
  const [asset, setAsset] = useState<Asset>(initial?.asset ?? "USDC");
  const [to, setTo] = useState(initial?.to ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [stage, setStage] = useState<"amount" | "review">("amount");

  const decimals = asset === "USDC" ? 6 : 18;
  const balance = asset === "USDC" ? usdc : mon;
  const maxSendable = balance === undefined ? 0n : asset === "MON" ? (balance > GAS_RESERVE ? balance - GAS_RESERVE : 0n) : balance;
  const parsed = useMemo(() => { try { return amount ? parseUnits(amount, decimals) : 0n; } catch { return null; } }, [amount, decimals]);
  const fmt = (v?: bigint) => (v === undefined ? "…" : asset === "USDC" ? formatUsdc(v) : Number(formatUnits(v, 18)).toFixed(4));

  const tooMuch = parsed !== null && parsed > 0n && parsed > maxSendable;
  const badTo = Boolean(to) && (!isAddress(to) || (me !== undefined && to.toLowerCase() === me.toLowerCase()));
  const ready = isAddress(to) && !badTo && parsed !== null && parsed > 0n && !tooMuch;

  const step: TxRequest | null = ready ? (asset === "USDC" ? { address: config.usdc, abi: erc20Abi, functionName: "transfer", args: [to, parsed] } : { to: to as `0x${string}`, value: parsed }) : null;

  async function send() {
    if (!step) return;
    const hash = await tx.run([step], `transfer_${asset.toLowerCase()}`);
    if (hash) refetch();
  }
  const close = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => { tx.reset(); setStage("amount"); setAmount(initial?.amount ?? ""); }, 300);
  }, [onOpenChange, tx, initial?.amount]);

  const s = tx.state.status;
  const view = s === "confirmed" ? "done" : s === "error" ? "error" : s !== "idle" ? "progress" : stage;

  const toggle = (
    <div className="flex rounded-full bg-canvas p-1">
      {(["USDC", "MON"] as const).map((a) => (
        <button key={a} type="button" onClick={() => { setAsset(a); setAmount(""); }} disabled={view !== "amount"} className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${asset === a ? "text-ink" : "text-dim"}`}>
          {asset === a && <motion.span layoutId="fs-asset" className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm" />}
          <TokenLogo symbol={a} size={14} /> {a}
        </button>
      ))}
    </div>
  );

  return (
    <FullScreen open={open} onClose={close} title="Transfer" right={view === "amount" ? toggle : undefined}>
      <AnimatePresence mode="wait" initial={false}>
        {view === "amount" && (
          <Stage k="amount">
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <BigAmount value={amount} onChange={setAmount} asset={asset} />
              <motion.div layout className={`mt-4 text-sm ${tooMuch ? "text-ember" : "text-dim"}`}>
                {tooMuch ? `More than you can send${asset === "MON" ? " (0.05 MON kept for gas)" : ""}` : <>Available {fmt(maxSendable)} {asset} · <button type="button" onClick={() => setAmount(formatUnits(maxSendable, decimals))} className="font-semibold text-forest">Max</button></>}
              </motion.div>

              <div className="mt-12 flex items-baseline gap-2 text-lg sm:text-xl">
                <span className="text-dim">to</span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value.trim())}
                  placeholder="paste a wallet address"
                  spellCheck={false}
                  size={Math.max(to.length, 22)}
                  className={`bg-transparent text-center font-mono font-semibold outline-none placeholder:font-sans placeholder:font-normal placeholder:text-dim/60 ${badTo ? "text-ember" : "text-ink"} border-b-2 ${badTo ? "border-ember" : to ? "border-forest" : "border-line"} focus:border-forest`}
                />
              </div>
              {badTo && <div className="mt-2 text-xs text-ember">{me && to.toLowerCase() === me.toLowerCase() ? "That is your own wallet" : "Not a valid 0x address"}</div>}
            </div>
            <Footer>
              <Cta onClick={() => setStage("review")} disabled={!ready}>Review <ArrowRight className="size-4" /></Cta>
            </Footer>
          </Stage>
        )}

        {view === "review" && (
          <Stage k="review">
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-dim">You are about to send</div>
              <div className="mt-4 text-[72px] font-semibold leading-none tracking-[-0.05em] sm:text-[104px]">{asset === "USDC" ? "$" : ""}{fmt(parsed ?? 0n)}<span className="ml-2 text-2xl text-dim">{asset}</span></div>
              <dl className="mt-10 space-y-3 text-base">
                <div className="flex items-baseline justify-center gap-3"><dt className="text-dim">to</dt><dd className="font-mono font-semibold">{short(to)}</dd></div>
                <div className="flex items-baseline justify-center gap-3"><dt className="text-dim">from</dt><dd className="font-mono font-semibold">{short(me)}</dd></div>
                <div className="flex items-baseline justify-center gap-3"><dt className="text-dim">on</dt><dd className="flex items-center gap-1.5 font-semibold"><TokenLogo symbol="MON" size={14} /> {config.chain.name}</dd></div>
                {initial?.memo && <div className="flex items-baseline justify-center gap-3"><dt className="text-dim">for</dt><dd className="font-semibold">{initial.memo}</dd></div>}
              </dl>
            </div>
            <Footer>
              <button type="button" onClick={() => setStage("amount")} className="rounded-full px-5 py-3.5 text-sm font-semibold text-dim transition hover:text-ink">Back</button>
              <Cta onClick={send}>Confirm & sign</Cta>
            </Footer>
          </Stage>
        )}

        {view === "progress" && (
          <Stage k="progress">
            <div className="flex flex-1 flex-col items-center justify-center px-6">
              <div className="text-[56px] font-semibold leading-none tracking-[-0.05em] sm:text-[72px]">{asset === "USDC" ? "$" : ""}{fmt(parsed ?? 0n)} <span className="text-xl text-dim">{asset}</span></div>
              <div className="mt-10 w-full max-w-xs"><TxProgress status={s as "preparing" | "signing" | "submitting" | "confirming"} /></div>
            </div>
          </Stage>
        )}

        {view === "done" && (
          <Stage k="done">
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <SuccessMark />
              <div className="mt-6 text-3xl font-semibold tracking-tight">Sent {fmt(parsed ?? 0n)} {asset}</div>
              <div className="mt-1 text-sm text-dim">to <span className="font-mono text-ink">{short(to)}</span></div>
              {tx.explorer && <a href={tx.explorer} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-forest underline underline-offset-2">View on MonadVision <ExternalLink className="size-3" /></a>}
            </div>
            <Footer><Cta tone="lime" onClick={close}>Done</Cta></Footer>
          </Stage>
        )}

        {view === "error" && (
          <Stage k="error">
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-ember">Transfer failed</div>
              <div className="mt-3 max-w-md text-base">{tx.state.status === "error" ? tx.state.message : ""}</div>
            </div>
            <Footer>
              <button type="button" onClick={() => { tx.reset(); setStage("amount"); }} className="rounded-full px-5 py-3.5 text-sm font-semibold text-dim transition hover:text-ink">Edit</button>
              <Cta onClick={send}>Try again</Cta>
            </Footer>
          </Stage>
        )}
      </AnimatePresence>
    </FullScreen>
  );
}

export function Footer({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center gap-2 px-6 pb-10 pt-4">{children}</div>;
}

export function Cta({ children, onClick, disabled, tone = "forest" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: "forest" | "lime" }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} whileHover={disabled ? {} : { scale: 1.02 }} type="button" onClick={onClick} disabled={disabled} className={`flex min-w-56 items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${tone === "lime" ? "bg-lime text-ink hover:bg-lime-deep" : "bg-forest text-white hover:bg-forest-deep"}`}>
      {children}
    </motion.button>
  );
}
