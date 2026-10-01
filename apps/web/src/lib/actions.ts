import { erc20Abi } from "viem";
import { PaymentMandateAbi, PaymentStreamAbi, SpendingPolicyAbi } from "@slappay/core";
import { config } from "./config";
import type { TxRequest } from "./hooks/useTx";
import type { ResolvedIntent } from "./intent/validator";

/** Which contract escrows funds for this intent, and how much it needs approved. */
export function spendTarget(intent: ResolvedIntent): { spender: `0x${string}`; amount: bigint } | null {
  const d = config.deployment;
  switch (intent.type) {
    case "simple_payment":
      return null;
    case "conditional_payment":
      return { spender: d.paymentMandate, amount: intent.amount };
    case "agent_policy":
      return intent.initialDeposit > 0n ? { spender: d.spendingPolicy, amount: intent.initialDeposit } : null;
    case "payment_stream":
      return { spender: d.paymentStream, amount: intent.maxAmount };
  }
}

/** Build the write(s) for a resolved intent. Prepends an approve when allowance is short. */
export function buildSteps(intent: ResolvedIntent, allowance: bigint): TxRequest[] {
  const d = config.deployment;
  const steps: TxRequest[] = [];
  const target = spendTarget(intent);
  if (target && allowance < target.amount) {
    steps.push({ address: config.usdc, abi: erc20Abi, functionName: "approve", args: [target.spender, target.amount] });
  }
  switch (intent.type) {
    case "simple_payment":
      steps.push({ address: config.usdc, abi: erc20Abi, functionName: "transfer", args: [intent.recipient, intent.amount] });
      break;
    case "conditional_payment":
      steps.push({
        address: d.paymentMandate,
        abi: PaymentMandateAbi,
        functionName: "create",
        args: [intent.recipient, config.usdc, intent.amount, intent.conditionType, intent.verifier, intent.releaseAfter, intent.expiry, intent.memo],
      });
      break;
    case "agent_policy":
      steps.push({
        address: d.spendingPolicy,
        abi: SpendingPolicyAbi,
        functionName: "create",
        args: [intent.agent, config.usdc, intent.txLimit, intent.dailyLimit, intent.recipients, intent.allowAnyRecipient, intent.initialDeposit, intent.name],
      });
      break;
    case "payment_stream":
      steps.push({
        address: d.paymentStream,
        abi: PaymentStreamAbi,
        functionName: "create",
        args: [intent.recipient, config.usdc, intent.ratePerSecond, 0n, intent.maxAmount, intent.memo],
      });
      break;
  }
  return steps;
}

export const mandateCall = (fn: "approve" | "release" | "cancel", id: bigint): TxRequest => ({
  address: config.deployment.paymentMandate, abi: PaymentMandateAbi, functionName: fn, args: [id],
});
export const policyCall = (fn: "pause" | "resume" | "revoke", id: bigint): TxRequest => ({
  address: config.deployment.spendingPolicy, abi: SpendingPolicyAbi, functionName: fn, args: [id],
});
export const streamCall = (fn: "withdraw" | "cancel", id: bigint): TxRequest => ({
  address: config.deployment.paymentStream, abi: PaymentStreamAbi, functionName: fn, args: [id],
});
