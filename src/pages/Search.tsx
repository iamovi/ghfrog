import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RepoCard } from "@/components/RepoCard";
import { searchRepos, type Repo } from "@/lib/github";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { PLATFORM_LABEL, type Platform } from "@/lib/os";
import { Helmet } from "react-helmet-async";

const LANGUAGES = [
  "", "JavaScript", "TypeScript", "Python", "Rust", "Go", "C++", "C", "C#",
  "Java", "Kotlin", "Swift", "Ruby", "PHP", "Shell",
];

const PLATFORMS: Platform[] = ["windows", "mac", "linux", "android"];
const PLATFORM_QUALIFIER: Record<Platform, string> = {
  windows: "windows OR exe OR msi",
  mac: "macos OR dmg OR darwin",
  linux: "linux OR appimage OR deb",
  android: "android OR apk",
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const language = params.get("lang") || "";
  const platform = (params.get("platform") || "") as Platform | "";
  const sort = (params.get("sort") || "stars") as "stars" | "updated";

  const [results, setResults] = useState<Repo[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { history, push, clear } = useSearchHistory();

  const fullQuery = useMemo(() => {
    let s = q.trim();
    if (language) s += ` language:${language}`;
    if (platform) s += ` ${PLATFORM_QUALIFIER[platform]} in:readme,description,topics`;
    return s.trim();
  }, [q, language, platform]);

  useEffect(() => {
    if (!fullQuery) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    searchRepos({ q: fullQuery, sort, order: "desc", perPage: 30 })
      .then((r) => {
        setResults(r.items);
        setTotal(r.total_count);
        push(q);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullQuery, sort]);

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{q ? `Search: ${q} - GHFrog` : "Search - GHFrog"}</title>
      </Helmet>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                Query
              </label>
              <input
                type="search"
                defaultValue={q}
                onBlur={(e) => update("q", e.target.value.trim())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value.trim());
                }}
                className="gh-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => update("lang", e.target.value)}
                className="gh-input"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l || "Any"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                Platform
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={platform === ""}
                    onChange={() => update("platform", "")}
                  />
                  Any
                </label>
                {PLATFORMS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={platform === p}
                      onChange={() => update("platform", p)}
                    />
                    {PLATFORM_LABEL[p]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                Sort by
              </label>
              <select
                value={sort}
                onChange={(e) => update("sort", e.target.value)}
                className="gh-input"
              >
                <option value="stars">Most stars</option>
                <option value="updated">Recently updated</option>
              </select>
            </div>

            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wide">Recent</span>
                  <button onClick={clear} className="text-xs underline">clear</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {history.map((h) => (
                    <button
                      key={h}
                      onClick={() => update("q", h)}
                      className="gh-chip"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section>
            <div className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
              <h1 className="text-xl font-bold">
                {q ? <>Results for <span className="font-mono">"{q}"</span></> : "Search"}
              </h1>
              {results && (
                <div className="text-sm text-muted-foreground">
                  {total.toLocaleString()} repos
                </div>
              )}
            </div>

            {!fullQuery && (
              <div className="gh-card p-6 text-sm text-muted-foreground">
                Enter a query to find apps with releases.
              </div>
            )}
            {error && <div className="gh-card p-4 text-sm text-destructive">{error}</div>}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="gh-card p-4 h-32 animate-pulse bg-muted" />
                ))}
              </div>
            )}
            {!loading && results && results.length === 0 && (
              <div className="gh-card p-6 text-sm">No results found.</div>
            )}
            {!loading && results && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r) => (
                  <RepoCard
                    key={r.id}
                    data={{
                      owner: r.owner.login,
                      repo: r.name,
                      name: r.name,
                      description: r.description,
                      stars: r.stargazers_count,
                      language: r.language,
                      pushedAt: r.pushed_at,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
