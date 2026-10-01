"use client";

import { explorerAddressUrl } from "@slappay/core";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import type { TxState } from "@/lib/hooks/useTx";

export function Card({ children, className = "", tone = "white" }: { children: React.ReactNode; className?: string; tone?: "white" | "lime" | "mint" }) {
  const bg = { white: "bg-card", lime: "bg-lime", mint: "bg-mint" }[tone];
  const border = "";
  return <div className={`rounded-card ${bg} ${border} p-5 ${className}`}>{children}</div>;
}

export function CardTitle({ icon, children, right }: { icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon && <span className="grid size-8 place-items-center rounded-full border border-line text-ink">{icon}</span>}
        <span className="text-[15px] font-semibold">{children}</span>
      </div>
      {right}
    </div>
  );
}

export function Button({
  children, onClick, disabled, variant = "primary", type = "button", size = "md", className = "",
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "secondary" | "lime" | "danger" | "ghost"; type?: "button" | "submit"; size?: "sm" | "md"; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const styles = {
    primary: "bg-forest text-white hover:bg-forest-deep",
    secondary: "border border-ink/20 bg-card text-ink hover:bg-mint",
    lime: "bg-lime text-ink hover:bg-lime-deep",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    ghost: "text-dim hover:bg-canvas hover:text-ink",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sz} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Pill({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? "bg-lime text-ink" : "text-dim hover:text-ink"}`}>
      {children}
    </button>
  );
}

export function Addr({ a }: { a: string }) {
  return (
    <a href={explorerAddressUrl(config.chainId, a)} target="_blank" rel="noreferrer" className="font-mono text-xs text-ink underline decoration-line underline-offset-2" title={a}>
      {short(a)}
    </a>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "red" | "amber" | "lime" }) {
  const c = {
    neutral: "bg-canvas text-dim", green: "bg-mint text-forest", red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-800", lime: "bg-lime text-ink",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c}`}>{children}</span>;
}

const labels: Record<TxState["status"], string> = {
  idle: "", preparing: "Preparing…", signing: "Waiting for signature…", submitting: "Submitting…", confirming: "Confirming…", confirmed: "Confirmed", error: "Failed",
};

export function TxStatus({ state, explorer }: { state: TxState; explorer?: string }) {
  if (state.status === "idle") return null;
  const tone = state.status === "confirmed" ? "text-forest" : state.status === "error" ? "text-red-700" : "text-dim";
  return (
    <div className={`mt-3 text-xs font-medium ${tone}`}>
      <span>{labels[state.status]}</span>
      {state.status === "error" && <span className="ml-1 font-normal text-ink">{state.message}</span>}
      {explorer && (
        <a href={explorer} target="_blank" rel="noreferrer" className="ml-2 underline underline-offset-2">
          View on explorer ↗
        </a>
      )}
    </div>
  );
}

export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-dim">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

export function Icon({ name, className = "size-4" }: { name: "send" | "request" | "arrow" | "search" | "bell" | "copy" | "eye" | "dots" | "bag" | "coin" | "list" | "bot" | "stream" | "lock" | "spark" | "check" | "x" | "plus"; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    send: <><path d="M4 12h16" /><path d="M13 5l7 7-7 7" /></>,
    request: <><path d="M20 12H4" /><path d="M11 5l-7 7 7 7" /></>,
    arrow: <><path d="M7 17L17 7" /><path d="M8 7h9v9" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    bell: <><path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2z" /><path d="M10 20a2 2 0 004 0" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    dots: <><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
    coin: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h3.5a1.5 1.5 0 010 3H10" /></>,
    list: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></>,
    bot: <><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01" /></>,
    stream: <><path d="M3 12c3-4 6-4 9 0s6 4 9 0" /><path d="M3 17c3-4 6-4 9 0s6 4 9 0" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
    spark: <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></>,
    check: <path d="M5 12l5 5L20 7" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} {...p} aria-hidden>
      {paths[name]}
    </svg>
  );
}
