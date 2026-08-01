import { SITE } from "./site";
import type { Post } from "./types";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getGoogleFontsUrl(lang: string): string {
  const fonts = [
    "family=Roboto:ital,wght@0,400;0,600;1,400;1,600",
    "family=Roboto+Mono:ital,wght@0,400;0,600;1,400;1,600",
    "family=Noto+Emoji:wght@400;600",
  ];

  const normalized = lang.toLowerCase();

  if (
    normalized.startsWith("zh-tw") ||
    normalized.startsWith("zh-hk") ||
    normalized === "zh-hant"
  ) {
    fonts.push("family=Noto+Sans+TC:wght@400;600");
  } else if (normalized.startsWith("ja")) {
    fonts.push("family=Noto+Sans+JP:wght@400;600");
  } else if (normalized.startsWith("ko")) {
    fonts.push("family=Noto+Sans+KR:wght@400;600");
  } else if (normalized.startsWith("zh")) {
    fonts.push("family=Noto+Sans+SC:wght@400;600");
  }

  return `https://fonts.googleapis.com/css2?${fonts.join("&")}&display=swap`;
}

function layout(
  pageTitle: string,
  body: string,
  lang: string = SITE.defaultLang,
  summary?: string,
  postId?: string,
): string {
  const currentUrl = postId ? `${SITE.url}/${postId}/` : `${SITE.url}/`;
  const description = summary
    ? `\n  <meta name="description" content="${esc(summary)}">\n  <meta property="og:description" content="${esc(summary)}">`
    : "";
  const navigation = postId
    ? `\n  <nav class="page-nav" aria-label="Page navigation">
    <a class="page-nav-home" href="/">← Home</a>
    <a class="page-nav-top" href="#top">↑ Top</a>
  </nav>`
    : "";
  const script = postId ? `\n  <script src="/lightbox.js" defer></script>` : "";

  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(pageTitle)}</title>${description}
  <meta property="og:title" content="${esc(pageTitle)}">
  <meta property="og:url" content="${esc(currentUrl)}">
  <meta property="og:type" content="${postId ? "article" : "website"}">
  <link rel="canonical" href="${esc(currentUrl)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="${esc(getGoogleFontsUrl(lang))}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css">
  <link rel="stylesheet" href="/style.css">
</head>
<body id="top">${navigation}
  <main>
    ${body}
  </main>
  <footer>
    <p>Questions or comments? <a href="mailto:${esc(SITE.email)}">Get in touch</a>.</p>
  </footer>${script}
</body>
</html>`;
}

export function renderHome(posts: Post[]): string {
  const items = posts
    .map(
      (post) => `    <li>
      <span><i><time datetime="${esc(post.updatedAt)}">${esc(post.updated)}</time></i></span>
      <a href="/${esc(post.id)}/">${esc(post.title)}</a>
    </li>`,
    )
    .join("\n");

  const body = `<ul class="blog-posts">\n${items}\n  </ul>`;
  return layout(SITE.title, body);
}

export function renderPost(post: Post): string {
  const body = `<article>
      <h1>${esc(post.title)}</h1>
      <p class="post-meta"><i><time datetime="${esc(post.updatedAt)}">${esc(post.updated)}</time></i></p>
      ${post.html}
    </article>
    <dialog class="image-lightbox" aria-label="Image preview">
      <img alt="">
    </dialog>`;

  return layout(
    `${post.title} | ${SITE.title}`,
    body,
    post.lang,
    post.summary,
    post.id,
  );
}

export function renderSitemap(posts: Post[]): string {
  const urls = posts
    .map(
      (post) => `  <url>
    <loc>${SITE.url}/${esc(post.id)}/</loc>
    <lastmod>${post.updatedAt}</lastmod>
  </url>`,
    )
    .join("\n");

  const homeLastmod = posts[0]
    ? `\n    <lastmod>${posts[0].updatedAt}</lastmod>`
    : "";

  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE.url}/</loc>${homeLastmod}
  </url>
${urls}
</urlset>`;
}
