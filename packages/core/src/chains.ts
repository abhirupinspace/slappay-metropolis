import { defineChain } from "viem";
import { monad, monadTestnet as viemMonadTestnet } from "viem/chains";

/** viem's monadTestnet points at a stale explorer; override with MonadVision. */
export const monadTestnet = defineChain({
  ...viemMonadTestnet,
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadvision.com" },
  },
});

export const monadMainnet = defineChain({
  ...monad,
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
  },
});

export const SUPPORTED_CHAINS = {
  [monadTestnet.id]: monadTestnet,
  [monadMainnet.id]: monadMainnet,
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

export function getChain(chainId: number) {
  const chain = SUPPORTED_CHAINS[chainId as SupportedChainId];
  if (!chain) throw new Error(`Unsupported chain id ${chainId}`);
  return chain;
}

export function explorerTxUrl(chainId: number, hash: string) {
  return `${getChain(chainId).blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(chainId: number, address: string) {
  return `${getChain(chainId).blockExplorers.default.url}/address/${address}`;
}
