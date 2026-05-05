import { RepoCard } from "./RepoCard";
import { useRecent } from "@/hooks/useRecent";

export function RecentSection() {
  const { recent, clearRecent } = useRecent();

  if (recent.length === 0) return null;

  // Show max 4 on mobile, up to 8 on desktop to fit nicely in 1-2 rows
  const displayRecent = recent.slice(0, 8);

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-2xl font-extrabold">Recently Opened</h2>
        <button
          onClick={clearRecent}
          className="text-sm font-semibold underline text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayRecent.map((r) => (
          <RepoCard key={`${r.owner}/${r.repo}`} data={r} />
        ))}
      </div>
    </section>
  );
}
