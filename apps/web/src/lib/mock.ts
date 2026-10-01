/** Placeholder data shaped like the onchain reads. Swap each for a hook during integration. */

export type Account = { address: `0x${string}`; usdc: number; mon: number; committed: number };

export type SmartAccount =
  | { kind: "agent"; id: number; name: string; perTx: number; perDay: number; spentToday: number; balance: number; status: "active" | "paused" | "revoked" }
  | { kind: "stream"; id: number; name: string; perHour: number; accrued: number; max: number; role: "sender" | "recipient"; status: "streaming" | "complete" | "cancelled" }
  | { kind: "mandate"; id: number; name: string; amount: number; condition: string; role: "sender" | "recipient"; status: "active" | "released" | "cancelled" };

export type Activity = {
  id: string;
  title: string;
  subtitle: string;
  amount: number; // + in, - out
  icon: "bot" | "stream" | "lock" | "send" | "request";
  pending?: boolean;
};

export const mockAccount: Account = {
  address: "0xaef818244ad9dc036Db132ca8befBd6679F49e97",
  usdc: 4281.42,
  mon: 3.2,
  committed: 1320,
};

export const mockSmartAccounts: SmartAccount[] = [
  { kind: "agent", id: 1, name: "Research Agent", perTx: 2, perDay: 20, spentToday: 8.42, balance: 91.58, status: "active" },
  { kind: "agent", id: 2, name: "TravelBot", perTx: 10, perDay: 50, spentToday: 0, balance: 100, status: "paused" },
  { kind: "stream", id: 1, name: "Developer", perHour: 20, accrued: 36.4, max: 200, role: "sender", status: "streaming" },
  { kind: "stream", id: 2, name: "Design retainer", perHour: 12.5, accrued: 100, max: 100, role: "recipient", status: "complete" },
  { kind: "mandate", id: 1, name: "Website milestone", amount: 500, condition: "You approve", role: "sender", status: "active" },
  { kind: "mandate", id: 2, name: "Logo delivery", amount: 150, condition: "After Oct 9", role: "recipient", status: "active" },
];

export const mockActivity: Activity[] = [
  { id: "a1", title: "Website milestone", subtitle: "Mandate · awaiting your approval", amount: -500, icon: "lock", pending: true },
  { id: "a2", title: "Research Agent → weather API", subtitle: "Today, 09:00 · x402", amount: -0.01, icon: "bot" },
  { id: "a3", title: "Developer stream", subtitle: "Yesterday, 2:30 PM · withdrawn", amount: -36.4, icon: "stream" },
  { id: "a4", title: "Design retainer", subtitle: "Oct 1 · stream complete", amount: 100, icon: "stream" },
  { id: "a5", title: "Received from 0x3C44…93BC", subtitle: "Sep 30", amount: 1500, icon: "request" },
];

export const mockSpendingToday = { spent: 8.42, limit: 20, byAgent: [{ name: "Research Agent", amount: 8.42 }, { name: "TravelBot", amount: 0 }] };
export const mockEarning = { total: 136.4, deltaPct: 18, streams: [{ name: "Developer", accrued: 36.4, max: 200 }, { name: "Design retainer", accrued: 100, max: 100 }] };
