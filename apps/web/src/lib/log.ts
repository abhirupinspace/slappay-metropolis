type Event =
  | "intent_parsed"
  | "intent_validation_failed"
  | "transaction_started"
  | "transaction_confirmed"
  | "transaction_failed"
  | "mandate_created"
  | "mandate_released"
  | "agent_payment_attempted"
  | "agent_payment_rejected"
  | "stream_created"
  | "x402_challenge"
  | "x402_settled";

export function log(event: Event, data: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(`[slappay] ${event}`, JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}
