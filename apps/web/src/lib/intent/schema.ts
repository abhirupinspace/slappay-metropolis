import { z } from "zod";

/**
 * Structured payment intent. Amounts are decimal USDC strings ("500", "2.50").
 * Recipients may be a 0x address or a plain name the user must resolve before signing.
 */
const amount = z.string().regex(/^\d+(\.\d{1,6})?$/, "amount must be a decimal USDC string");
const recipient = z.string().min(1).describe("0x address if given, otherwise the name as written");

export const ConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("manual_approval"), description: z.string().describe("what the sender will approve") }),
  z.object({
    type: z.literal("attestation"),
    verifier: z.string().describe("0x address or name of the party who confirms"),
    description: z.string(),
  }),
  z.object({ type: z.literal("time"), releaseAfterSeconds: z.number().int().positive().describe("seconds from now") }),
]);

export const IntentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("simple_payment"),
    recipient,
    amount,
    memo: z.string().default(""),
  }),
  z.object({
    type: z.literal("conditional_payment"),
    recipient,
    amount,
    condition: ConditionSchema,
    expiryDays: z.number().int().positive().max(365).default(30),
    memo: z.string().default(""),
  }),
  z.object({
    type: z.literal("agent_policy"),
    agentName: z.string().default("Agent"),
    agent: z.string().optional().describe("0x address of the agent wallet if given"),
    dailyLimit: amount,
    transactionLimit: amount,
    allowedRecipients: z.array(z.string()).default([]),
    allowAnyRecipient: z.boolean().default(false),
    initialDeposit: amount.optional().describe("how much to fund now; default dailyLimit*7 if absent"),
  }),
  z.object({
    type: z.literal("payment_stream"),
    recipient,
    ratePerUnit: amount,
    unit: z.enum(["minute", "hour", "day", "week"]),
    maxAmount: amount,
    memo: z.string().default(""),
  }),
]);

export type Intent = z.infer<typeof IntentSchema>;
export type IntentType = Intent["type"];

export const ParseResultSchema = z.object({
  intent: IntentSchema.nullable(),
  /** Short reason when intent is null or when key info was assumed. */
  note: z.string().default(""),
});
export type ParseResult = z.infer<typeof ParseResultSchema>;
