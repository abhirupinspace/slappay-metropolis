import { formatUnits, parseUnits } from "viem";
import { USDC_DECIMALS } from "./addresses";

export const parseUsdc = (amount: string | number) => parseUnits(String(amount), USDC_DECIMALS);
export const formatUsdc = (amount: bigint, maxFrac = 2) => {
  const s = formatUnits(amount, USDC_DECIMALS);
  const [i, f = ""] = s.split(".");
  const frac = f.slice(0, maxFrac).replace(/0+$/, "");
  return frac ? `${i}.${frac}` : i;
};

export const SECONDS = { minute: 60n, hour: 3600n, day: 86400n, week: 604800n } as const;
export type RateUnit = keyof typeof SECONDS;

/** "$20/hour" -> base units per second (floors; dust rounds down) */
export function ratePerSecond(amountPerUnit: string | number, unit: RateUnit): bigint {
  return parseUsdc(amountPerUnit) / SECONDS[unit];
}
