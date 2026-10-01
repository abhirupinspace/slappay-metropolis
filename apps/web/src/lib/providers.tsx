"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { config } from "./config";
import { wagmiConfig } from "./wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  if (!config.privyAppId) {
    return (
      <main className="mx-auto max-w-xl p-8 text-sm">
        <h1 className="mb-2 text-xl font-bold">Slappay</h1>
        <p>Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> in <code>apps/web/.env.local</code> (dashboard.privy.io, enable Monad Testnet) and restart.</p>
      </main>
    );
  }
  return (
    <PrivyProvider
      appId={config.privyAppId}
      config={{
        defaultChain: config.chain,
        supportedChains: [config.chain],
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        appearance: { theme: "light", accentColor: "#111111" },
        loginMethods: ["email", "google", "wallet"],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
