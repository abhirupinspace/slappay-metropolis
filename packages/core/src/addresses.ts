import type { Address } from "viem";

/** Circle native USDC on Monad (6 decimals). Source: developers.circle.com/stablecoins/usdc-contract-addresses */
export const USDC_ADDRESSES: Record<number, Address> = {
  10143: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
  143: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
};

/** USDC for a chain: Circle's on Monad, the deployed mock on anvil. */
export function usdcFor(chainId: number): Address {
  return USDC_ADDRESSES[chainId] ?? getDeployment(chainId).usdc;
}

export const USDC_DECIMALS = 6;

export interface Deployment {
  chainId: number;
  usdc: Address;
  paymentMandate: Address;
  spendingPolicy: Address;
  paymentStream: Address;
  deployBlock: number;
  deployedAt: number;
}

/** Filled from contracts/deployments/<chainId>.json by scripts/sync-deployments.mjs */
import deployments from "../deployments.json" with { type: "json" };

export function getDeployment(chainId: number): Deployment {
  const d = (deployments as Record<string, Deployment | undefined>)[String(chainId)];
  if (!d) throw new Error(`No Slappay deployment for chain ${chainId}. Run contracts deploy + pnpm abis.`);
  return d;
}

export function hasDeployment(chainId: number): boolean {
  return Boolean((deployments as Record<string, unknown>)[String(chainId)]);
}
