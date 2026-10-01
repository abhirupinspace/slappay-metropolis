export * from "./chains";
export * from "./addresses";
export * from "./units";
export { PaymentMandateAbi } from "../abis/PaymentMandate";
export { SpendingPolicyAbi } from "../abis/SpendingPolicy";
export { PaymentStreamAbi } from "../abis/PaymentStream";
export { MockUSDCAbi } from "../abis/MockUSDC";
export { erc20Abi } from "viem";

export const ConditionType = { MANUAL_APPROVAL: 0, ATTESTATION: 1, TIME: 2 } as const;
export const MandateStatus = { ACTIVE: 0, RELEASED: 1, CANCELLED: 2 } as const;
