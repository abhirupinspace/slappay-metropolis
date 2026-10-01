import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { config } from "./config";

export const wagmiConfig = createConfig({
  chains: [config.chain],
  transports: { [config.chain.id]: http(config.rpcUrl) } as Record<number, ReturnType<typeof http>>,
});
