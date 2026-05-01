import { useEffect, useState } from "react";
import { searchRepos, type Repo } from "@/lib/github";
import { RepoCard } from "./RepoCard";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  query: string;
  sort?: "stars" | "updated";
  viewAllHref: string;
  limit?: number;
}

export function HomeSection({ title, query, sort = "stars", viewAllHref, limit = 8 }: Props) {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchRepos({ q: query, sort, order: "desc", perPage: limit })
      .then((r) => !cancelled && setRepos(r.items))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [query, sort, limit]);

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <Link to={viewAllHref} className="text-sm font-semibold underline">
          View all →
        </Link>
      </div>
      {error && <div className="gh-card p-4 text-sm text-destructive">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(repos ?? Array.from({ length: limit })).map((r, i) =>
          r ? (
            <RepoCard
              key={(r as Repo).id}
              data={{
                owner: (r as Repo).owner.login,
                repo: (r as Repo).name,
                name: (r as Repo).name,
                description: (r as Repo).description,
                stars: (r as Repo).stargazers_count,
                language: (r as Repo).language,
                pushedAt: (r as Repo).pushed_at,
              }}
            />
          ) : (
            <div key={i} className="gh-card p-4 h-32 animate-pulse bg-muted" />
          ),
        )}
      </div>
    </section>
  );
}
