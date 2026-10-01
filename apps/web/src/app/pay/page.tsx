"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/primitives";
import { TokenLogo } from "@/components/TokenLogo";
import { TransferModal } from "@/components/modals/TransferModal";
import { short } from "@/lib/format";
import { parsePayLink } from "@/lib/pay-link";

export default function PayPage() {
  return (
    <Suspense>
      <Pay />
    </Suspense>
  );
}

function Pay() {
  const req = parsePayLink(useSearchParams());
  const { authenticated, login, ready } = usePrivy();
  const { address } = useAccount();
  const [open, setOpen] = useState(false);

  if (!req) return <div className="mx-auto mt-16 max-w-md rounded-card bg-card p-6 text-sm">This payment link is invalid or incomplete.</div>;
  const self = address && address.toLowerCase() === req.to.toLowerCase();

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="rounded-card bg-card p-6">
        <div className="text-[11px] font-bold uppercase tracking-wide text-forest">Payment request</div>
        <div className="mt-3 flex items-center gap-3">
          <TokenLogo symbol={req.asset} size={36} />
          <div className="text-4xl font-semibold tracking-tight">{req.amount ? `${req.amount} ${req.asset}` : `Any ${req.asset}`}</div>
        </div>
        {req.memo && <div className="mt-2 text-sm text-dim">{req.memo}</div>}
        <div className="mt-4 text-xs text-dim">to <span className="font-mono text-ink" title={req.to}>{short(req.to)}</span> on Monad</div>

        <div className="mt-6">
          {!ready ? null : !authenticated ? (
            <button type="button" onClick={login} className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-white hover:bg-forest-deep">Sign in to pay</button>
          ) : self ? (
            <p className="text-sm text-dim">This is your own request link. Share it with whoever should pay you.</p>
          ) : (
            <Gate>
              <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3 text-sm font-semibold text-white hover:bg-forest-deep">
                <Icon name="send" className="size-4" /> Pay {req.amount ? `${req.amount} ${req.asset}` : req.asset}
              </button>
            </Gate>
          )}
        </div>
      </div>
      <TransferModal open={open} onOpenChange={setOpen} initial={{ to: req.to, amount: req.amount, asset: req.asset, memo: req.memo }} />
    </div>
  );
}
