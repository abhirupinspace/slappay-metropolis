"use client";

import { explorerAddressUrl } from "@slappay/core";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import type { TxState } from "@/lib/hooks/useTx";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-neutral-200 bg-white p-4 ${className}`}>{children}</div>;
}

export function Button({
  children, onClick, disabled, variant = "primary", type = "button",
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "secondary" | "danger"; type?: "button" | "submit";
}) {
  const base = "rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "border border-neutral-300 bg-white hover:bg-neutral-50",
    danger: "border border-red-300 text-red-700 bg-white hover:bg-red-50",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function Addr({ a }: { a: string }) {
  return (
    <a href={explorerAddressUrl(config.chainId, a)} target="_blank" rel="noreferrer" className="font-mono text-xs underline decoration-neutral-300" title={a}>
      {short(a)}
    </a>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "red" | "amber" }) {
  const c = { neutral: "bg-neutral-100 text-neutral-700", green: "bg-green-100 text-green-800", red: "bg-red-100 text-red-800", amber: "bg-amber-100 text-amber-800" }[tone];
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}

const labels: Record<TxState["status"], string> = {
  idle: "", preparing: "Preparing…", signing: "Waiting for signature…", submitting: "Submitting…", confirming: "Confirming…", confirmed: "Confirmed ✓", error: "Failed",
};

export function TxStatus({ state, explorer }: { state: TxState; explorer?: string }) {
  if (state.status === "idle") return null;
  const tone = state.status === "confirmed" ? "text-green-700" : state.status === "error" ? "text-red-700" : "text-neutral-600";
  return (
    <div className={`mt-2 text-sm ${tone}`}>
      <span>{labels[state.status]}</span>
      {state.status === "error" && <span className="ml-1 text-neutral-700">{state.message}</span>}
      {explorer && (
        <a href={explorer} target="_blank" rel="noreferrer" className="ml-2 underline">
          View on explorer ↗
        </a>
      )}
    </div>
  );
}

export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-neutral-500">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
