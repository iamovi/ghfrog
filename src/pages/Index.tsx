import { HomeSection } from "@/components/HomeSection";
import { RecentSection } from "@/components/RecentSection";
import { Helmet } from "react-helmet-async";
import { GithubIcon as Github } from "@/components/GithubIcon";

const Index = () => {
  // ISO date 30 days ago for trending
  const trendingDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>GHFrog - GitHub App Store</title>
      </Helmet>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-10 border border-border rounded-[3px] p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-3">
            <img src="/frog.png" alt="GHFrog Logo" className="w-12 h-12" />
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              GHFrog
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            A browser-based app store for open-source software released on GitHub.
            Discover releases, download binaries, and bookmark your favorites. Sign in with GitHub to boost your API limits and explore without restrictions.
          </p>
        </section>

        <RecentSection />

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

        <footer className="text-center text-xs text-muted-foreground py-8 border-t border-border mt-10 flex flex-col items-center gap-4">
          <div>Built with 🐸 · Releases from the GitHub API · Cached locally to save quota</div>
          <a
            href="https://github.com/iamovi/ghfrog"
            target="_blank"
            rel="noreferrer"
            className="gh-btn inline-flex items-center gap-2 text-foreground"
          >
            <Github size={14} /> View on GitHub
          </a>
        </footer>
      </main>
    </div>
  );
};

export default Index;
