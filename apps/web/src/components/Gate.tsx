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
      <Card className="flex items-center justify-between">
        <span className="text-sm">Sign in to create a wallet and continue.</span>
        <Button onClick={login}>Sign in</Button>
      </Card>
    );
  if (chainId && chainId !== config.chainId) return <Card>Wrong network. Switch your wallet to {config.chain.name}.</Card>;
  return <>{children}</>;
}
