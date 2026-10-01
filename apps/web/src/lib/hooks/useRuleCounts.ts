"use client";

import { useMemo } from "react";
import { useMandates, usePolicies, useStreams } from "./useContracts";

/** Active-rule counts for nav badges. No per-second ticking, so the sidebar stays still. */
export function useRuleCounts() {
  const m = useMandates();
  const p = usePolicies();
  const s = useStreams();
  return useMemo(
    () => ({
      mandate: m.mine.filter((r) => r.data.status === 0).length,
      agent: p.mine.filter((r) => r.data.active && !r.data.revoked).length,
      stream: s.mine.filter((r) => !r.data.cancelled && r.data.withdrawn < r.data.maxAmount).length,
    }),
    [m.mine, p.mine, s.mine],
  );
}
