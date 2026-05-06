import { cacheGet, cacheSet, isFresh, type CacheEntry } from "./cache";
const API = "https://api.github.com";

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  pushed_at: string;
  updated_at: string;
  created_at: string;
  default_branch: string;
  homepage?: string | null;
}

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
  created_at: string;
}

export interface Release {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface SearchResponse {
  total_count: number;
  items: Repo[];
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimits {
  search: RateLimit | null;
  core: RateLimit | null;
}

const lastRateLimits: RateLimits = { search: null, core: null };
const rateListeners = new Set<(r: RateLimits) => void>();

export function getRateLimit(): RateLimits {
  return { ...lastRateLimits };
}
export function onRateLimit(cb: (r: RateLimits) => void): () => void {
  rateListeners.add(cb);
  return () => rateListeners.delete(cb);
}
function setRateLimit(headers: Headers, url: string): void {
  const limit = Number(headers.get("x-ratelimit-limit"));
  const remaining = Number(headers.get("x-ratelimit-remaining"));
  const reset = Number(headers.get("x-ratelimit-reset"));
  const resource = headers.get("x-ratelimit-resource") || (url.includes("/search/") ? "search" : "core");
  
  if (!isNaN(limit) && limit > 0) {
    if (resource === "search") {
      lastRateLimits.search = { limit, remaining, reset };
    } else {
      lastRateLimits.core = { limit, remaining, reset };
    }
    rateListeners.forEach((cb) => cb({ ...lastRateLimits }));
  }
}

const TOKEN_KEY = "ghfrog:token";
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

interface FetchOpts {
  ttlMs: number;
  bypassCache?: boolean;
}

async function ghFetch<T>(path: string, opts: FetchOpts): Promise<T> {
  const url = path.startsWith("http") ? path : API + path;
  const cached = cacheGet<T>(url);

  if (!opts.bypassCache && cached && isFresh(cached)) {
    return cached.data;
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cached?.etag) headers["If-None-Match"] = cached.etag;

  const res = await fetch(url, { headers });
  setRateLimit(res.headers, url);

  if (res.status === 304 && cached) {
    const refreshed: CacheEntry<T> = { ...cached, fetchedAt: Date.now() };
    cacheSet(url, refreshed);
    return cached.data;
  }

  if (!res.ok) {
    if (cached) return cached.data; // graceful fallback (e.g. rate-limited)
    const text = await res.text().catch(() => "");
    
    if (res.status === 403 && text.includes("API rate limit exceeded")) {
      throw new Error("GitHub API rate limit exceeded. Please try again later or add a Personal Access Token in settings to increase your limit.");
    }

    let errorMsg = text || res.statusText;
    try {
      const json = JSON.parse(text);
      if (json.message) errorMsg = json.message;
    } catch {
      // Ignore parse error, use raw text
    }

    throw new Error(`GitHub API ${res.status}: ${errorMsg}`);
  }

  const data = (await res.json()) as T;
  cacheSet<T>(url, {
    data,
    etag: res.headers.get("etag") ?? undefined,
    fetchedAt: Date.now(),
    ttlMs: opts.ttlMs,
  });
  return data;
}

// ---- Public helpers ----

export async function searchRepos(params: {
  q: string;
  sort?: "stars" | "updated" | "forks" | "";
  order?: "desc" | "asc";
  perPage?: number;
  page?: number;
}): Promise<SearchResponse> {
  const sp = new URLSearchParams();
  sp.set("q", params.q);
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  sp.set("per_page", String(params.perPage ?? 30));
  sp.set("page", String(params.page ?? 1));
  return ghFetch<SearchResponse>(`/search/repositories?${sp}`, { ttlMs: 10 * 60_000 });
}

export async function getRepo(owner: string, repo: string, bypassCache = false): Promise<Repo> {
  return ghFetch<Repo>(`/repos/${owner}/${repo}`, { ttlMs: 60 * 60_000, bypassCache });
}

export async function getReleases(owner: string, repo: string, bypassCache = false): Promise<Release[]> {
  return ghFetch<Release[]>(`/repos/${owner}/${repo}/releases?per_page=20`, {
    ttlMs: 30 * 60_000,
    bypassCache,
  });
}
