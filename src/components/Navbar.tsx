import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, Bookmark, KeyRound, LogOut } from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { getToken, setToken } from "@/lib/github";

export function Navbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const rl = useRateLimit();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [hasToken, setHasToken] = useState(!!getToken());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleSaveToken = () => {
    setToken(tokenInput.trim() || null);
    setHasToken(!!tokenInput.trim());
    setShowTokenModal(false);
    setTokenInput("");
  };

  const handleSignOut = () => {
    setToken(null);
    setHasToken(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg shrink-0">
            <span className="text-2xl" aria-hidden>🐸</span>
            <span className="hidden sm:inline">GHFrog</span>
          </Link>

          <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-auto relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search repositories…"
              className="gh-input pl-9"
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            {rl && (
              <span
                className="hidden md:inline-flex gh-badge"
                title={`Rate limit: ${rl.remaining}/${rl.limit} remaining. Resets at ${new Date(rl.reset * 1000).toLocaleTimeString()}`}
              >
                {rl.remaining}/{rl.limit}
              </span>
            )}
            <Link to="/favorites" aria-label="Favorites" className="gh-btn !px-2.5">
              <Bookmark size={16} />
            </Link>
            {hasToken ? (
              <button onClick={handleSignOut} className="gh-btn" title="Sign out">
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <button onClick={() => setShowTokenModal(true)} className="gh-btn-primary">
                <KeyRound size={14} />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {showTokenModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowTokenModal(false)}
        >
          <div
            className="bg-background border border-border rounded-[3px] max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
          >
            <h2 className="text-lg font-bold mb-1">Boost your rate limit</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Anonymous: 60 requests/hour. With a GitHub Personal Access Token: 5,000/hour.
              The token is stored only in your browser's localStorage.
            </p>
            <ol className="text-sm space-y-1 mb-3 list-decimal pl-5">
              <li>
                Open{" "}
                <a
                  className="underline font-medium"
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/settings/tokens
                </a>
              </li>
              <li>Generate a token with <strong>no scopes</strong> (public read is enough)</li>
              <li>Paste it below</li>
            </ol>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_…"
              className="gh-input mb-3 font-mono"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTokenModal(false)} className="gh-btn">
                Cancel
              </button>
              <button onClick={handleSaveToken} className="gh-btn-primary">
                Save token
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
