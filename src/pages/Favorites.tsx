import { RepoCard } from "@/components/RepoCard";
import { useFavorites } from "@/hooks/useFavorites";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function FavoritesPage() {
  const { favs } = useFavorites();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Favorites - GHFrog</title>
      </Helmet>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold mb-6">Favorites</h1>
        {favs.length === 0 ? (
          <div className="gh-card p-8 text-center">
            <p className="text-muted-foreground mb-4">No favorites yet.</p>
            <Link to="/" className="gh-btn-primary">Browse apps</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favs.map((f) => (
              <RepoCard
                key={`${f.owner}/${f.repo}`}
                data={{
                  owner: f.owner,
                  repo: f.repo,
                  name: f.name,
                  description: f.description,
                  stars: f.stars,
                  language: f.language,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
