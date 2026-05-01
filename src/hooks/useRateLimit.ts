import { useEffect, useState } from "react";
import { getRateLimit, onRateLimit, type RateLimit } from "@/lib/github";

export function useRateLimit(): RateLimit | null {
  const [rl, setRl] = useState<RateLimit | null>(getRateLimit());
  useEffect(() => onRateLimit(setRl), []);
  return rl;
}
