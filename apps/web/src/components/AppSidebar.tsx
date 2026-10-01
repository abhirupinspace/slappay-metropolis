"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Check, ChevronsUpDown, Copy, ExternalLink, LayoutGrid, Lock, LogIn, LogOut, Sparkles, Waves } from "lucide-react";
import { explorerAddressUrl, formatUsdc } from "@slappay/core";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { config } from "@/lib/config";
import { short } from "@/lib/format";
import { useBalances } from "@/lib/hooks/useBalances";
import { useRuleCounts } from "@/lib/hooks/useRuleCounts";
import { TokenLogo } from "@/components/TokenLogo";
import { ease } from "@/components/motion";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/mandates", label: "Rules", icon: Lock, kind: "mandate" },
  { href: "/agents", label: "Agents", icon: Bot, kind: "agent" },
  { href: "/streams", label: "Streams", icon: Waves, kind: "stream" },
] as const;

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

export function AppSidebar() {
  const path = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const counts = useRuleCounts();
  const isActive = (href: string) => path === href || (href !== "/dashboard" && path.startsWith(href));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <Link href="/dashboard" className={`flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/5 ${collapsed ? "justify-center" : ""}`}>
          <motion.span whileHover={{ rotate: -8, scale: 1.05 }} transition={spring} className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-sm font-bold text-ink">S</motion.span>
          <Label collapsed={collapsed}>
            <span className="block text-sm font-bold leading-tight">Slappay</span>
            <span className="block text-[11px] leading-tight text-white/45">Programmable neobank</span>
          </Label>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-white/40 group-data-[collapsible=icon]:hidden">Account</SidebarGroupLabel>
          <nav className={`relative flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
            {NAV.map((n) => {
              const active = isActive(n.href);
              const count = "kind" in n ? counts[n.kind as keyof typeof counts] : 0;
              return (
                <NavItem key={n.href} href={n.href} label={n.label} icon={n.icon} active={active} count={count} collapsed={collapsed} />
              );
            })}
          </nav>
        </SidebarGroup>

        <SidebarGroup className="mt-2 p-0">
          <SidebarGroupLabel className="px-2 text-white/40 group-data-[collapsible=icon]:hidden">Create</SidebarGroupLabel>
          <div className={collapsed ? "flex justify-center" : ""}><NavItem href="/" label="New rule" icon={Sparkles} active={path === "/"} collapsed={collapsed} accent /></div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <Account collapsed={collapsed} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Text that fades/slides away when the rail collapses instead of truncating. */
function Label({ collapsed, children, className = "" }: { collapsed: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18, ease }} className={`min-w-0 overflow-hidden whitespace-nowrap ${className}`}>
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function NavItem({ href, label, icon: Icon, active, count = 0, collapsed, accent = false }: { href: string; label: string; icon: typeof LayoutGrid; active: boolean; count?: number; collapsed: boolean; accent?: boolean }) {
  const body = (
    <Link href={href} className={`group relative flex h-10 items-center rounded-xl outline-none ${collapsed ? "w-10 justify-center px-0" : "gap-3 px-2.5"}`}>
      {active && (
        <motion.span layoutId={accent ? "nav-accent" : "nav-active"} transition={spring} className={`absolute inset-0 rounded-xl ${accent ? "bg-lime" : "bg-white/10"}`} />
      )}
      {!active && <span className={`absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 ${accent ? "bg-lime/15" : "bg-white/5"}`} />}
      <motion.span whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} transition={spring} className={`relative z-10 grid size-5 shrink-0 place-items-center ${active ? (accent ? "text-ink" : "text-lime") : accent ? "text-lime" : "text-white/70 group-hover:text-white"}`}>
        <Icon className="size-[18px]" />
        {collapsed && count > 0 && <span className={`absolute -right-1.5 -top-1.5 size-2 rounded-full ring-2 ring-[#121412] ${active ? "bg-ink" : "bg-lime"}`} />}
      </motion.span>
      <Label collapsed={collapsed} className={`relative z-10 flex-1 text-sm ${active ? (accent ? "font-semibold text-ink" : "font-semibold text-white") : accent ? "font-semibold text-lime" : "font-medium text-white/80 group-hover:text-white"}`}>
        {label}
      </Label>
      {!collapsed && count > 0 && (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={count} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={spring} className={`relative z-10 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold ${active ? "bg-lime text-ink" : "bg-white/10 text-white/80"}`}>
            {count}
          </motion.span>
        </AnimatePresence>
      )}
    </Link>
  );
  if (!collapsed) return body;
  return (
    <Tooltip>
      <TooltipTrigger render={body} />
      <TooltipContent side="right">{label}{count > 0 ? ` · ${count} active` : ""}</TooltipContent>
    </Tooltip>
  );
}

function Account({ collapsed }: { collapsed: boolean }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address } = useAccount();
  const { usdc } = useBalances();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const name = user?.email?.address ?? user?.google?.email ?? (address ? short(address) : "");

  if (!authenticated || !address) {
    const btn = (
      <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={login} disabled={!ready} className={`flex w-full items-center gap-3 rounded-xl bg-lime p-2 text-left text-ink transition hover:bg-lime-deep disabled:opacity-50 ${collapsed ? "justify-center" : ""}`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-lime"><LogIn className="size-4" /></span>
        <Label collapsed={collapsed}>
          <span className="block text-sm font-semibold leading-tight">Sign in</span>
          <span className="block text-[11px] leading-tight text-ink/60">Email, Google or wallet</span>
        </Label>
      </motion.button>
    );
    return collapsed ? <Tooltip><TooltipTrigger render={btn} /><TooltipContent side="right">Sign in</TooltipContent></Tooltip> : btn;
  }

  const copy = async () => { await navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1200); };

  return (
    <div className="relative">
      <AnimatePresence>
        {open && !collapsed && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.18, ease }} className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl bg-white/[0.06] p-1.5 backdrop-blur">
            <div className="flex items-center justify-between px-2.5 py-2 text-xs">
              <span className="text-white/50">Balance</span>
              <span className="flex items-center gap-1.5 font-semibold text-white"><TokenLogo symbol="USDC" size={12} /> {usdc === undefined ? "…" : formatUsdc(usdc)} USDC</span>
            </div>
            <MenuItem onClick={copy} icon={copied ? <Check className="size-4 text-lime" /> : <Copy className="size-4" />}>{copied ? "Copied" : "Copy address"}</MenuItem>
            <MenuItem href={explorerAddressUrl(config.chainId, address)} icon={<ExternalLink className="size-4" />}>View on MonadVision</MenuItem>
            <MenuItem onClick={() => { setOpen(false); logout(); }} icon={<LogOut className="size-4" />} danger>Log out</MenuItem>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" onClick={() => (collapsed ? logout() : setOpen(!open))} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5 ${open ? "bg-white/5" : ""} ${collapsed ? "justify-center" : ""}`}>
        <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_180deg,#c9f76b,#1b4d2c,#c9f76b)] font-mono text-[10px] font-bold text-ink">
          <span className="grid size-6 place-items-center rounded-full bg-lime">{address.slice(2, 4)}</span>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-grass ring-2 ring-[#121412]" title="Connected" />
        </span>
        <Label collapsed={collapsed} className="flex-1">
          <span className="block truncate text-xs font-semibold leading-tight text-white">{name}</span>
          <span className="flex items-center gap-1 text-[11px] leading-tight text-white/45"><TokenLogo symbol="MON" size={10} /> {config.chain.name}</span>
        </Label>
        {!collapsed && <ChevronsUpDown className="size-4 shrink-0 text-white/40" />}
      </button>
    </div>
  );
}

function MenuItem({ children, icon, onClick, href, danger = false }: { children: React.ReactNode; icon: React.ReactNode; onClick?: () => void; href?: string; danger?: boolean }) {
  const cls = `flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition ${danger ? "text-white/80 hover:bg-ember/20 hover:text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`;
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cls}>{icon} {children}</a>;
  return <button type="button" onClick={onClick} className={cls}>{icon} {children}</button>;
}
