import { useEffect, useState } from "react";
import { getRateLimit, onRateLimit, type RateLimits } from "@/lib/github";

export function useRateLimit(): RateLimits {
  const [rl, setRl] = useState<RateLimits>(getRateLimit());
  useEffect(() => onRateLimit(setRl), []);
  return rl;
}
