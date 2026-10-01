"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import { useUsdcBalance } from "@/lib/hooks/useUsdc";
import { Button } from "./ui";

export function Nav() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const bal = useUsdcBalance();
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold">Slappay</Link>
          <Link href="/dashboard" className="text-neutral-600 hover:text-black">Dashboard</Link>
          <Link href="/mandates" className="text-neutral-600 hover:text-black">Mandates</Link>
          <Link href="/agents" className="text-neutral-600 hover:text-black">Agents</Link>
          <Link href="/streams" className="text-neutral-600 hover:text-black">Streams</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-neutral-500 sm:inline">{config.chain.name}</span>
          {authenticated && address ? (
            <>
              <span className="font-mono text-xs">{short(address)}</span>
              <span className="text-neutral-700">{bal.data !== undefined ? `${formatUsdc(bal.data)} USDC` : "…"}</span>
              <Button variant="secondary" onClick={logout}>Log out</Button>
            </>
          ) : (
            <Button onClick={login} disabled={!ready}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
}
