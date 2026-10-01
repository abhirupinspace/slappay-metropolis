import { isAddress, type Address } from "viem";
import { parseUsdc, ratePerSecond } from "@slappay/core";
import type { Intent } from "./schema";

/** Resolved intent: every party is an address, every amount is base units. Ready to sign. */
export type ResolvedIntent =
  | { type: "simple_payment"; recipient: Address; amount: bigint; memo: string }
  | {
      type: "conditional_payment";
      recipient: Address;
      amount: bigint;
      conditionType: 0 | 1 | 2;
      verifier: Address;
      releaseAfter: bigint;
      expiry: bigint;
      memo: string;
    }
  | {
      type: "agent_policy";
      name: string;
      agent: Address;
      txLimit: bigint;
      dailyLimit: bigint;
      recipients: Address[];
      allowAnyRecipient: boolean;
      initialDeposit: bigint;
    }
  | { type: "payment_stream"; recipient: Address; ratePerSecond: bigint; maxAmount: bigint; memo: string };

export type Resolution = { ok: true; intent: ResolvedIntent } | { ok: false; errors: string[] };

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Turns a parsed intent into contract-ready values. `resolve` maps names -> addresses
 * (filled by the user in the preview UI). Returns errors instead of throwing.
 */
export function resolveIntent(
  intent: Intent,
  resolve: Record<string, string>,
  me: Address | undefined,
  now = Math.floor(Date.now() / 1000),
): Resolution {
  const errors: string[] = [];
  const addr = (label: string, raw: string | undefined, required = true): Address => {
    const v = raw && isAddress(raw) ? raw : resolve[raw ?? ""];
    if (!v || !isAddress(v)) {
      if (required) errors.push(`${label}: need a 0x address for "${raw ?? "(missing)"}"`);
      return ZERO;
    }
    if (me && v.toLowerCase() === me.toLowerCase()) errors.push(`${label}: cannot be your own wallet`);
    return v;
  };
  const money = (label: string, raw: string): bigint => {
    try {
      const v = parseUsdc(raw);
      if (v <= 0n) errors.push(`${label}: must be > 0`);
      return v;
    } catch {
      errors.push(`${label}: invalid amount "${raw}"`);
      return 0n;
    }
  };

  let out: ResolvedIntent | undefined;
  switch (intent.type) {
    case "simple_payment":
      out = { type: "simple_payment", recipient: addr("Recipient", intent.recipient), amount: money("Amount", intent.amount), memo: intent.memo };
      break;
    case "conditional_payment": {
      const c = intent.condition;
      const expiry = BigInt(now + intent.expiryDays * 86400);
      let conditionType: 0 | 1 | 2 = 0;
      let verifier = ZERO;
      let releaseAfter = 0n;
      if (c.type === "attestation") {
        conditionType = 1;
        verifier = addr("Verifier", c.verifier);
      } else if (c.type === "time") {
        conditionType = 2;
        releaseAfter = BigInt(now + c.releaseAfterSeconds);
        if (releaseAfter >= expiry) errors.push("Release time must be before expiry");
      }
      out = { type: "conditional_payment", recipient: addr("Recipient", intent.recipient), amount: money("Amount", intent.amount), conditionType, verifier, releaseAfter, expiry, memo: intent.memo || c.type === "time" ? intent.memo : (c as { description: string }).description };
      break;
    }
    case "agent_policy": {
      const txLimit = money("Per-transaction limit", intent.transactionLimit);
      const dailyLimit = money("Daily limit", intent.dailyLimit);
      if (txLimit > dailyLimit) errors.push("Per-transaction limit cannot exceed daily limit");
      const recipients = intent.allowedRecipients.map((r) => addr(`Allowed recipient`, r));
      if (!intent.allowAnyRecipient && recipients.length === 0) errors.push("Add at least one allowed recipient, or allow any recipient");
      out = {
        type: "agent_policy",
        name: intent.agentName,
        agent: addr("Agent wallet", intent.agent),
        txLimit,
        dailyLimit,
        recipients,
        allowAnyRecipient: intent.allowAnyRecipient,
        initialDeposit: intent.initialDeposit ? money("Initial deposit", intent.initialDeposit) : dailyLimit * 7n,
      };
      break;
    }
    case "payment_stream": {
      const rate = ratePerSecond(intent.ratePerUnit, intent.unit);
      const maxAmount = money("Maximum", intent.maxAmount);
      if (rate === 0n) errors.push("Rate too small (rounds to 0 per second)");
      if (maxAmount < rate) errors.push("Maximum must cover at least one second");
      out = { type: "payment_stream", recipient: addr("Recipient", intent.recipient), ratePerSecond: rate, maxAmount, memo: intent.memo };
      break;
    }
  }
  return errors.length || !out ? { ok: false, errors } : { ok: true, intent: out };
}

/** Names in the intent that still need an address. */
export function unresolvedNames(intent: Intent): string[] {
  const names: string[] = [];
  const push = (s?: string) => { if (s && !isAddress(s) && !names.includes(s)) names.push(s); };
  if ("recipient" in intent) push(intent.recipient);
  if (intent.type === "conditional_payment" && intent.condition.type === "attestation") push(intent.condition.verifier);
  if (intent.type === "agent_policy") {
    push(intent.agent ?? `${intent.agentName} wallet`);
    intent.allowedRecipients.forEach(push);
  }
  return names;
}
