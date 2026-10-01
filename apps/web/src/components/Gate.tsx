"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { config } from "@/lib/config";
import { Button, Card } from "./primitives";

/** Renders children only when signed in with a wallet on the right chain and contracts are deployed. */
export function Gate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();
  const { address, chainId } = useAccount();
  if (!config.isDeployed) return <Card>Contracts not deployed for chain {config.chainId}. Run the deploy script and `pnpm abis`.</Card>;
  if (!ready) return <p className="text-sm text-dim">Loading…</p>;
  if (!authenticated || !address)
    return (
      <Card className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-lime text-lg font-bold text-ink">S</span>
        <div>
          <div className="text-lg font-semibold">Sign in to continue</div>
          <div className="mt-1 text-sm text-dim">Email, Google or wallet. A Monad wallet is created for you.</div>
        </div>
        <Button onClick={login}>Sign in</Button>
      </Card>
    );
  if (chainId && chainId !== config.chainId) return <Card>Wrong network. Switch your wallet to {config.chain.name}.</Card>;
  return <>{children}</>;
}
