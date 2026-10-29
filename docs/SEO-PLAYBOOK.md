# Alyona Bags — SEO Playbook

Prepared 29 October 2026 from a full read of this repository, a fetch of the live homepage, and public competitor pages.
Nothing here promises rankings, indexing, traffic, rich results or a time-to-rank.

**Evidence labels used below**
- **Code** — read directly in this repository.
- **Observed** — fetched from a public page on 29 Oct 2026.
- **Hypothesis** — reasoning only; needs Search Console, GA4 or a paid keyword tool to confirm.
- **Not measured** — no Lighthouse / CrUX / PageSpeed data was available to me.

---

## 1. Audit register

### Critical

| # | Issue | Evidence | Fix | Status |
|---|-------|----------|-----|--------|
| C1 | `robots.txt` disallowed `/api/`, but every public page loads its data (products, categories, settings, About, reviews) from `/api/...` after the page loads. Googlebot's renderer obeys robots.txt for those requests, so Google can be shown empty category/product grids and "Product not found". | **Code:** `backend/utils/seo.js` (`Disallow: /api/`); `frontend/src/api/baseUrl.js` (API is same-origin `${origin}/api` unless `VITE_API_URL` is set); `Home.jsx`, `Categories.jsx`, `ProductDetails.jsx` all fetch via `api`. | `robots.txt` now allows `/api/products`, `/api/categories`, `/api/settings`, `/api/about`, `/api/reviews` (longest-match rule beats the broad `Disallow: /api/`). Cart, orders, users, auth, payment, upload, enquiries, admin and health stay blocked. | **Fixed in code.** Needs deploy + the URL Inspection check in §5. |

### High

| # | Issue | Evidence | Fix | Status |
|---|-------|----------|-----|--------|
| H1 | The **live site is not running this code**. Live homepage has a different meta description and `og:site_name` ("AlyonaBags") from `index.html` / `server.js` in this repo. | **Observed:** live fetch of `https://alyonabags.com/`. | Deploy the current code. | **Your action.** |
| H2 | Raw HTML has no page content (client-side rendering). Google renders JS, but some search, social and AI crawlers do not. | **Observed:** live fetch exposed only `<head>` metadata, no body text. **Code:** `#root` is empty in `index.html`. | Server now writes a `<noscript id="seo-fallback">` block (heading, real description, product facts, crawlable links) for indexable routes. SSR/prerendering is **not** recommended yet (see §6). | **Fixed in code.** |
| H3 | Category pages showed only a name and a product grid. The category `description` was used for the meta description but never shown on the page. | **Code:** `Categories.jsx` (before change). | Page now shows the admin-entered category description. | **Fixed in code.** You must write the descriptions (§4). |
| H4 | The catalogue sidebar used `<button>` + `navigate()` for categories, so those links were not crawlable `<a href>` links. | **Code:** `Categories.jsx` (before change). | Replaced with `<Link>`. Same styling. | **Fixed in code.** |
| H5 | `/categories/:slug` fetched the *unfiltered* catalogue first, then refetched once categories loaded; unknown slugs showed all products under an "All Products" heading. | **Code:** `Categories.jsx` + `App.jsx`. | Waits for the category list; unknown slug renders the 404 page (server already returns HTTP 404). | **Fixed in code.** |
| H6 | Unverified / inconsistent business claims repeated on **every** product: model defaults say "Ships within 3-5 business days. Free shipping on bulk orders above the MOQ threshold." while the FAQ says dispatch depends on quantity and delivery is 5–10 days after dispatch. Identical default text on every product is also duplicate content. | **Code:** `backend/models/Product.js` defaults; `ProductDetails.jsx` fallbacks; `shared/faq.mjs`. | **Not changed** — these are business claims. | **Needs your confirmation** (§4). |

### Medium

