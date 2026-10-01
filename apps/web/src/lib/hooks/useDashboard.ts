"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { short, ts } from "../format";
import type { Activity, SmartAccount } from "../types";
import { useMandates, usePolicies, useStreams, type Stream } from "./useContracts";
import { useNow } from "./useNow";

const n = (v: bigint) => Number(formatUsdc(v, 6));

/** Mirrors PaymentStream.accrued() so the UI ticks without an RPC call per second. */
export function streamAccrued(s: Stream, now: bigint): bigint {
  if (s.cancelled) return s.withdrawn;
  if (now <= s.startTime) return 0n;
  const amt = (now - s.startTime) * s.ratePerSecond;
  return amt > s.maxAmount ? s.maxAmount : amt;
}

/** Everything the overview needs, derived from chain state the app already scans. */
export function useDashboard() {
  const { address } = useAccount();
  const now = useNow(1000);
  const mandates = useMandates();
  const policies = usePolicies();
  const streams = useStreams();
  const me = address?.toLowerCase();
  const isMe = (a: string) => a.toLowerCase() === me;

  return useMemo(() => {
    const accounts: SmartAccount[] = [];
    const activity: Activity[] = [];
    let committed = 0n;

    for (const { id, data: p } of policies.mine) {
      const status = p.revoked ? "revoked" : p.active ? "active" : "paused";
      accounts.push({ kind: "agent", id, name: p.name || `Agent #${id}`, perTx: n(p.txLimit), perDay: n(p.dailyLimit), spentToday: n(p.spentToday), balance: n(p.balance), status });
      if (isMe(p.owner) && !p.revoked) committed += p.balance;
      if (p.spentToday > 0n) activity.push({ id: `policy-${id}-spent`, title: `${p.name || "Agent"} spent today`, subtitle: `Policy #${id} · ${formatUsdc(p.dailyLimit - p.spentToday)} USDC left today`, amount: -n(p.spentToday), icon: "bot" });
      activity.push({ id: `policy-${id}`, title: `${p.name || "Agent"} policy ${status}`, subtitle: `#${id} · ${formatUsdc(p.txLimit)}/tx · ${formatUsdc(p.dailyLimit)}/day · agent ${short(p.agent)}`, amount: isMe(p.owner) ? -n(p.balance) : n(p.balance), icon: "bot" });
    }

    for (const { id, data: s } of streams.mine) {
      const acc = streamAccrued(s, now);
      const role = isMe(s.sender) ? "sender" : "recipient";
      const status = s.cancelled ? "cancelled" : acc >= s.maxAmount && s.withdrawn >= s.maxAmount ? "complete" : "streaming";
      accounts.push({ kind: "stream", id, name: s.memo || (role === "sender" ? `To ${short(s.recipient)}` : `From ${short(s.sender)}`), perHour: n(s.ratePerSecond * 3600n), accrued: n(acc), max: n(s.maxAmount), role, status });
      if (role === "sender" && !s.cancelled) committed += s.maxAmount - acc;
      activity.push({ id: `stream-${id}`, title: s.memo || `Stream #${id}`, subtitle: `${role === "sender" ? "to" : "from"} ${short(role === "sender" ? s.recipient : s.sender)} · ${formatUsdc(s.ratePerSecond * 3600n, 4)} USDC/h · started ${ts(s.startTime)}`, amount: role === "sender" ? -n(s.maxAmount) : n(s.withdrawn), icon: "stream" });
    }

    for (const { id, data: m } of mandates.mine) {
      const role = isMe(m.sender) ? "sender" : "recipient";
      const status = (["active", "released", "cancelled"] as const)[m.status];
      const condition = m.conditionType === 0 ? "You approve" : m.conditionType === 1 ? `${short(m.verifier)} approves` : `After ${ts(m.releaseAfter)}`;
      accounts.push({ kind: "mandate", id, name: m.memo || `Mandate #${id}`, amount: n(m.amount), condition: role === "sender" ? condition : condition.replace("You approve", "Sender approves"), role, status });
      if (role === "sender" && m.status === 0) committed += m.amount;
      const canApprove = m.status === 0 && ((m.conditionType === 0 && isMe(m.sender)) || (m.conditionType === 1 && isMe(m.verifier)));
      activity.push({
        id: `mandate-${id}`,
        title: m.memo || `Mandate #${id}`,
        subtitle: canApprove ? "Mandate · awaiting your approval" : `${role === "sender" ? "to" : "from"} ${short(role === "sender" ? m.recipient : m.sender)} · ${status} · ${condition}`,
        amount: role === "sender" ? -n(m.amount) : n(m.amount),
        icon: "lock",
        pending: canApprove,
        mandateId: canApprove ? id : undefined,
      });
    }

    activity.sort((a, b) => Number(b.pending ?? false) - Number(a.pending ?? false));

    const myPolicies = policies.mine.filter((p) => isMe(p.data.owner) && !p.data.revoked);
    const spending = {
      spent: n(myPolicies.reduce((a, p) => a + p.data.spentToday, 0n)),
      limit: n(myPolicies.reduce((a, p) => a + p.data.dailyLimit, 0n)),
      byAgent: myPolicies.map((p) => ({ name: p.data.name || `Agent #${p.id}`, amount: n(p.data.spentToday) })),
    };

    const incoming = streams.mine.filter((s) => isMe(s.data.recipient));
    const earning = {
      total: n(incoming.reduce((a, s) => a + streamAccrued(s.data, now), 0n)),
      withdrawable: n(incoming.reduce((a, s) => a + streamAccrued(s.data, now) - s.data.withdrawn, 0n)),
      streams: incoming.map((s) => ({ name: s.data.memo || `From ${short(s.data.sender)}`, accrued: n(streamAccrued(s.data, now)), max: n(s.data.maxAmount) })),
    };

    const counts = {
      agent: accounts.filter((a) => a.kind === "agent" && a.status === "active").length,
      stream: accounts.filter((a) => a.kind === "stream" && a.status === "streaming").length,
      mandate: accounts.filter((a) => a.kind === "mandate" && a.status === "active").length,
    };

    return { accounts, activity, committed: n(committed), spending, earning, counts, isLoading: mandates.isLoading || policies.isLoading || streams.isLoading };
  }, [mandates.mine, policies.mine, streams.mine, now, me, mandates.isLoading, policies.isLoading, streams.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps
}
