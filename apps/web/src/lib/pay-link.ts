import { isAddress, type Address } from "viem";

export type Asset = "USDC" | "MON";

export type PayRequest = { to: Address; amount?: string; asset: Asset; memo?: string };

/** /pay?to=0x..&amount=12.5&asset=USDC&memo=lunch */
export function buildPayLink(origin: string, r: PayRequest): string {
  const u = new URL("/pay", origin);
  u.searchParams.set("to", r.to);
  u.searchParams.set("asset", r.asset);
  if (r.amount) u.searchParams.set("amount", r.amount);
  if (r.memo) u.searchParams.set("memo", r.memo);
  return u.toString();
}

export function parsePayLink(params: URLSearchParams): PayRequest | null {
  const to = params.get("to");
  if (!to || !isAddress(to)) return null;
  const asset = params.get("asset") === "MON" ? "MON" : "USDC";
  const amount = params.get("amount") ?? undefined;
  if (amount && !/^\d+(\.\d+)?$/.test(amount)) return null;
  return { to, asset, amount, memo: params.get("memo") ?? undefined };
}
