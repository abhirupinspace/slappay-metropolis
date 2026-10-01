import { createPublicClient, http, parseEventLogs, type Address, type Hash } from "viem";
import { SpendingPolicyAbi } from "@slappay/core";
import { config } from "../config";
import { log } from "../log";

/**
 * x402 v2 envelope (PAYMENT-REQUIRED / PAYMENT-SIGNATURE / PAYMENT-RESPONSE, base64 JSON, CAIP-2 networks)
 * with a Slappay settlement scheme: the agent pays via SpendingPolicy.spend() and presents the tx hash.
 * The policy contract, not this server, enforces the agent's limits.
 */
export const SCHEME = "slappay-policy";
export const NETWORK = `eip155:${config.chainId}`;

export type Requirements = {
  scheme: typeof SCHEME;
  network: string;
  amount: string; // atomic units
  asset: Address;
  payTo: Address;
  maxTimeoutSeconds: number;
  extra: { spendingPolicy: Address; memo: string };
};

export type PaymentPayload = {
  x402Version: 2;
  resource: { url: string };
  accepted: Requirements;
  payload: { policyId: string; txHash: Hash };
};

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64");
const unb64 = <T>(s: string): T | null => {
  try {
    return JSON.parse(Buffer.from(s, "base64").toString("utf8")) as T;
  } catch {
    return null;
  }
};

export function requirementsFor(resourceUrl: string, amount: bigint, payTo: Address): Requirements {
  return {
    scheme: SCHEME,
    network: NETWORK,
    amount: amount.toString(),
    asset: config.usdc,
    payTo,
    maxTimeoutSeconds: 300,
    extra: { spendingPolicy: config.deployment.spendingPolicy, memo: resourceUrl },
  };
}

export function paymentRequired(resourceUrl: string, req: Requirements, error?: string): Response {
  const body = { x402Version: 2, error: error ?? "Payment required", resource: { url: resourceUrl }, accepts: [req] };
  log("x402_challenge", { resource: resourceUrl, amount: req.amount, error });
  return new Response(JSON.stringify(body), {
    status: 402,
    headers: { "content-type": "application/json", "PAYMENT-REQUIRED": b64(body) },
  });
}

// Replay guard. In-memory is fine for a demo; a shared store would be needed across instances.
const used = new Set<string>();

const client = createPublicClient({ chain: config.chain, transport: http(config.rpcUrl) });

/** Verifies an AgentSpent event on Monad matches the requirements. Returns the payer or an error string. */
export async function verifyPayment(header: string | null, req: Requirements): Promise<{ ok: true; payer: Address; txHash: Hash } | { ok: false; reason: string }> {
  if (!header) return { ok: false, reason: "missing PAYMENT-SIGNATURE" };
  const p = unb64<PaymentPayload>(header);
  if (!p || p.x402Version !== 2 || p.accepted?.scheme !== SCHEME) return { ok: false, reason: "bad payload" };
  const { txHash, policyId } = p.payload ?? {};
  if (!txHash || !policyId) return { ok: false, reason: "payload needs policyId and txHash" };
  if (used.has(txHash.toLowerCase())) return { ok: false, reason: "payment already used" };

  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt || receipt.status !== "success") return { ok: false, reason: "tx not found or reverted" };
  const logs = parseEventLogs({ abi: SpendingPolicyAbi, eventName: "AgentSpent", logs: receipt.logs });
  const hit = logs.find(
    (l) =>
      l.address.toLowerCase() === req.extra.spendingPolicy.toLowerCase() &&
      l.args.id === BigInt(policyId) &&
      l.args.recipient.toLowerCase() === req.payTo.toLowerCase() &&
      l.args.amount >= BigInt(req.amount) &&
      l.args.memo === req.extra.memo,
  );
  if (!hit) return { ok: false, reason: "no matching AgentSpent event (recipient/amount/memo)" };
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (Number(block.timestamp) < Date.now() / 1000 - req.maxTimeoutSeconds) return { ok: false, reason: "payment too old" };
  used.add(txHash.toLowerCase());
  log("x402_settled", { txHash, policyId, amount: req.amount });
  return { ok: true, payer: hit.args.agent, txHash };
}

export function paymentResponseHeader(txHash: Hash, payer: Address) {
  return b64({ success: true, transaction: txHash, network: NETWORK, payer });
}
