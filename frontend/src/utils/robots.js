// Robots directive for private routes (admin, auth, cart/checkout, orders,
// account, thank-you, 404). Keep in sync with ROBOTS_NOINDEX in
// backend/utils/seo.js, which sends the same value as <meta> and X-Robots-Tag.
export const NOINDEX_ROBOTS = "noindex, nofollow";
