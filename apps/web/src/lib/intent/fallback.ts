import type { Intent, ParseResult } from "./schema";

/**
 * Deterministic regex parser for the demo phrasings. Used when no LLM key is set
 * or the LLM call fails. Covers: simple pay, "when/once/after X" conditionals,
 * agent budgets, and "$X/hour until $Y" streams.
 */
const AMT = String.raw`\$?\s*(\d+(?:\.\d{1,6})?)\s*(?:usdc|dollars|bucks|usd)?`;
const WHO = String.raw`(0x[a-fA-F0-9]{40}|[A-Z][\w'-]*(?:\s+[A-Z][\w'-]*)?|my\s+\w+)`;
const UNIT = String.raw`(min(?:ute)?|hr|hour|day|week)s?`;

const unitMap: Record<string, "minute" | "hour" | "day" | "week"> = {
  min: "minute", minute: "minute", hr: "hour", hour: "hour", day: "day", week: "week",
};

export function parseIntentFallback(text: string): ParseResult {
  const t = text.trim().replace(/\s+/g, " ").replace(/(\d),(\d{3})/g, "$1$2");
  const intent = tryStream(t) ?? tryAgent(t) ?? tryConditional(t) ?? trySimple(t);
  return intent ? { intent, note: "parsed offline" } : { intent: null, note: "Could not understand that. Try one of the examples." };
}

function tryStream(t: string): Intent | undefined {
  const m = t.match(new RegExp(String.raw`^(?:pay|stream|send)\s+${WHO}\s+${AMT}\s*(?:\/|per|an?|every)\s*${UNIT}(?:.*?(?:until|up to|max(?:imum)?(?: of)?|cap(?:ped at)?)\s+${AMT})?`, "i"));
  if (!m) return;
  const [, who, rate, unit, max] = m;
  if (!max) return; // fully-funded streams need a cap
  return { type: "payment_stream", recipient: who, ratePerUnit: rate, unit: unitMap[unit.toLowerCase()], maxAmount: max, memo: "" };
}

function tryAgent(t: string): Intent | undefined {
  if (!/\b(agent|bot)\b/i.test(t)) return;
  const daily = t.match(new RegExp(String.raw`${AMT}\s*(?:\/|per|a|every)\s*day`, "i"))?.[1];
  const perTx = t.match(new RegExp(String.raw`(?:max(?:imum)?|up to|limit(?: of)?)\s+${AMT}\s*(?:\/|per|a|each)\s*(?:tx|transaction|call|payment|request)`, "i"))?.[1]
    ?? t.match(new RegExp(String.raw`${AMT}\s*(?:\/|per|a|each)\s*(?:tx|transaction|call|payment|request)`, "i"))?.[1];
  if (!daily) return;
  const name = t.match(/(?:my|the)\s+([\w-]+(?:\s+(?:agent|bot))?)/i)?.[1] ?? "Agent";
  const agent = t.match(/0x[a-fA-F0-9]{40}/)?.[0];
  return {
    type: "agent_policy",
    agentName: titleCase(name),
    agent,
    dailyLimit: daily,
    transactionLimit: perTx ?? daily,
    allowedRecipients: [],
    allowAnyRecipient: !/\b(only|allowed|approved|whitelist)/i.test(t),
  };
}

function tryConditional(t: string): Intent | undefined {
  const m = t.match(new RegExp(String.raw`^(?:pay|send|give)\s+${WHO}\s+${AMT}\s+(?:when|once|after|if)\s+(.+)$`, "i"));
  if (!m) return;
  const [, who, amount, rest] = m;
  const time = rest.match(new RegExp(String.raw`^(\d+)\s*${UNIT}`, "i"));
  if (time) {
    const secs = { minute: 60, hour: 3600, day: 86400, week: 604800 }[unitMap[time[2].toLowerCase()]];
    return { type: "conditional_payment", recipient: who, amount, condition: { type: "time", releaseAfterSeconds: Number(time[1]) * secs }, expiryDays: 30, memo: rest };
  }
  const verifier = rest.match(new RegExp(String.raw`^${WHO}\s+(?:approves?|confirms?|signs? off|says)`, "i"));
  if (verifier && !/^(?:I|me)\b/i.test(verifier[1])) {
    return { type: "conditional_payment", recipient: who, amount, condition: { type: "attestation", verifier: verifier[1], description: rest }, expiryDays: 30, memo: rest };
  }
  return { type: "conditional_payment", recipient: who, amount, condition: { type: "manual_approval", description: rest }, expiryDays: 30, memo: rest };
}

function trySimple(t: string): Intent | undefined {
  const m = t.match(new RegExp(String.raw`^(?:pay|send|give|tip)\s+${WHO}\s+${AMT}(?:\s+for\s+(.+))?$`, "i"));
  if (!m) return;
  return { type: "simple_payment", recipient: m[1], amount: m[2], memo: m[3] ?? "" };
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
