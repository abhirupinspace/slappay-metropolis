/** View models for dashboard cards. Produced by useDashboard from onchain reads. */

export type SmartAccount =
  | { kind: "agent"; id: bigint; name: string; perTx: number; perDay: number; spentToday: number; balance: number; status: "active" | "paused" | "revoked" }
  | { kind: "stream"; id: bigint; name: string; perHour: number; accrued: number; max: number; role: "sender" | "recipient"; status: "streaming" | "complete" | "cancelled" }
  | { kind: "mandate"; id: bigint; name: string; amount: number; condition: string; role: "sender" | "recipient"; status: "active" | "released" | "cancelled" };

export type Activity = {
  id: string;
  title: string;
  subtitle: string;
  amount: number; // + in, - out
  icon: "bot" | "stream" | "lock" | "send" | "request";
  pending?: boolean;
  /** For pending rows: the mandate id to approve/decline. */
  mandateId?: bigint;
};
