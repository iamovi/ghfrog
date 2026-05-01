// localStorage cache with TTL + ETag support
const PREFIX = "ghfrog:cache:";
const MAX_BYTES = 4 * 1024 * 1024;

export interface CacheEntry<T = unknown> {
  data: T;
  etag?: string;
  fetchedAt: number;
  ttlMs: number;
}

export function cacheGet<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    evict();
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
  enforceSize();
}

export function isFresh(entry: CacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < entry.ttlMs;
}

function totalBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      total += (localStorage.getItem(k)?.length ?? 0) + k.length;
    }
  }
  return total * 2; // UTF-16
}

function evict(): void {
  // Drop oldest 25% of cache entries
  const entries: { key: string; fetchedAt: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try {
        const e = JSON.parse(localStorage.getItem(k)!);
        entries.push({ key: k, fetchedAt: e.fetchedAt ?? 0 });
      } catch {
        localStorage.removeItem(k);
      }
    }
  }
  entries.sort((a, b) => a.fetchedAt - b.fetchedAt);
  const drop = Math.max(1, Math.floor(entries.length / 4));
  for (let i = 0; i < drop; i++) localStorage.removeItem(entries[i].key);
}

function enforceSize(): void {
  if (totalBytes() > MAX_BYTES) evict();
}

export function clearCache(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
