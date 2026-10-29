const DEFAULT_PUBLIC_SITE_URL = "https://alyonabags.com";

export const getPublicSiteUrl = ({ publicSiteUrl, clientUrl, nodeEnv } = {}) => {
  const fallback = clientUrl?.split(",")[0]?.trim() || "http://localhost:5173";
  const configuredUrl = publicSiteUrl || (nodeEnv === "production" ? DEFAULT_PUBLIC_SITE_URL : fallback);
  let url;
  try { url = new URL(configuredUrl); }
  catch { throw new TypeError("PUBLIC_SITE_URL must be a valid absolute HTTP or HTTPS URL"); }
  if (!["http:", "https:"].includes(url.protocol)) throw new TypeError("PUBLIC_SITE_URL must use HTTP or HTTPS");
  return url.origin;
};

// The storefront is a React app that loads catalogue, category, settings, About
// and review content from these public, read-only JSON endpoints after the page
// loads. Googlebot's renderer obeys robots.txt for those requests, so they must
// stay crawlable or Google "sees" empty product/category pages. Google and Bing
// apply the most specific (longest) matching rule, so these Allow lines win over
// the broad `Disallow: /api/`, which still keeps cart, orders, users, auth,
// payment, upload, enquiries, admin and health endpoints out of crawls.
export const RENDER_API_PATHS = ["/api/products", "/api/categories", "/api/settings", "/api/about", "/api/reviews"];

// Value used for both the <meta name="robots"> tag and the X-Robots-Tag header
// on every private route.
export const ROBOTS_NOINDEX = "noindex, nofollow";

// Genuinely private storefront/admin page prefixes. A path matches when it is
// exactly the prefix or sits below it ("/admin" and "/admin/login", but not
// "/administrator-bags"). These must stay crawlable (never Disallow them in
// robots.txt) so Google can read their noindex directive, and must never be
// listed in the sitemap.
export const PRIVATE_PAGE_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/cart",
  "/checkout",
  "/order-success",
  "/order-failure",
  "/my-orders",
  "/my-profile",
  "/thank-you",
];

const normalizePath = (path) => String(path || "").split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase() || "/";
const matchesPrefix = (path, prefix) => path === prefix || path.startsWith(prefix + "/");

export const isPrivatePath = (path) => {
  const normalized = normalizePath(path);
  return PRIVATE_PAGE_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix));
};

// JSON endpoints that are not part of the public read-only set the storefront
// needs for rendering (RENDER_API_PATHS) get the noindex header as well.
// "/api/reviews/mine" is a signed-in customer endpoint that sits under an
// otherwise public prefix.
export const isPrivateApiPath = (path) => {
  const normalized = normalizePath(path);
  if (!matchesPrefix(normalized, "/api")) return false;
  if (matchesPrefix(normalized, "/api/reviews/mine")) return true;
  return !RENDER_API_PATHS.some((prefix) => matchesPrefix(normalized, prefix));
};

export const buildRobotsTxt = (siteUrl) => [
  "User-agent: *",
  "Allow: /",
  ...RENDER_API_PATHS.map((path) => "Allow: " + path),
  "Disallow: /api/",
  "Sitemap: " + new URL("/sitemap.xml", siteUrl).href,
  "",
].join("\n");

const xmlEscape = (value) => String(value).replace(/[<>&"']/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
})[character]);

const formatLastmod = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);
};

export const buildSitemapXml = ({ siteUrl, products = [], categories = [] }) => {
  const staticPaths = ["/", "/categories", "/about", "/contact", "/reviews", "/faq", "/privacy", "/terms-and-conditions"];
  const entries = [
    ...staticPaths.map((path) => ({ path })),
    ...categories.filter((c) => c?.isActive === true && typeof c.slug === "string" && c.slug.trim())
      .map((c) => ({ path: "/categories/" + encodeURIComponent(c.slug), lastmod: c.updatedAt })),
    ...products.filter((p) => p?.isActive === true && typeof p.slug === "string" && p.slug.trim())
      .map((p) => ({ path: "/products/" + encodeURIComponent(p.slug), lastmod: p.updatedAt })),
  ];
  // Defence in depth: private/admin URLs must never reach the sitemap, even if a
  // future static path or a record slug resolves to one.
  const unique = [...new Map(entries.filter((entry) => !isPrivatePath(entry.path)).map((entry) => [entry.path, entry])).values()];
  const urls = unique.map(({ path, lastmod }) => {
    const loc = new URL(path, siteUrl + "/").href;
    const date = formatLastmod(lastmod);
    return "<url><loc>" + xmlEscape(loc) + "</loc>" + (date ? "<lastmod>" + date + "</lastmod>" : "") + "</url>";
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join("") + "</urlset>";
};

export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const FALLBACK_SITE_LINKS = [
  ["/", "Home"],
  ["/categories", "Wholesale catalogue"],
  ["/about", "About Alyona Bags"],
  ["/contact", "Contact and wholesale enquiries"],
  ["/faq", "Frequently asked questions"],
  ["/reviews", "Customer reviews"],
];

const linkList = (links) => links.length
  ? "<ul>" + links.map(({ name, path }) => '<li><a href="' + escapeHtml(path) + '">' + escapeHtml(name) + "</a></li>").join("") + "</ul>"
  : "";

// Plain-HTML copy of a page's core content, written into <noscript> in the HTML
// shell. Search engines that run JavaScript render the React page instead and
// ignore this; crawlers that do not (some search, social and AI crawlers) still
// get the page heading, its real description and crawlable links. Every value
// must come from the same data the React page shows, never from invented copy.
export const buildNoscriptFallback = ({
  heading = "", description = "", facts = [], qa = [], categoryLinks = [], productLinks = [],
} = {}) => {
  const factItems = facts.filter(([, value]) => value !== undefined && value !== null && String(value).trim());
  const qaItems = qa.filter((item) => item?.title && item?.content);
  const parts = [
    heading ? "<h1>" + escapeHtml(heading) + "</h1>" : "",
    description ? "<p>" + escapeHtml(description) + "</p>" : "",
    factItems.length
      ? "<ul>" + factItems.map(([label, value]) => "<li>" + escapeHtml(label) + ": " + escapeHtml(value) + "</li>").join("") + "</ul>"
      : "",
    qaItems.length
      ? "<dl>" + qaItems.map(({ title, content }) => "<dt>" + escapeHtml(title) + "</dt><dd>" + escapeHtml(content) + "</dd>").join("") + "</dl>"
      : "",
    categoryLinks.length ? "<h2>Categories</h2>" + linkList(categoryLinks) : "",
    productLinks.length ? "<h2>Products</h2>" + linkList(productLinks) : "",
    '<nav aria-label="Site">' + linkList(FALLBACK_SITE_LINKS.map(([path, name]) => ({ path, name }))) + "</nav>",
  ];
  return '<noscript id="seo-fallback">' + parts.filter(Boolean).join("") + "</noscript>";
};
