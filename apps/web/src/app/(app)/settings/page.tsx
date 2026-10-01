"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { motion } from "motion/react";
import { Check, Copy, ExternalLink, KeyRound, LogOut, Mail, Wallet } from "lucide-react";
import { explorerAddressUrl } from "@slappay/core";
import { Gate } from "@/components/Gate";
import { MotionCard, stagger } from "@/components/motion";
import { TokenLogo } from "@/components/TokenLogo";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import { useState } from "react";

export default function SettingsPage() {
  return (
    <Gate>
      <Settings />
    </Gate>
  );
}

/** Tiny localStorage-backed preference. */
function usePref(key: string, fallback: string) {
  const k = `slappay:${key}`;
  const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); window.addEventListener("slappay:pref", cb); return () => { window.removeEventListener("storage", cb); window.removeEventListener("slappay:pref", cb); }; };
  const value = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } }, () => fallback);
  const set = (v: string) => { try { localStorage.setItem(k, v); } catch {} window.dispatchEvent(new Event("slappay:pref")); };
  return [value, set] as const;
}

function Settings() {
  const { user, logout, linkEmail, linkGoogle, linkWallet, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [asset, setAsset] = usePref("defaultAsset", "USDC");
  const [hide, setHide] = usePref("hideBalances", "0");
  const [motionPref, setMotionPref] = usePref("motion", "full");
  const embedded = wallets.find((w) => w.walletClientType === "privy");

  const copy = async (k: string, v: string) => { await navigator.clipboard?.writeText(v); setCopied(k); setTimeout(() => setCopied(null), 1200); };
  const d = config.deployment;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-2">
      {/* Account */}
      <MotionCard className="bg-card p-6">
        <div className="font-semibold">Account</div>
        <div className="mt-1 text-[11px] text-dim">Sign-in methods linked to this Slappay account</div>
        <ul className="mt-4 divide-y divide-line">
          <Row icon={<Mail className="size-4" />} label="Email" value={user?.email?.address ?? "Not linked"} action={user?.email ? undefined : <Btn onClick={linkEmail}>Link</Btn>} />
          <Row icon={<span className="text-xs font-bold">G</span>} label="Google" value={user?.google?.email ?? "Not linked"} action={user?.google ? undefined : <Btn onClick={linkGoogle}>Link</Btn>} />
          <Row icon={<Wallet className="size-4" />} label="External wallet" value={wallets.find((w) => w.walletClientType !== "privy")?.address ? short(wallets.find((w) => w.walletClientType !== "privy")!.address) : "Not linked"} action={<Btn onClick={linkWallet}>Link</Btn>} />
        </ul>
        <button type="button" onClick={async () => { await logout(); router.push("/"); }} className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:bg-ember/10 hover:text-ember"><LogOut className="size-4" /> Log out</button>
      </MotionCard>

      {/* Wallet */}
      <MotionCard className="bg-card p-6">
        <div className="font-semibold">Wallet</div>
        <div className="mt-1 text-[11px] text-dim">Your Slappay account is a self-custodial wallet on {config.chain.name}</div>
        <div className="mt-4 rounded-2xl bg-canvas p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-dim"><TokenLogo symbol="MON" size={14} /> Address</span>
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => address && copy("addr", address)} className="grid size-7 place-items-center rounded-full bg-card text-dim hover:text-ink">{copied === "addr" ? <Check className="size-3.5 text-grass" /> : <Copy className="size-3.5" />}</button>
              {address && <a href={explorerAddressUrl(config.chainId, address)} target="_blank" rel="noreferrer" className="grid size-7 place-items-center rounded-full bg-card text-dim hover:text-ink"><ExternalLink className="size-3.5" /></a>}
            </span>
          </div>
          <div className="mt-1 break-all font-mono text-sm font-semibold">{address}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {embedded && <Btn onClick={() => exportWallet()}><KeyRound className="size-3.5" /> Export private key</Btn>}
          <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition hover:bg-canvas"><TokenLogo symbol="USDC" size={12} /> Get test USDC</a>
          <a href="https://faucet.monad.xyz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition hover:bg-canvas"><TokenLogo symbol="MON" size={12} /> Get test MON</a>
        </div>
        <p className="mt-3 text-[11px] text-dim">Export shows your key inside Privy&apos;s secure iframe. Slappay never sees it.</p>
      </MotionCard>

      {/* Preferences */}
      <MotionCard className="bg-card p-6">
        <div className="font-semibold">Preferences</div>
        <div className="mt-1 text-[11px] text-dim">Stored on this device</div>
        <ul className="mt-4 divide-y divide-line">
          <Row label="Default asset" value="Shown first on balance and transfers" action={<Seg options={["USDC", "MON"]} value={asset} onChange={setAsset} />} />
          <Row label="Hide balances" value="Mask amounts until tapped" action={<Toggle on={hide === "1"} onChange={(v) => setHide(v ? "1" : "0")} />} />
          <Row label="Motion" value="Animations across the app" action={<Seg options={["full", "reduced"]} value={motionPref} onChange={setMotionPref} />} />
        </ul>
      </MotionCard>

      {/* Developer */}
      <MotionCard className="bg-card p-6">
        <div className="font-semibold">Developer</div>
        <div className="mt-1 text-[11px] text-dim">Contracts this account talks to on chain {config.chainId}</div>
        <ul className="mt-4 divide-y divide-line">
          {[
            ["USDC", d.usdc],
            ["PaymentMandate", d.paymentMandate],
            ["SpendingPolicy", d.spendingPolicy],
            ["PaymentStream", d.paymentStream],
          ].map(([k, v]) => (
            <Row key={k} label={k} value={<span className="font-mono">{short(v)}</span>} action={
              <span className="flex gap-1">
                <button type="button" onClick={() => copy(k, v)} className="grid size-7 place-items-center rounded-full bg-canvas text-dim hover:text-ink">{copied === k ? <Check className="size-3.5 text-grass" /> : <Copy className="size-3.5" />}</button>
                <a href={explorerAddressUrl(config.chainId, v)} target="_blank" rel="noreferrer" className="grid size-7 place-items-center rounded-full bg-canvas text-dim hover:text-ink"><ExternalLink className="size-3.5" /></a>
              </span>
            } />
          ))}
          <Row label="Paid API (x402)" value={<span className="font-mono">/api/paid/weather</span>} action={<a href="/api/paid/weather" target="_blank" className="text-xs font-semibold text-forest">Try →</a>} />
        </ul>
      </MotionCard>
    </motion.div>
  );
}

function Row({ icon, label, value, action }: { icon?: React.ReactNode; label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        {icon && <span className="grid size-8 place-items-center rounded-full bg-canvas">{icon}</span>}
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-dim">{value}</div>
        </div>
      </div>
      {action}
    </li>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold transition hover:bg-canvas">{children}</button>;
}

function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-full bg-canvas p-1">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} className={`relative z-10 rounded-full px-3 py-1 text-xs font-semibold ${value === o ? "text-ink" : "text-dim"}`}>
          {value === o && <motion.span layoutId={`seg-${options.join()}`} className="absolute inset-0 -z-10 rounded-full bg-card shadow-sm" />}
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-forest" : "bg-line"}`} aria-pressed={on}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