| # | Issue | Evidence | Status |
|---|-------|----------|--------|
| M1 | Page metadata is written in 3–4 places (`index.html`, `server.js` `staticPages`, each page's `<Seo>`, `RouteSeo.jsx`). Today they agree, but they can drift. | **Code** | Partly reduced: shared H1 text in `shared/pageMeta.mjs`. Full consolidation recommended later. |
| M2 | `/categories` title says "Wholesale Tote Bags" but the hero says "totes, backpacks, and travel bags". | **Code:** `server.js`, `Hero.jsx` | **Your decision** — confirm positioning before changing the title. |
| M3 | No code-level www ↔ non-www redirect. | **Code** | Added (production only, exact counterpart host only, 301). Also confirm http→https at your host/CDN. |
| M4 | Organization schema had name + URL only. | **Code:** `shared/structuredData.mjs` | Now adds `logo`, `email`, `sameAs` **only** if present in Settings. No LocalBusiness (B2B, no verified opening hours/storefront). |
| M5 | Catalogue pagination is JS buttons, and canonical always points to the base path, so pages 2+ are found only via sitemap/related-product links. | **Code** | Acceptable at current size; revisit when a category exceeds 12 products. |
| M6 | Homepage LCP depends on a waterfall: main JS → lazy `Home` chunk → `/api/settings` → hero image (the server already preloads the image). | **Code**; **Not measured** | Not changed — measure first (§5). Options: embed settings as a non-executable JSON block in the HTML (CSP-safe), or import `Home` eagerly. |
| M7 | API rate limit is 300 requests / 15 min / IP. Each page render makes several API calls, so a burst from a crawler/renderer could receive 429s. | **Code:** `server.js` `apiLimiter` | Monitor (§5 Crawl stats). |
| M8 | No analytics events for enquiries / WhatsApp clicks, only `page_view`. | **Code:** `GoogleAnalytics.jsx` | Recommended (§6). Needs your decision because it touches the Privacy Policy text. |

### Low

- Product/category titles are cut with `.slice(0, 45/48)` and descriptions with `.slice(0, 155)`, which can cut mid-word.
- Generic image alt text on the About page ("Manufacturing facility"); product gallery alts are "Name, image N" (acceptable).
- First row of catalogue product images is `loading="lazy"` (possible small LCP cost on `/categories`; **not measured**).
- Two `<h4>` headings sit inside `<button>`s on the product page (invalid HTML, no SEO impact). Footer uses `<h4>` without `<h2>`.
- Fonts: 5 Fraunces + 5 Inter weights requested (**not measured**; trim if PageSpeed flags it).
- Spec labels on product pages were `<h4>` directly under `<h1>`; changed to `<p>` (identical look).

### Already good — preserve these

Server-injected title / description / canonical / Open Graph / JSON-LD / LCP preload per route; `noindex` on private, auth, cart, admin and thank-you pages (they are crawlable so the directive is seen); real HTTP 404 for unknown pages; 301 for trailing slashes, `/checkout` and legacy product slugs; sitemap lists only active records with real `lastmod`; Product schema adds ratings only from real approved reviews; no fabricated data anywhere in the schema; GA4 skips the admin, verify-email, reset-password and my-orders routes.

---

## 2. Keyword-to-page map

**Important:** I cannot see your database, so I cannot see your real categories or products. Search volume and difficulty are **not available** to me. Every row is a **Hypothesis** until validated in Search Console (Performance → Queries) or a keyword tool. "Best target" assumes a category of that kind exists in your admin; if it does not, the row says what to do.

| Cluster | Primary + variants | Intent | Best existing target | New page justified? | Title / H1 idea (do not stuff) | Cannibalisation risk | Confidence |
|---|---|---|---|---|---|---|---|
| Cotton totes | cotton tote bags; wholesale cotton tote bags; bulk cotton bags | Commercial (B2B) | A "Cotton Bags" category page, if present; otherwise `/categories` | No — improve the category page | `Cotton Tote Bags Wholesale \| Alyona Bags` / "Wholesale Cotton Tote Bags" | Medium with canvas page if the two categories overlap | Hypothesis |
| Canvas totes | canvas tote bags; bulk canvas bags | Commercial (B2B) | A "Canvas Bags" category page, if present | No | `Canvas Tote Bags Wholesale \| Alyona Bags` | Medium with cotton page | Hypothesis |
| Reusable shopping bags | reusable shopping bags; cloth shopping bags | Informational → commercial | Category if you stock shopping-bag styles; otherwise a short buying guide (§6) | Only as a guide, and only with real expertise | n/a until inventory confirmed | Low | Hypothesis |
| Custom printing | custom printed bags; personalised tote bags; custom logo bags | Commercial (service) | `/faq` + product enquiry flow today | **Yes, probably** — a "Custom Printed Bags" page serves a different need (the service, process, artwork) from browsing products. **Only publish once §4 facts are confirmed** (printing MOQ, methods, lead time, artwork spec). | `Custom Printed Cotton & Canvas Bags \| Alyona Bags` | Low if kept service-focused | Hypothesis |
| Wholesale / bulk | wholesale tote bags; bulk tote bags supplier; bag manufacturer India | Commercial (B2B) | `/contact` and `/categories` | **Yes, possibly** — competitors (EcoCarry, Miniwesst) have a dedicated bulk-order page. A single "Wholesale & Bulk Orders" page covering process, MOQ, samples, shipping and a quote form. Publish only with confirmed facts. | `Wholesale Tote Bags & Bulk Orders \| Alyona Bags` | Medium with `/categories` and `/contact` — keep it process-focused, and link to both | Hypothesis |
| Corporate gifting / promotional | corporate gifting bags; promotional bags; custom bags for businesses | Commercial | Section within the wholesale page or FAQ | No separate page unless you have relevant products and photos | — | Medium with wholesale page | Hypothesis |
| Brand | Alyona Bags | Navigational | `/` | No | existing | None | High (brand term) |
| Local | bag manufacturer in Delhi | Commercial (local) | `/about` + `/contact` + Google Business Profile | **No** location-page cloning | — | — | Hypothesis |

**Rules applied:** one distinct need per page; no near-duplicate pages for keyword variants; no doorway/location pages; category intros, product names and specs carry the secondary keywords naturally.

**International:** the FAQ says "Yes, we provide shipping across India" while the seed text says "worldwide". Decide what is true before targeting any country outside India. No hreflang is needed until separate regional pages exist.

---

## 3. Competitor observations (public pages, fetched 29 Oct 2026)

No rankings, traffic, backlink counts, keyword difficulty or volumes were available, and none are claimed.

| Competitor | Observed | Idea for Alyona Bags (verify before copying any practice) |
|---|---|---|
| **EcoCarry** (collection page fetched in full) | Navigation by **material and weight** ("Cotton Bags – 150 / 220 / 330 GSM", "Canvas Tote Bag", "Canvas Shopping Bag"); size and GSM in product names (e.g. "Plain 12x14 Inch Cotton Tote Bag \| 150 GSM"); separate pages for Bulk Order, FAQs, Wash Care, Sample Kits, Reviews, Blog; tiered discount banner; pagination as real `?page=N` links; WhatsApp "Send Inquiry" on sold-out items. | Put verified **size / GSM / material** in product names and specs; consider a Bulk Order page and a Wash Care FAQ; make catalogue pagination crawlable when it grows. |
| **Miniwesst** (fetched in full) | Breadcrumbs; colour and category filters; an explanatory text block *below* the product grid linking to sub-collections; "Corporate Gifting / Bulk Order" page in the main nav; occasion-based collections. Consumer handbag brand, so intent differs from B2B. | A short, genuinely useful category intro with links to related categories; a visible wholesale/corporate-gifting path in navigation. |
| **EcoRight** (fetched in full) | Short intro paragraph above the product list; product-type filter; very descriptive product alt text; consumer-focused title ("Buy Canvas Tote Bags for Women Online…"). | A 2–4 sentence category intro above the grid; descriptive, photo-specific alt text. |
| **Lavie World** (**snippet level only** — the page itself was not fetched in full; I used search excerpts) | Sub-collection pages with "About …" copy and Q&A blocks (e.g. small tote bag, pink tote bag); blog posts about tote designs. | Category-level FAQs where they answer real buyer questions. Treat as low-confidence. |

**Limits:** competitors are mostly consumer brands, so their keywords (e.g. "bags for women") are not your B2B intent. Their page structure is a prompt for your own research, not proof that a tactic works.

---

## 4. Questions only you can answer (I have not invented any of these)

1. **Shipping / dispatch / delivery:** which is true — "Ships within 3-5 business days; free shipping on bulk orders above the MOQ threshold" (product defaults) or "dispatch depends on quantity; delivery 5–10 days after dispatch" (FAQ)? Should the product defaults be removed so each product carries its own text?
2. **MOQ:** per product type, and separately for custom-printed orders. Price tiers?
3. **Samples:** FAQ says "paid samples may be available" — price and process?
4. **Printing:** methods offered (FAQ lists screen and heat transfer), colour limits, artwork formats (FAQ lists PDF, AI, EPS, SVG, PNG, JPG), lead time for printed orders.
5. **Materials:** cotton vs canvas, GSM, sizes, handle length, load capacity for each product line.
6. **"Manufacturer" claims:** are you the manufacturer, or do you source? ("Manufacturing partners trust for scale", "Premium Craftsmanship", "Built by manufacturers" appear on the homepage; "manufacturer" appears in the About title.)
7. **Eco / sustainability / certification claims:** the FAQ says "eco-conscious alternative". Do you hold any certification worth stating?
8. **Export:** India only, or worldwide?
9. **Positioning:** is the catalogue "tote bags" only, or also backpacks and travel bags? (affects the `/categories` title)
10. **Google Business Profile:** do you have one? Opening hours and a phone number you want published?
11. **Social links:** are Instagram / LinkedIn / Facebook URLs filled in under Admin → Settings? (they feed `sameAs`)

**Category intro template (write one per category in Admin → Categories → Description; shown on the page and used as the meta description):**
> [What this category is and who buys it — 1 sentence]. [Material / GSM / size range you can verify — 1 sentence]. [Customisation or printing available for this category, with the MOQ — 1 sentence]. [How to enquire — 1 sentence].

Keep the first 150 characters self-contained because that is what search results usually show.

---

## 5. Manual steps (need your accounts)

### Before anything else
1. **Deploy** the updated code (H1).
2. On the host, confirm environment variables: `PUBLIC_SITE_URL` (or leave production default `https://alyonabags.com`), `VITE_API_URL` (**build-time**; if the API is on a different host, *that* host's robots.txt controls rendering), `VITE_GA_MEASUREMENT_ID`, `GOOGLE_SITE_VERIFICATION`, `TRUST_PROXY`.
3. At your host/CDN: confirm `http://` → `https://` and `www` → non-`www` both return a single 301 hop.

### Google Search Console
1. Add a **Domain property** (DNS TXT) if you do not have one. A verification tag already appears on the live homepage, so a URL-prefix property may exist.
2. **Sitemaps → submit** `https://alyonabags.com/sitemap.xml`. Submission does not guarantee indexing.
3. **URL Inspection → Test live URL → View tested page** for: `/`, `/categories`, one category, one product, `/contact`, `/faq`. Confirm: crawl allowed = yes; indexing allowed = yes; the screenshot/HTML shows **products and categories** (this proves C1 is fixed); user-declared canonical = Google-selected canonical.
4. **Pages report:** look for "Blocked by robots.txt", "Duplicate, Google chose different canonical", "Crawled – currently not indexed".
5. **Settings → Crawl stats:** watch for 429 / 5xx responses (M7).
6. **Performance → Queries:** export the last 3 months — this is the real keyword data that replaces the Hypothesis labels in §2. Record a baseline (impressions, clicks, average position per page).
7. Request indexing for a few key URLs only after the live test passes (it is a request, not a guarantee).

### Google Analytics 4
1. Confirm `VITE_GA_MEASUREMENT_ID` was set at **build** time; check **Admin → DebugView** while browsing.
2. Confirm `page_view` fires on every client-side route change (the code sends one per path).
3. **Link GA4 ↔ Search Console** (Admin → Product links).
4. Decide on key events for enquiry-form submits and WhatsApp clicks (M8); update the Privacy Policy if tracking changes.

### Bing Webmaster Tools
Sign in → **Import from Google Search Console** → submit the sitemap. Optionally enable IndexNow.

### Schema
Run `/` and one product URL through **Google Rich Results Test** and **validator.schema.org**. Expect valid Organization/WebSite, Product/Offer and BreadcrumbList. Rich results are never guaranteed.

### Performance
Run **PageSpeed Insights** (mobile) on `/`, `/categories`, a category and a product. Record the LCP element and any CrUX field data (low-traffic sites may have none). Only then decide on M6 / Low items.

---

## 6. Recommendations (not implemented)

- **SSR / prerendering:** not recommended now. Google renders the JavaScript, the server already supplies correct metadata, canonical, JSON-LD and now a content fallback. Reconsider only if URL Inspection shows rendering problems or the Pages report shows content-related indexing issues.
- **Content to add once facts are confirmed:** a Wholesale & Bulk Orders page; a Custom Printing page; a cotton vs canvas / GSM buying guide; a care/wash FAQ. Add FAQs only where they answer real buyer questions. (FAQPage rich results are limited by Google to a small set of sites, so no FAQ schema was added.)
- **Product naming:** include verified size / GSM / material in product names (EcoCarry pattern) — edited in Admin → Products.
- **Do not** publish dozens of AI-generated pages, location pages or keyword variants.

### Safe link-building (manual, no purchased links)
Google Business Profile (if eligible); genuine business-directory listings you control; customer case studies with permission and a link to the product they bought; printers, packaging and fabric suppliers who can reference you; legitimate trade or sustainability publications where you can contribute real expertise. Never buy links or use link networks.

---

## 7. 30 / 60 / 90-day plan

**Days 1–30 — fix, verify, baseline**
- Deploy; complete §5 (GSC, Bing, GA4, host checks); verify C1 with URL Inspection.
- Answer §4; remove or correct the unverified product defaults (H6).
- Write category descriptions for every active category.
- Record baseline Search Console and PageSpeed numbers.

**Days 31–60 — build from confirmed facts**
- Publish the Wholesale & Bulk Orders page and, if justified, the Custom Printing page.
- Improve product names and specs (size, GSM, material); add descriptive, photo-specific alt text.
- Fix the top PageSpeed finding (likely hero / settings waterfall, M6) with measurement before and after.
- Start safe outreach (§6).

**Days 61–90 — learn and prune**
- Review Search Console queries per page; strengthen pages that rank on pages 2–3, merge or noindex anything that cannibalises.
- Publish 1–2 genuinely useful guides only if they are backed by real expertise.
- Make catalogue pagination crawlable if any category exceeds 12 products.
- Re-evaluate SSR/prerendering only if the data says it is needed.

---

## 8. Verification checklist

**After deploying (replace the host; these are read-only checks):**

| Check | How | Expect |
|---|---|---|
| robots.txt | open `/robots.txt` | `Allow` lines for the five `/api/…` paths, then `Disallow: /api/`, then the sitemap line |
| Sitemap | open `/sitemap.xml` | only active categories/products; absolute URLs on the canonical host |
| Home raw HTML | `curl -s https://alyonabags.com/` and look for `<noscript id="seo-fallback">` | an `<h1>`, description, category and product links |
| Product raw HTML | `curl -s https://alyonabags.com/products/<slug>` | product name `<h1>`, material, MOQ, category link inside the `<noscript>` |
| Private route | view source of `/cart` | `noindex, nofollow`, no canonical, no `<noscript id="seo-fallback">` |
| Private route header | `curl -sI https://alyonabags.com/admin/login` (also `/admin/dashboard`, `/cart`, `/my-orders`) | `200` with `x-robots-tag: noindex, nofollow` |
| Public route header | `curl -sI https://alyonabags.com/` and a product URL | no `x-robots-tag` header; page meta `index,follow` |
| Private API header | `curl -sI https://alyonabags.com/api/cart` | `401` with `x-robots-tag: noindex, nofollow`; `/api/products` has none |
| 404 | `curl -sI https://alyonabags.com/categories/does-not-exist` | `404`, `noindex` |
| Host redirect | `curl -sI https://www.alyonabags.com/categories` | one `301` to `https://alyonabags.com/categories` |
| Organization schema | Rich Results Test on `/` | Organization includes `logo`/`email`/`sameAs` only if set in Settings |
| UI | click a category in the sidebar; open `/categories/<real-slug>` and `/categories/does-not-exist` | link navigation works; real category shows its description; unknown shows "Page not found" |

**Commands for local testing (run by you):**
```bash
npm run build                      # repo root: installs deps and builds the frontend
cd backend && npm test             # includes the new robots / Organization / fallback tests
NODE_ENV=production node server.js # then curl the checks above against http://localhost:5000
```
For the host-redirect check locally use: `curl -sI -H "Host: www.alyonabags.com" http://localhost:5000/categories` (production mode, default `PUBLIC_SITE_URL`).

**Tools:** Google Search Console (URL Inspection, Pages, Sitemaps, Crawl stats), GA4 DebugView, Bing Webmaster Tools, Rich Results Test, validator.schema.org, PageSpeed Insights, `curl`.
