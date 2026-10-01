"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Bot, LayoutGrid, Lock, LogIn, LogOut, Sparkles, Waves } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { config } from "@/lib/config";
import { TokenLogo } from "@/components/TokenLogo";
import { short } from "@/lib/format";
import { useDashboard } from "@/lib/hooks/useDashboard";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/mandates", label: "Rules", icon: Lock, kind: "mandate" },
  { href: "/agents", label: "Agents", icon: Bot, kind: "agent" },
  { href: "/streams", label: "Streams", icon: Waves, kind: "stream" },
] as const;

export function AppSidebar() {
  const path = usePathname();
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const { counts } = useDashboard();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-sm font-bold text-ink">S</span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold">Slappay</span>
                <span className="text-[11px] text-white/50">Programmable neobank</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => {
                const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
                const count = "kind" in n ? counts[n.kind as keyof typeof counts] : 0;
                return (
                  <SidebarMenuItem key={n.href}>
                    <SidebarMenuButton isActive={active} tooltip={n.label} render={<Link href={n.href} />}>
                      <n.icon />
                      <span>{n.label}</span>
                    </SidebarMenuButton>
                    {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Create</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={path === "/"} tooltip="New rule" render={<Link href="/" />} className="bg-lime font-semibold text-ink hover:bg-lime-deep data-active:bg-lime-deep">
                  <Sparkles />
                  <span>New rule</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {authenticated && address ? (
              <SidebarMenuButton size="lg" tooltip="Log out" onClick={logout}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime font-mono text-[10px] font-bold text-ink">{address.slice(2, 4)}</span>
                <span className="flex flex-col leading-tight">
                  <span className="font-mono text-xs font-semibold">{short(address)}</span>
                  <span className="flex items-center gap-1 text-[11px] text-white/50"><TokenLogo symbol="MON" size={12} /> {config.chain.name}</span>
                </span>
                <LogOut className="ml-auto size-4 text-white/50" />
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton size="lg" tooltip="Sign in" onClick={login} disabled={!ready}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime text-ink"><LogIn className="size-4" /></span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">Sign in</span>
                  <span className="text-[11px] text-white/50">Email, Google or wallet</span>
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
