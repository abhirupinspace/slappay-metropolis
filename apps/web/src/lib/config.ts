import { getChain, getDeployment, hasDeployment, usdcFor } from "@slappay/core";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 10143);

export const config = {
  chainId,
  chain: getChain(chainId),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? getChain(chainId).rpcUrls.default.http[0],
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  get usdc() {
    return usdcFor(chainId);
  },
  get deployment() {
    return getDeployment(chainId);
  },
  get isDeployed() {
    return hasDeployment(chainId);
  },
} as const;
