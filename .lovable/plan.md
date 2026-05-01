## GHFrog — Browser-based App Store for GitHub Releases

A flat, Gumroad-style web app for discovering and downloading GitHub-released software. No backend required — everything runs in the browser using the GitHub REST API, with optional OAuth for higher rate limits.

### Pages & Navigation

- **Home (`/`)** — Three curated sections:
  - **Trending** — repos created in the last 30 days, sorted by stars, that have ≥1 release
  - **Popular** — all-time most-starred repos with releases (filtered to "has downloadable assets")
  - **New Releases** — recently published releases across known/curated repos
- **Search (`/search`)** — Full search with filters and sort
- **App Detail (`/app/:owner/:repo`)** — Full repo info, README, screenshots, releases, assets
- **Favorites (`/favorites`)** — Locally bookmarked apps
- **Auth callback (`/auth/callback`)** — Handles GitHub OAuth return

Top navigation bar: 🐸 GHFrog logo (left), search input (center), Favorites + Sign in with GitHub (right).

### Home Page

Three horizontally-scrollable card rows with section headings. Each section shows ~12 cards. "View all" link expands the section into a search results page with the matching query pre-applied.

### Search & Filters

- **Search input** with debounced live results
- **Filters sidebar**:
  - Language (dropdown of common languages: JavaScript, Python, Rust, Go, C++, etc.)
  - Platform (Windows, Mac, Linux, Android — multi-select). This filters client-side by inspecting release asset extensions (`.exe`, `.msi`, `.dmg`, `.pkg`, `.AppImage`, `.deb`, `.rpm`, `.apk`).
  - Sort by: Stars, Recently updated, Recently created
- **Search history** saved to localStorage; shown as quick chips below the search bar
- Results render as the same card component used on Home

### App Detail Page

Layout:
```text
┌──────────────────────────────────────────────────────┐
│ 🐸 owner/repo            ★ 12.4k  · Language · ☆ Fav │
│ Description line                                     │
│ [ Download for {detected OS} ▼ ]   [ View on GitHub ]│
├──────────────────────────────────────────────────────┤
│ [Tabs: README | Releases | Assets | Screenshots]     │
│                                                      │
│ Rendered content per tab                             │
└──────────────────────────────────────────────────────┘
```

- **Auto-detect OS** via `navigator.userAgent` / `navigator.platform`; primary download button picks the best matching asset from the latest release. Dropdown lists all alternates.
- **README tab** — fetched from `/repos/{owner}/{repo}/readme`, base64-decoded, rendered with `react-markdown` + GFM. Relative image URLs rewritten to `raw.githubusercontent.com`.
- **Releases tab** — list of all releases with version, date, release notes (markdown), and per-release asset downloads with size and download counts.
- **Screenshots tab** — extracted from README image tags.

### Favorites

- Star/bookmark icon on every card and on the detail page header
- Stored in localStorage as an array of `{ owner, repo, name, description, stars, language, savedAt }`
- Favorites page is a grid of saved cards with a remove action

### GitHub OAuth (Higher Rate Limits)

- "Sign in with GitHub" button initiates OAuth via GitHub's web flow
- Because OAuth requires a client secret exchange, this needs a tiny serverless piece. **We'll use Lovable Cloud** to host a single edge function that exchanges the OAuth `code` for an `access_token`. The token is stored in localStorage and attached as `Authorization: Bearer …` to all GitHub API calls.
- Sign-out clears the token. Status indicator in the navbar shows "60/hr" (anonymous) or "5000/hr" (authenticated) with the current remaining count parsed from `X-RateLimit-Remaining` headers.

### Smart Caching

A small caching layer wrapping all GitHub fetches:
- Key: full request URL
- Value: `{ data, etag, fetchedAt }`
- TTLs: search results 10 min, repo metadata 1 hr, README 6 hrs, releases 30 min
- On revalidation, sends `If-None-Match` with the stored ETag — a 304 costs **0** rate-limit points
- Cache lives in localStorage with a size cap (LRU eviction when >4 MB)
- Manual "Refresh" button on detail pages bypasses cache

### Design System (Gumroad-inspired)

- **Colors**: white background `#FFFFFF`, black text/borders `#000000`, single accent green `#22C55E` reserved for the 🐸 logo, the favorite-active state, and the primary download button hover
- **No gradients, no soft shadows.** Optional 2px hard offset shadow on hover for cards (`4px 4px 0 #000`) — toggleable; default flat
- **Border radius: 3px everywhere** (cards, buttons, inputs, badges, tabs)
- **Borders: 1px solid black** on every interactive surface
- **Typography**: system sans (Inter fallback), bold weights for titles, regular for body. Sizes: 28/20/16/14
- **Card anatomy**:
  ```text
  ┌──────────────────────────┐
  │ 🐸 repo-name        ☆   │
  │ Short description…       │
  │ ★ 1.2k · TypeScript · 2d │
  └──────────────────────────┘
  ```

### Technical Notes

- **Stack**: React + Vite + Tailwind + TypeScript + react-router-dom (already scaffolded)
- **New deps**: `react-markdown`, `remark-gfm`, `rehype-raw` for README rendering
- **GitHub API client**: single `lib/github.ts` module with cached fetch, ETag handling, rate-limit tracking, and typed helpers (`searchRepos`, `getReleases`, `getReadme`, `getRepo`)
- **OS detection**: `lib/os.ts` returns `'windows' | 'mac' | 'linux' | 'android' | 'unknown'`; asset matcher scores assets by extension + arch keywords (`x64`, `arm64`, `universal`)
- **Lovable Cloud**: enabled to host one edge function `github-oauth-exchange` that takes `{ code }` and returns `{ access_token }`. The GitHub OAuth client ID is public (stored in code); the client secret is stored as a Lovable Cloud secret. The user will need to create a GitHub OAuth App and provide both values after the plan is approved.
- **Routing**: add `/search`, `/app/:owner/:repo`, `/favorites`, `/auth/callback` above the catch-all in `App.tsx`
- **State**: lightweight — React Query for GitHub fetches (already installed), Zustand-free; favorites/history/token via small localStorage hooks

### Out of Scope (v1)

- User reviews, ratings, comments
- Server-side curation or moderation
- Installing apps (we only link to release assets — the user downloads them)
- Mobile app builds

### Setup Required After Approval

1. Confirm enabling **Lovable Cloud** for the OAuth exchange function
2. You'll create a GitHub OAuth App at github.com/settings/developers using the deployed callback URL — we'll provide the exact URL
3. Paste the OAuth **Client ID** (public) and **Client Secret** (stored as Lovable Cloud secret) when prompted