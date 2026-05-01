import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Star, Download, ExternalLink, RefreshCw, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getReadme, getReleases, getRepo, type Release, type Repo } from "@/lib/github";
import { detectOS, formatBytes, pickBestAsset, PLATFORM_LABEL, type Platform } from "@/lib/os";
import { useFavorites } from "@/hooks/useFavorites";
import { formatStars, timeAgo } from "@/lib/format";

type Tab = "readme" | "releases" | "assets" | "screenshots";

export default function AppDetail() {
  const { owner = "", repo = "" } = useParams();
  const [data, setData] = useState<Repo | null>(null);
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [readme, setReadme] = useState<{ markdown: string; path: string } | null>(null);
  const [tab, setTab] = useState<Tab>("readme");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const { isFav, toggle } = useFavorites();
  const os = useMemo(() => detectOS(), []);

  const load = (bypass = false) => {
    setError(null);
    Promise.all([
      getRepo(owner, repo, bypass),
      getReleases(owner, repo, bypass),
      getReadme(owner, repo, bypass),
    ])
      .then(([r, rel, rd]) => {
        setData(r);
        setReleases(rel);
        setReadme(rd);
      })
      .catch((e) => setError(e.message))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    setData(null);
    setReleases(null);
    setReadme(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo]);

  const latest = releases?.[0];
  const { best, byPlatform } = useMemo(
    () => (latest ? pickBestAsset(latest.assets, os) : { best: null, byPlatform: { windows: [], mac: [], linux: [], android: [] } as Record<Platform, never[]> }),
    [latest, os],
  );

  const screenshots = useMemo(() => {
    if (!readme) return [];
    const out: string[] = [];
    const re = /!\[[^\]]*\]\(([^)\s]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(readme.markdown)) !== null) out.push(m[1]);
    const re2 = /<img[^>]+src=["']([^"']+)/gi;
    while ((m = re2.exec(readme.markdown)) !== null) out.push(m[1]);
    return Array.from(new Set(out)).slice(0, 12).map((u) => rewriteImg(u, owner, repo, data?.default_branch || "main"));
  }, [readme, owner, repo, data?.default_branch]);

  const fav = isFav(owner, repo);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-sm mb-4">
          <Link to="/" className="underline">Home</Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-muted-foreground">{owner}/{repo}</span>
        </div>

        {error && <div className="gh-card p-4 text-sm text-destructive mb-4">{error}</div>}

        {!data ? (
          <div className="gh-card p-6 animate-pulse h-40 bg-muted" />
        ) : (
          <>
            <div className="gh-card p-5 mb-5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-muted-foreground">{owner}</div>
                  <h1 className="text-3xl font-extrabold leading-tight break-words">
                    <span className="mr-2" aria-hidden>🐸</span>{data.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    {data.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="gh-badge">★ {formatStars(data.stargazers_count)}</span>
                    {data.language && <span className="gh-badge">{data.language}</span>}
                    <span className="gh-badge">Updated {timeAgo(data.pushed_at)}</span>
                    {latest && <span className="gh-badge">Latest: {latest.tag_name}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() =>
                      toggle({
                        owner,
                        repo,
                        name: data.name,
                        description: data.description,
                        stars: data.stargazers_count,
                        language: data.language,
                      })
                    }
                    className="gh-btn"
                  >
                    <Star size={14} className={fav ? "fill-current" : ""} style={fav ? { color: "hsl(var(--frog))" } : undefined} />
                    {fav ? "Saved" : "Save"}
                  </button>
                  <a href={data.html_url} target="_blank" rel="noreferrer" className="gh-btn">
                    <ExternalLink size={14} /> GitHub
                  </a>
                  <button
                    onClick={() => {
                      setRefreshing(true);
                      load(true);
                    }}
                    className="gh-btn"
                    disabled={refreshing}
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
              </div>

              {latest && (
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-2">
                  {best ? (
                    <a
                      href={best.browser_download_url}
                      className="gh-btn-primary"
                      download
                    >
                      <Download size={14} />
                      Download for {os === "unknown" ? "your OS" : PLATFORM_LABEL[os as Platform]}
                      <span className="font-normal opacity-70">
                        ({formatBytes(best.size)})
                      </span>
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No matching binary for {os === "unknown" ? "your OS" : PLATFORM_LABEL[os as Platform]} in latest release.
                    </span>
                  )}
                  {latest.assets.length > 0 && (
                    <button
                      onClick={() => setShowAllAssets((v) => !v)}
                      className="gh-btn"
                    >
                      All downloads
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${showAllAssets ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              )}

              {showAllAssets && latest && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(["windows", "mac", "linux", "android"] as Platform[]).map((p) => (
                    <div key={p} className="border border-border rounded-[3px] p-3">
                      <div className="text-xs font-bold uppercase mb-2">{PLATFORM_LABEL[p]}</div>
                      {byPlatform[p].length === 0 ? (
                        <div className="text-xs text-muted-foreground">No assets</div>
                      ) : (
                        <ul className="space-y-1.5">
                          {byPlatform[p].map((a) => (
                            <li key={a.id}>
                              <a
                                href={a.browser_download_url}
                                className="text-xs underline break-all"
                                download
                              >
                                {a.name}
                              </a>
                              <div className="text-[11px] text-muted-foreground">
                                {formatBytes(a.size)} · {a.download_count.toLocaleString()} downloads
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex gap-1 mb-4 overflow-x-auto">
              {(
                [
                  ["readme", "README"],
                  ["releases", `Releases${releases ? ` (${releases.length})` : ""}`],
                  ["assets", "All assets"],
                  ["screenshots", `Screenshots${screenshots.length ? ` (${screenshots.length})` : ""}`],
                ] as Array<[Tab, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-3 py-2 text-sm font-semibold border border-border border-b-0 rounded-t-[3px] -mb-px ${
                    tab === key ? "bg-foreground text-background" : "bg-background hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "readme" && (
              <div className="gh-card p-5">
                {readme ? (
                  <div className="gh-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      urlTransform={(url) => rewriteImg(url, owner, repo, data.default_branch)}
                    >
                      {readme.markdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No README found.</p>
                )}
              </div>
            )}

            {tab === "releases" && (
              <div className="space-y-4">
                {releases && releases.length > 0 ? (
                  releases.map((r) => (
                    <div key={r.id} className="gh-card p-4">
                      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                        <h3 className="font-bold text-lg">
                          {r.name || r.tag_name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {r.tag_name}
                          </span>
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {timeAgo(r.published_at)}
                          {r.prerelease && <span className="gh-badge ml-2">prerelease</span>}
                        </div>
                      </div>
                      {r.body && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer underline">Release notes</summary>
                          <div className="gh-markdown mt-3">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              urlTransform={(url) => rewriteImg(url, owner, repo, data.default_branch)}
                            >
                              {r.body}
                            </ReactMarkdown>
                          </div>
                        </details>
                      )}
                      {r.assets.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {r.assets.map((a) => (
                            <a
                              key={a.id}
                              href={a.browser_download_url}
                              download
                              className="gh-chip"
                              title={`${formatBytes(a.size)} · ${a.download_count.toLocaleString()} downloads`}
                            >
                              <Download size={12} /> {a.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="gh-card p-5 text-sm text-muted-foreground">No releases yet.</div>
                )}
              </div>
            )}

            {tab === "assets" && latest && (
              <div className="gh-card p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Size</th>
                      <th className="py-2 pr-3">Downloads</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.assets.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 font-mono text-xs break-all">{a.name}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{formatBytes(a.size)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{a.download_count.toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <a href={a.browser_download_url} download className="gh-btn !py-1 !px-2 text-xs">
                            <Download size={12} /> Get
                          </a>
                        </td>
                      </tr>
                    ))}
                    {latest.assets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 text-muted-foreground text-center">
                          No assets in latest release.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "screenshots" && (
              <div className="gh-card p-4">
                {screenshots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No screenshots found in README.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {screenshots.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noreferrer" className="block border border-border rounded-[3px] overflow-hidden">
                        <img src={src} alt="screenshot" className="w-full h-auto block" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function rewriteImg(url: string, owner: string, repo: string, branch: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("#") || url.startsWith("mailto:")) {
    return url;
  }
  const clean = url.replace(/^\.\//, "").replace(/^\//, "");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${clean}`;
}
