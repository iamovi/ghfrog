import { useRateLimit } from "@/hooks/useRateLimit";
import { AlertCircle } from "lucide-react";

export function RateLimitBanner() {
  const rl = useRateLimit();
  
  const searchHit = rl.search && rl.search.remaining === 0;
  const coreHit = rl.core && rl.core.remaining === 0;
  
  if (!searchHit && !coreHit) return null;

  let apiType = "";
  if (searchHit && coreHit) apiType = "Search and Core API";
  else if (searchHit) apiType = "Search API";
  else if (coreHit) apiType = "Core API";

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 z-50 relative text-center">
      <AlertCircle size={16} className="shrink-0" />
      <span>
        GitHub {apiType} rate limit exceeded. Please sign in or add a Personal Access Token via the profile menu.
      </span>
    </div>
  );
}
