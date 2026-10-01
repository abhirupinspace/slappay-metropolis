"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import { Button, Icon } from "./ui";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/mandates", label: "Rules" },
  { href: "/agents", label: "Agents" },
  { href: "/streams", label: "Streams" },
];

export function Nav() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address } = useAccount();
  const path = usePathname();
  const name = user?.email?.address?.split("@")[0] ?? user?.google?.name?.split(" ")[0] ?? (address ? short(address) : "there");

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-lime">S</div>
        <span className="text-lg font-bold tracking-tight">Hello, {name}</span>
      </div>

      <nav className="hidden items-center gap-1 rounded-full border border-line bg-card p-1 md:flex">
        {TABS.map((t) => {
          const active = path === t.href || (t.href !== "/dashboard" && path.startsWith(t.href));
          return (
            <Link key={t.href} href={t.href} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${active ? "bg-lime text-ink" : "text-muted hover:text-ink"}`}>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/" className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-3 py-2 text-xs font-semibold text-ink sm:flex" title="New rule">
          <Icon name="spark" className="size-3.5" /> New rule
        </Link>
        <span className="hidden rounded-full border border-line bg-card px-3 py-2 text-xs font-medium text-muted lg:inline">{config.chain.name}</span>
        {authenticated && address ? (
          <Button variant="secondary" size="sm" onClick={logout}>{short(address)}</Button>
        ) : (
          <Button size="sm" onClick={login} disabled={!ready}>Sign in</Button>
        )}
      </div>
    </header>
  );
}
