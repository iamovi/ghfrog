# GHFrog 🐸

A browser-based app store for open-source software released on GitHub. Discover releases, download binaries, and bookmark your favorites. Sign in with GitHub to boost your API limits and explore without restrictions.

## Features

- **App Discovery:** Browse trending, popular, and recently updated GitHub repositories that have binary releases.
- **Advanced Search:** Search for apps by language, platform (Windows, Mac, Linux, Android), or keyword.
- **One-Click Downloads:** Automatically detects your operating system and highlights the correct binary for quick downloading.
- **Favorites:** Bookmark your favorite apps (saved locally) for easy access.
- **GitHub OAuth:** Sign in with your GitHub account via Supabase to securely elevate your GitHub API rate limit from 60 to 5,000 requests per hour.
- **Dark Mode:** Fully supports system dark/light modes.

## Tech Stack

- **Frontend Framework:** React 18 with Vite
- **Styling:** Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
- **Routing:** React Router v6
- **Data Fetching:** GitHub REST API
- **Authentication:** Supabase (GitHub OAuth)
- **Icons:** Lucide React

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ghfrog.git
   cd ghfrog
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials in `.env.local`:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open `http://localhost:8080` in your browser.

## Deployment to Cloudflare Pages

GHFrog is fully configured for deployment on Cloudflare Pages as a Single Page Application (SPA). A `public/_redirects` file is included to handle client-side routing.

1. Go to your **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Select your repository.
3. Configure the build settings:
   - **Framework preset:** `Vite` (or None)
   - **Build command:** `npm run build` (or `yarn build`)
   - **Build output directory:** `dist`
4. Add your Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Save and Deploy**.

### Important Supabase Configuration Post-Deployment
After your site is deployed, go to your **Supabase Dashboard → Authentication → URL Configuration** and add your new Cloudflare URL (e.g., `https://ghfrog.pages.dev`) to both the **Site URL** and **Redirect URLs** to ensure GitHub OAuth works in production.

## License

MIT
