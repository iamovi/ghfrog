export async function onRequestGet(context) {
  const { request, env, next, waitUntil } = context;
  const pathParams = context.params.path; // ['owner', 'repo']

  // Only run logic if we have exactly an owner and a repo
  if (!pathParams || pathParams.length !== 2) {
    return next();
  }

  const owner = pathParams[0];
  const repo = pathParams[1];

  const cache = caches.default;
  let response = await cache.match(request);
  
  if (response) {
    return response; // Return cached edge response instantly!
  }

  // Fallback defaults
  let ogTitle = `${repo} by ${owner} - GHFrog`;
  let ogDesc = `Discover releases, download binaries, and explore ${repo} on GHFrog.`;
  let ogImage = "";
  let ogStars = "";

  try {
    const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "User-Agent": "GHFrog-Cloudflare-Worker",
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (ghResponse.ok) {
      const data = await ghResponse.json();
      if (data.name) ogTitle = `${data.name} - GHFrog`;
      if (data.description) ogDesc = data.description;
      if (data.owner && data.owner.avatar_url) ogImage = data.owner.avatar_url;
      if (data.stargazers_count != null) ogStars = `⭐ ${data.stargazers_count.toLocaleString()} stars`;
      if (data.language) {
        ogDesc = `${ogDesc} | ${data.language}`;
      }
      if (ogStars) {
        ogDesc = `${ogDesc} | ${ogStars}`;
      }
    }
  } catch (err) {
    // Graceful fallback if GitHub API fails
    console.error("GitHub API fetch failed at edge:", err);
  }

  // Fetch the standard React App (index.html)
  const appResponse = await env.ASSETS.fetch(request);

  const esc = (s) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Rewrite HTML stream: REMOVE existing static OG tags, then INJECT dynamic ones
  let finalResponse = new HTMLRewriter()
    .on('title', {
      element(e) {
        e.setInnerContent(ogTitle);
      }
    })
    // Remove existing static meta tags that we want to override
    .on('meta[property="og:title"]', { element(e) { e.remove(); } })
    .on('meta[property="og:description"]', { element(e) { e.remove(); } })
    .on('meta[property="og:image"]', { element(e) { e.remove(); } })
    .on('meta[name="twitter:card"]', { element(e) { e.remove(); } })
    .on('meta[name="twitter:title"]', { element(e) { e.remove(); } })
    .on('meta[name="twitter:description"]', { element(e) { e.remove(); } })
    .on('meta[name="twitter:image"]', { element(e) { e.remove(); } })
    .on('meta[name="description"]', { element(e) { e.remove(); } })
    // Inject the dynamic tags at the end of <head>
    .on('head', {
      element(e) {
        e.append(`<meta name="description" content="${esc(ogDesc)}">`, { html: true });
        e.append(`<meta property="og:title" content="${esc(ogTitle)}">`, { html: true });
        e.append(`<meta property="og:description" content="${esc(ogDesc)}">`, { html: true });
        e.append(`<meta property="og:type" content="website">`, { html: true });
        if (ogImage) {
          e.append(`<meta property="og:image" content="${ogImage}">`, { html: true });
        }
        e.append(`<meta name="twitter:card" content="${ogImage ? 'summary' : 'summary'}">`, { html: true });
        e.append(`<meta name="twitter:title" content="${esc(ogTitle)}">`, { html: true });
        e.append(`<meta name="twitter:description" content="${esc(ogDesc)}">`, { html: true });
        if (ogImage) {
          e.append(`<meta name="twitter:image" content="${ogImage}">`, { html: true });
        }
      }
    })
    .transform(appResponse);

  // Clone to set Cache-Control (since we're transforming)
  finalResponse = new Response(finalResponse.body, finalResponse);
  finalResponse.headers.set("Cache-Control", "public, max-age=86400"); // Cache at edge for 24 hours

  // Put in cache without blocking the current request
  waitUntil(cache.put(request, finalResponse.clone()));

  return finalResponse;
}
