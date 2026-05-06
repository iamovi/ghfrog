import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Search, Bookmark, LogOut, Sun, Moon, Github, KeyRound, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { getToken, setToken } from "@/lib/github";

export function Navbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const rl = useRateLimit();
  const { theme, setTheme } = useTheme();
  const { user, loading, signInWithGithub, signOut } = useAuth();
  
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [hasManualToken, setHasManualToken] = useState(() => !!getToken());

  useEffect(() => {
    if (user) setHasManualToken(false);
  }, [user]);

  const handleSaveToken = () => {
    setToken(tokenInput.trim() || null);
    setHasManualToken(!!tokenInput.trim());
    setShowTokenModal(false);
    setTokenInput("");
  };

  const handleClearManualToken = () => {
    setToken(null);
    setHasManualToken(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg shrink-0">
            <img src="/frog.png" alt="GHFrog Logo" className="w-8 h-8" />
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
            {rl.search && (
              <span
                className="hidden md:inline-flex gh-badge"
                title={`Search limit: ${rl.search.limit - rl.search.remaining}/${rl.search.limit} used. Resets at ${new Date(rl.search.reset * 1000).toLocaleTimeString()}`}
              >
                Search: {rl.search.limit - rl.search.remaining}/{rl.search.limit}
              </span>
            )}
            {rl.core && (
              <span
                className="hidden md:inline-flex gh-badge"
                title={`API limit: ${rl.core.limit - rl.core.remaining}/${rl.core.limit} used. Resets at ${new Date(rl.core.reset * 1000).toLocaleTimeString()}`}
              >
                API: {rl.core.limit - rl.core.remaining}/{rl.core.limit}
              </span>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gh-btn !px-2.5"
              aria-label="Toggle theme"
            >
              <Sun size={16} className="hidden dark:block" />
              <Moon size={16} className="block dark:hidden" />
            </button>
            <Link to="/favorites" aria-label="Favorites" className="gh-btn !px-2.5">
              <Bookmark size={16} />
            </Link>
            {loading ? (
              <div className="w-9 h-9 bg-muted animate-pulse rounded-[3px] border-2 border-border" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="gh-btn !p-0 w-9 h-9" aria-label="User profile">
                    {user ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt={user.user_metadata.user_name} 
                        className="w-full h-full rounded-[1px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={16} />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-sans">
                  {user ? (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Signed in</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.user_metadata.user_name}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </>
                  ) : hasManualToken ? (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Token Active</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            Using Personal Access Token
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleClearManualToken} className="cursor-pointer text-destructive focus:text-destructive">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Clear token</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Not signed in</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            Sign in to boost API limits
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowTokenModal(true)} className="cursor-pointer">
                        <Github className="mr-2 h-4 w-4" />
                        <span>Sign in / Add Token</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
            className="bg-background border-2 border-border rounded-[3px] max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: "6px 6px 0 0 hsl(var(--border))" }}
          >
            <h2 className="text-lg font-bold mb-1">Boost your rate limit</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Anonymous users: 60 requests/hour. Authenticated users: 5,000/hour.
            </p>

            <div className="mb-6">
              <button onClick={signInWithGithub} className="gh-btn-primary w-full justify-center">
                <Github size={16} />
                Sign in with GitHub (Recommended)
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-bold">
                  Or paste manual token
                </span>
              </div>
            </div>

            <ol className="text-sm space-y-1 mb-3 list-decimal pl-5 text-muted-foreground">
              <li>
                Open{" "}
                <a
                  className="underline font-medium text-foreground"
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/settings/tokens
                </a>
              </li>
              <li>Generate a token with <strong>no scopes</strong> (public read is enough)</li>
            </ol>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_…"
              className="gh-input mb-3 font-mono"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTokenModal(false)} className="gh-btn">
                Cancel
              </button>
              <button onClick={handleSaveToken} className="gh-btn border-border bg-foreground text-background hover:bg-muted hover:text-foreground">
                Save token
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
