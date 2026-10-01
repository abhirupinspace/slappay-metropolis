import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-canvas">
      <MarketingNav />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-dim">
        <span>© Slappay · Built for Monad Metropolis</span>
        <span className="flex gap-4"><span>Settles on Monad</span><span>Wallets by Privy</span><span>USDC by Circle</span></span>
      </footer>
    </div>
  );
}
