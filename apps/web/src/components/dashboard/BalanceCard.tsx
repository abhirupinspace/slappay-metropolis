"use client";

import { useState } from "react";
import { short } from "@/lib/format";
import type { Account } from "@/lib/mock";
import { Button, Card, Icon } from "../primitives";

const usd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BalanceCard({ account, onSend, onRequest }: { account: Account; onSend?: () => void; onRequest?: () => void }) {
  const [asset, setAsset] = useState<"USDC" | "MON">("USDC");
  const [hidden, setHidden] = useState(false);
  const value = asset === "USDC" ? `$${usd(account.usdc)}` : `${account.mon.toFixed(3)} MON`;
  return (
    <Card className="relative flex min-h-[260px] flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex rounded-full bg-canvas p-1">
          {(["USDC", "MON"] as const).map((a) => (
            <button key={a} type="button" onClick={() => setAsset(a)} className={`rounded-full px-3 py-1 text-xs font-semibold ${asset === a ? "bg-card text-ink shadow-sm" : "text-dim"}`}>
              {a}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="text-[11px] text-dim">Account</div>
          <button type="button" onClick={() => navigator.clipboard?.writeText(account.address)} className="flex items-center gap-1 font-mono text-sm font-semibold" title={account.address}>
            {short(account.address)} <Icon name="copy" className="size-3.5 text-dim" />
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs text-dim">Active Balance</div>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-5xl font-bold tracking-tight">{hidden ? "••••••" : value}</span>
          <button type="button" onClick={() => setHidden(!hidden)} className="grid size-8 place-items-center rounded-full bg-canvas text-dim hover:text-ink">
            <Icon name="eye" className="size-4" />
          </button>
        </div>
        <div className="mt-1 text-xs text-dim">+ ${usd(account.committed)} working in rules</div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSend}><Icon name="send" className="size-3.5" /> Send</Button>
        <Button variant="secondary" onClick={onRequest}><Icon name="request" className="size-3.5" /> Request</Button>
        <button type="button" className="grid size-8 place-items-center rounded-full text-dim hover:bg-canvas"><Icon name="dots" /></button>
      </div>

      <button type="button" className="absolute bottom-5 right-5 grid size-14 place-items-center rounded-full bg-lime text-forest hover:bg-lime-deep" title="Deposit">
        <Icon name="arrow" className="size-6" />
      </button>
    </Card>
  );
}
