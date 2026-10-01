"use client";

import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { short } from "@/lib/format";

const TITLES: Record<string, string> = { "/dashboard": "Overview", "/mandates": "Rules", "/agents": "Agents", "/streams": "Streams", "/": "New rule" };

/** Slim top bar inside the inset: trigger, greeting, quick actions. */
export function Nav() {
  const { user } = usePrivy();
  const { address } = useAccount();
  const path = usePathname();
  const name = user?.email?.address?.split("@")[0] ?? user?.google?.name?.split(" ")[0] ?? (address ? short(address) : "there");
  const title = TITLES[path] ?? Object.entries(TITLES).find(([k]) => k !== "/" && path.startsWith(k))?.[1] ?? "Slappay";

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-full" />
        <div className="leading-tight">
          <div className="text-[11px] text-dim">{title}</div>
          <div className="text-lg font-bold tracking-tight">Hello, {name}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="grid size-9 place-items-center rounded-full border border-line bg-card text-ink hover:bg-mint" aria-label="Search"><Search className="size-4" /></button>
        <button type="button" className="relative grid size-9 place-items-center rounded-full border border-line bg-card text-ink hover:bg-mint" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ember ring-2 ring-card" />
        </button>
      </div>
    </header>
  );
}
