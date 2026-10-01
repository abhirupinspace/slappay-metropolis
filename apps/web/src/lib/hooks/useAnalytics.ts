"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUsdc } from "@slappay/core";
import { useMandates, usePolicies, useStreams, type Stream } from "./useContracts";
import { streamAccrued } from "./useDashboard";
import { useNow } from "./useNow";

const n = (v: bigint) => Number(formatUsdc(v, 6));
const DAY = 86400n;

/** Accrual of a stream inside [a, b). */
function accrualBetween(s: Stream, a: bigint, b: bigint): bigint {
  const at = (t: bigint) => streamAccrued(s, t);
  return at(b) - at(a);
}

export function useAnalytics() {
  const { address } = useAccount();
  const now = useNow(15_000);
  const mandates = useMandates();
  const policies = usePolicies();
  const streams = useStreams();
  const me = address?.toLowerCase();
  const isMe = (a: string) => a.toLowerCase() === me;

  return useMemo(() => {
    const myPolicies = policies.mine.filter((p) => isMe(p.data.owner) && !p.data.revoked);
    const outStreams = streams.mine.filter((s) => isMe(s.data.sender));
    const inStreams = streams.mine.filter((s) => isMe(s.data.recipient));
    const outMandates = mandates.mine.filter((m) => isMe(m.data.sender));
    const inMandates = mandates.mine.filter((m) => isMe(m.data.recipient));

    // Committed capital by primitive
    const committed = {
      mandates: n(outMandates.filter((m) => m.data.status === 0).reduce((a, m) => a + m.data.amount, 0n)),
      policies: n(myPolicies.reduce((a, p) => a + p.data.balance, 0n)),
      streams: n(outStreams.filter((s) => !s.data.cancelled).reduce((a, s) => a + s.data.maxAmount - streamAccrued(s.data, now), 0n)),
    };

    // Agent budgets
    const agents = myPolicies.map((p) => ({ id: p.id, name: p.data.name || `Agent #${p.id}`, spent: n(p.data.spentToday), limit: n(p.data.dailyLimit), perTx: n(p.data.txLimit), balance: n(p.data.balance), active: p.data.active, runway: p.data.dailyLimit > 0n ? Number(p.data.balance / p.data.dailyLimit) : 0 }));

    // 7-day projection, day buckets from today 00:00 UTC
    const day0 = (now / DAY) * DAY;
    const days = Array.from({ length: 7 }, (_, i) => {
      const a = i === 0 ? now : day0 + BigInt(i) * DAY;
      const b = day0 + BigInt(i + 1) * DAY;
      let out = 0n;
      let inn = 0n;
      for (const s of outStreams) out += accrualBetween(s.data, a, b);
      for (const s of inStreams) inn += accrualBetween(s.data, a, b);
      for (const m of outMandates) if (m.data.status === 0 && m.data.conditionType === 2 && m.data.releaseAfter >= a && m.data.releaseAfter < b) out += m.data.amount;
      for (const m of inMandates) if (m.data.status === 0 && m.data.conditionType === 2 && m.data.releaseAfter >= a && m.data.releaseAfter < b) inn += m.data.amount;
      const date = new Date(Number(day0 + BigInt(i) * DAY) * 1000);
      return { label: i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }), out: n(out), in: n(inn) };
    });

    // Lifetime
    const lifetime = {
      receivedStreams: n(inStreams.reduce((a, s) => a + s.data.withdrawn, 0n)),
      paidStreams: n(outStreams.reduce((a, s) => a + streamAccrued(s.data, now), 0n)),
      receivedMandates: n(inMandates.filter((m) => m.data.status === 1).reduce((a, m) => a + m.data.amount, 0n)),
      releasedMandates: n(outMandates.filter((m) => m.data.status === 1).reduce((a, m) => a + m.data.amount, 0n)),
      agentSpentToday: n(myPolicies.reduce((a, p) => a + p.data.spentToday, 0n)),
      rulesCreated: outMandates.length + myPolicies.length + outStreams.length,
    };

    const mandateStatus = { active: 0, released: 0, cancelled: 0 };
    for (const m of mandates.mine) mandateStatus[(["active", "released", "cancelled"] as const)[m.data.status]]++;

    // Live rates
    const rates = {
      outPerHour: n(outStreams.filter((s) => !s.data.cancelled && streamAccrued(s.data, now) < s.data.maxAmount && now >= s.data.startTime).reduce((a, s) => a + s.data.ratePerSecond * 3600n, 0n)),
      inPerHour: n(inStreams.filter((s) => !s.data.cancelled && streamAccrued(s.data, now) < s.data.maxAmount && now >= s.data.startTime).reduce((a, s) => a + s.data.ratePerSecond * 3600n, 0n)),
    };

    return { committed, agents, days, lifetime, mandateStatus, rates, isLoading: mandates.isLoading || policies.isLoading || streams.isLoading };
  }, [mandates.mine, policies.mine, streams.mine, now, me, mandates.isLoading, policies.isLoading, streams.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps
}
