import { NextResponse } from "next/server";
import { isAddress, parseUnits } from "viem";
import { paymentRequired, paymentResponseHeader, requirementsFor, verifyPayment } from "@/lib/x402/server";

/**
 * Demo paid API: 0.01 USDC per call. Any x402-aware agent gets a 402 with the price;
 * a Slappay agent pays through its SpendingPolicy and retries with proof.
 */
const PRICE = parseUnits("0.01", 6);

export async function GET(req: Request) {
  const payTo = process.env.X402_PAY_TO;
  if (!payTo || !isAddress(payTo)) return NextResponse.json({ error: "X402_PAY_TO not configured" }, { status: 500 });
  const url = new URL(req.url);
  const resource = `${url.origin}${url.pathname}`;
  const requirements = requirementsFor(resource, PRICE, payTo);

  const result = await verifyPayment(req.headers.get("PAYMENT-SIGNATURE"), requirements);
  if (!result.ok) return paymentRequired(resource, requirements, req.headers.get("PAYMENT-SIGNATURE") ? result.reason : undefined);

  const city = url.searchParams.get("city") ?? "Monad City";
  return NextResponse.json(
    { city, tempC: 21 + (city.length % 7), forecast: "Clear with a chance of parallel execution", paidBy: result.payer, settledTx: result.txHash },
    { headers: { "PAYMENT-RESPONSE": paymentResponseHeader(result.txHash, result.payer) } },
  );
}
