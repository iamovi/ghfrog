import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { formatStars, timeAgo } from "@/lib/format";

export interface RepoCardData {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  pushedAt?: string;
}

export function RepoCard({ data }: { data: RepoCardData }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(data.owner, data.repo);

  return (
    <Link
      to={`/app/${data.owner}/${data.repo}`}
      className="gh-card gh-card-hover block p-4 h-full"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground truncate">{data.owner}</div>
          <h3 className="font-bold text-base leading-tight truncate">{data.name}</h3>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle({
              owner: data.owner,
              repo: data.repo,
              name: data.name,
              description: data.description,
              stars: data.stars,
              language: data.language,
            });
          }}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          className="shrink-0 border border-border rounded-[3px] p-1 hover:bg-foreground hover:text-background transition-colors"
        >
          <Star
            size={14}
            className={fav ? "fill-current" : ""}
            style={fav ? { color: "hsl(var(--frog))" } : undefined}
          />
        </button>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
        {data.description || "No description"}
      </p>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="gh-badge">★ {formatStars(data.stars)}</span>
        {data.language && <span className="gh-badge">{data.language}</span>}
        {data.pushedAt && (
          <span className="text-muted-foreground">{timeAgo(data.pushedAt)}</span>
        )}
      </div>
    </Link>
  );
}
