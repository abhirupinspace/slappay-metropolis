"use client";

import { useEffect, useState } from "react";

/** Unix seconds, ticking every `ms`. Keeps render pure. */
export function useNow(ms = 1000): bigint {
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));
  useEffect(() => {
    const t = setInterval(() => setNow(BigInt(Math.floor(Date.now() / 1000))), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
