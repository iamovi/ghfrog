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
    }
  } catch (err) {
    // Graceful fallback if GitHub API fails
    console.error("GitHub API fetch failed at edge:", err);
  }

  // Fetch the standard React App (index.html)
  const appResponse = await env.ASSETS.fetch(request);
  
  // Rewrite HTML stream injecting dynamic tags
  let finalResponse = new HTMLRewriter()
    .on('title', {
      element(e) {
        e.setInnerContent(ogTitle);
      }
    })
    .on('head', {
      element(e) {
        e.append(`<meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}">`, { html: true });
        e.append(`<meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}">`, { html: true });
        if (ogImage) {
          e.append(`<meta property="og:image" content="${ogImage}">`, { html: true });
          e.append(`<meta name="twitter:card" content="summary_large_image">`, { html: true });
          e.append(`<meta name="twitter:image" content="${ogImage}">`, { html: true });
        }
        e.append(`<meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}">`, { html: true });
        e.append(`<meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}">`, { html: true });
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
