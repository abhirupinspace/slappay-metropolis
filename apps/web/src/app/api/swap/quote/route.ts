import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Proxies 0x Swap API quotes so the key stays server-side.
 * 0x covers Monad mainnet (chain 143); there is no testnet liquidity.
 */
const Q = z.object({ sellToken: z.string(), buyToken: z.string(), sellAmount: z.string().regex(/^\d+$/), taker: z.string(), chainId: z.coerce.number() });

export async function GET(req: Request) {
  const key = process.env.ZEROX_API_KEY;
  if (!key) return NextResponse.json({ error: "Swap quotes need ZEROX_API_KEY (0x.org) and Monad mainnet." }, { status: 501 });
  const q = Q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!q.success) return NextResponse.json({ error: "bad query" }, { status: 400 });
  const u = new URL("https://api.0x.org/swap/permit2/quote");
  for (const [k, v] of Object.entries(q.data)) u.searchParams.set(k, String(v));
  const r = await fetch(u, { headers: { "0x-api-key": key, "0x-version": "v2" } });
  return NextResponse.json(await r.json(), { status: r.status });
}
