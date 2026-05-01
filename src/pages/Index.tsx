import { Navbar } from "@/components/Navbar";
import { HomeSection } from "@/components/HomeSection";

const Index = () => {
  // ISO date 30 days ago for trending
  const trendingDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-10 border border-border rounded-[3px] p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl" aria-hidden>🐸</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              GHFrog
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            A browser app store for open-source software released on GitHub.
            Discover, download, and bookmark — no install, no account.
          </p>
        </section>

        <HomeSection
          title="Trending"
          query={`stars:>100 created:>${trendingDate}`}
          sort="stars"
          viewAllHref={`/search?q=${encodeURIComponent(`stars:>100 created:>${trendingDate}`)}&sort=stars`}
        />

        <HomeSection
          title="Popular"
          query="stars:>5000"
          sort="stars"
          viewAllHref="/search?q=stars%3A%3E5000&sort=stars"
        />

        <HomeSection
          title="Recently Updated"
          query="stars:>500"
          sort="updated"
          viewAllHref="/search?q=stars%3A%3E500&sort=updated"
        />

        <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border mt-10">
          Built with 🐸 · Data from the GitHub REST API · Cached locally to save quota
        </footer>
      </main>
    </div>
  );
};

export default Index;
