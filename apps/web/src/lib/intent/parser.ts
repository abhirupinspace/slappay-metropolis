import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { parseIntentFallback } from "./fallback";
import { ParseResultSchema, type ParseResult } from "./schema";

const SYSTEM = `You convert a user's plain-English payment instruction into a structured Slappay intent.
Slappay has four primitives, all settled in USDC on Monad:
- simple_payment: pay now.
- conditional_payment: escrow released when a condition holds. manual_approval = the sender approves; attestation = a named third party confirms; time = after a delay.
- agent_policy: a spending budget for an AI agent (daily cap, per-transaction cap, optional recipient allowlist).
- payment_stream: continuous pay at a rate ("$20/hour") until a maximum total.
Rules: amounts are decimal USDC strings without symbols. Copy names and 0x addresses exactly as written.
If the text is not a payment instruction, return intent null with a one-line note. Do not invent amounts.`;

export const INTENT_MODEL = "claude-opus-5-5";

/** LLM parse with deterministic fallback. Never throws. */
export async function parseIntent(text: string): Promise<ParseResult & { source: "llm" | "fallback" }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ...parseIntentFallback(text), source: "fallback" };
  try {
    const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 20_000 });
    const res = await client.messages.parse({
      model: INTENT_MODEL,
      max_tokens: 2048,
      output_config: { effort: "low", format: zodOutputFormat(ParseResultSchema) },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: text }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("no structured output");
    return { ...res.parsed_output, source: "llm" };
  } catch (e) {
    console.warn("[slappay] llm parse failed, using fallback:", e instanceof Error ? e.message : e);
    return { ...parseIntentFallback(text), source: "fallback" };
  }
}
