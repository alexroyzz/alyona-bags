import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROBOTS_NOINDEX, buildNoscriptFallback, buildRobotsTxt, buildSitemapXml, getPublicSiteUrl, isPrivateApiPath, isPrivatePath } from "../utils/seo.js";
import { buildProductStructuredData, buildSiteStructuredData } from "../../shared/structuredData.mjs";
import { googleMapsEmbedUrl, safeWebUrl } from "../../frontend/src/utils/contactLinks.js";

test("production canonical origin defaults to the live site and ignores path segments", () => {
  assert.equal(getPublicSiteUrl({ nodeEnv: "production" }), "https://alyonabags.com");
  assert.equal(getPublicSiteUrl({ publicSiteUrl: "https://shop.example.test/catalog/" }), "https://shop.example.test");
});

test("robots lets crawlers read page noindex directives and points to the canonical sitemap", () => {
  const robots = buildRobotsTxt("https://alyonabags.com");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/api\//);
  assert.doesNotMatch(robots, /Disallow: \/(admin|cart|login|register|my-orders)/);
  assert.match(robots, /Sitemap: https:\/\/alyonabags\.com\/sitemap\.xml/);
});

test("sitemap contains public canonical URLs and only active dynamic records with real lastmod dates", () => {
  const xml = buildSitemapXml({
    siteUrl: "https://alyonabags.com",
    categories: [
      { slug: "cotton-bags", isActive: true, updatedAt: "2026-10-01T12:00:00Z" },
      { slug: "hidden", isActive: false, updatedAt: "2026-10-02T12:00:00Z" },
    ],
    products: [
      { slug: "blue-cotton-tote", isActive: true, updatedAt: "2026-10-03T12:00:00Z" },
      { slug: "draft", isActive: false, updatedAt: "2026-10-04T12:00:00Z" },
    ],
  });
  assert.match(xml, /https:\/\/alyonabags\.com\//);
  assert.match(xml, /https:\/\/alyonabags\.com\/reviews/);
  assert.match(xml, /https:\/\/alyonabags\.com\/categories\/cotton-bags/);
  assert.match(xml, /https:\/\/alyonabags\.com\/products\/blue-cotton-tote/);
  assert.match(xml, /<lastmod>2026-10-03<\/lastmod>/);
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locations.some((url) => /hidden|draft|admin|checkout/.test(url)), false);
  assert.equal(locations.some((url) => /[?#]/.test(url)), false);
  assert.doesNotMatch(xml, /<lastmod>2026-10-28<\/lastmod>/);
});

test("customer reviews have a navbar link, public route, canonical SEO metadata, and sitemap entry", () => {
  const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");
  const app = read("../../frontend/src/App.jsx");
  const navbar = read("../../frontend/src/components/Navbar.jsx");
  const routeSeo = read("../../frontend/src/components/RouteSeo.jsx");
  const server = read("../server.js");
  assert.match(app, /path="\/reviews"/);
  assert.match(navbar, /to: "\/reviews", label: "Reviews"/);
  assert.match(routeSeo, /"\/reviews"/);
  assert.match(server, /"\/reviews": \{ title: "Customer Reviews \| Alyona Bags"/);
  assert.match(buildSitemapXml({ siteUrl: "https://alyonabags.com" }), /https:\/\/alyonabags\.com\/reviews/);
});

test("product schema includes aggregate ratings only when real approved reviews exist", () => {
  const product = { _id: "p1", slug: "canvas-tote", name: "Canvas Tote", price: 100, images: [] };
  const withReviews = buildProductStructuredData({
    siteUrl: "https://alyonabags.com",
    product,
    description: "Canvas tote bag.",
    ratingSummary: { ratingValue: 4.5, reviewCount: 2 },
  });
  const productNode = withReviews["@graph"].find((node) => node["@type"] === "Product");
  assert.deepEqual(productNode.aggregateRating, { "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 2 });
  assert.equal(productNode.url, "https://alyonabags.com/products/canvas-tote");
  assert.equal("sku" in productNode, false);

  const withoutReviews = buildProductStructuredData({ siteUrl: "https://alyonabags.com", product, description: "Canvas tote bag." });
  const productWithoutReviews = withoutReviews["@graph"].find((node) => node["@type"] === "Product");
  assert.equal("aggregateRating" in productWithoutReviews, false);
});

test("product schema includes only verified identifiers, images, and purchasable offers", () => {
  const product = {
    slug: "canvas-tote",
    name: "Canvas Tote",
    description: "Canvas tote bag.",
    sku: "CANVAS-001",
    price: 100,
    onlinePaymentEnabled: true,
    stockStatus: "in_stock",
    images: [
      { url: "https://images.example.test/canvas-tote.jpg" },
      { url: "javascript:alert(1)" },
    ],
  };
  const productNode = buildProductStructuredData({
    siteUrl: "https://alyonabags.com",
    product,
    description: product.description,
  })["@graph"].find((node) => node["@type"] === "Product");
  assert.equal(productNode.sku, "CANVAS-001");
  assert.deepEqual(productNode.image, ["https://images.example.test/canvas-tote.jpg"]);
  assert.equal(productNode.offers.price, 100);

  const wholesaleOnly = buildProductStructuredData({
    siteUrl: "https://alyonabags.com",
    product: { ...product, onlinePaymentEnabled: false },
    description: product.description,
  })["@graph"].find((node) => node["@type"] === "Product");
  assert.equal("offers" in wholesaleOnly, false);
});

test("configurable social and map links reject unsafe protocols and unexpected map hosts", () => {
  assert.equal(safeWebUrl("javascript:alert(1)"), "");
  assert.equal(safeWebUrl("https://social.example.test/page"), "https://social.example.test/page");
  assert.equal(googleMapsEmbedUrl("https://www.google.com/maps?output=embed"), "https://www.google.com/maps?output=embed");
  assert.equal(googleMapsEmbedUrl("https://maps.google.com/maps/embed?pb=test"), "https://maps.google.com/maps/embed?pb=test");
  assert.equal(googleMapsEmbedUrl("https://example.test/maps/embed"), "");
});

test("robots keeps the public JSON endpoints that render the storefront crawlable while private APIs stay blocked", () => {
  const robots = buildRobotsTxt("https://alyonabags.com");
  for (const path of ["/api/products", "/api/categories", "/api/settings", "/api/about", "/api/reviews"]) {
    assert.ok(robots.split("\n").includes("Allow: " + path), "missing Allow for " + path);
  }
  assert.ok(robots.split("\n").includes("Disallow: /api/"));
  assert.doesNotMatch(robots, /Allow: \/api\/(cart|orders|users|auth|payment|upload|admin|enquiries|health)/);
});

test("organization structured data contains only details that were actually provided", () => {
  const bare = buildSiteStructuredData("https://alyonabags.com");
  const bareOrganization = bare["@graph"].find((node) => node["@type"] === "Organization");
  assert.equal(bareOrganization.description, "Alyona Bags is a B2B wholesale bag supplier specializing in cotton and canvas tote bags, custom printing, and bulk bag solutions.");
  assert.equal("contactPoint" in bareOrganization, false);

  const rich = buildSiteStructuredData("https://alyonabags.com", {
    logo: "https://res.cloudinary.com/demo/image/upload/logo.png",
    email: " hello@example.test ",
    sameAs: ["https://www.instagram.com/example", "javascript:alert(1)", "https://www.instagram.com/example", ""],
  });
  const organization = rich["@graph"].find((node) => node["@type"] === "Organization");
  assert.equal(organization.logo, "https://res.cloudinary.com/demo/image/upload/logo.png");
  assert.equal(organization.email, "hello@example.test");
  assert.deepEqual(organization.contactPoint, { "@type": "ContactPoint", email: "hello@example.test" });
  assert.deepEqual(organization.sameAs, ["https://www.instagram.com/example"]);
  const website = rich["@graph"].find((node) => node["@type"] === "WebSite");
  assert.equal(website.publisher["@id"], "https://alyonabags.com/#organization");
});

test("public AI agent guide documents only discovered public routes and authorization boundaries", () => {
  const guide = readFileSync(new URL("../../frontend/public/agents.md", import.meta.url), "utf8");
  assert.match(guide, /https:\/\/alyonabags\.com\/categories/);
  assert.match(guide, /https:\/\/alyonabags\.com\/products/);
  assert.match(guide, /https:\/\/alyonabags\.com\/contact/);
  assert.match(guide, /Never submit an enquiry, contact the business, or initiate a purchase.*without their explicit authorization/);
  assert.match(guide, /Do not claim that Alyona Bags provides an AI shopping API, UCP, or MCP integration/);
});

test("crawler fallback escapes content, skips empty facts, and links to real pages", () => {
  const html = buildNoscriptFallback({
    heading: "Tote <b>",
    description: "A & B",
    facts: [["Material", "Cotton"], ["Minimum order quantity", ""]],
    categoryLinks: [{ name: "Cotton Bags", path: "/categories/cotton-bags" }],
    productLinks: [{ name: 'Blue "Tote"', path: "/products/blue-tote" }],
  });
  assert.match(html, /^<noscript id="seo-fallback">/);
  assert.match(html, /<h1>Tote &lt;b&gt;<\/h1>/);
  assert.match(html, /<p>A &amp; B<\/p>/);
  assert.match(html, /<li>Material: Cotton<\/li>/);
  assert.doesNotMatch(html, /Minimum order quantity/);
  assert.match(html, /<a href="\/categories\/cotton-bags">Cotton Bags<\/a>/);
  assert.match(html, /Blue &quot;Tote&quot;/);
  assert.match(html, /<a href="\/contact">/);
  assert.doesNotMatch(html, /<script/i);
});

test("private storefront and admin paths are recognised, public pages are not", () => {
  assert.equal(ROBOTS_NOINDEX, "noindex, nofollow");
  for (const path of ["/admin", "/admin/login", "/admin/dashboard", "/admin/anything/else", "/Admin/Login/", "/login", "/register", "/verify-email", "/forgot-password", "/reset-password/abc", "/cart", "/checkout", "/order-success", "/order-failure", "/my-orders", "/my-orders/123", "/my-profile", "/thank-you"]) {
    assert.equal(isPrivatePath(path), true, path + " should be private");
  }
  for (const path of ["/", "/categories", "/categories/cotton-bags", "/products/blue-cotton-tote", "/products/cart", "/about", "/contact", "/reviews", "/faq", "/privacy", "/terms-and-conditions", "/administrator-bags"]) {
    assert.equal(isPrivatePath(path), false, path + " should be public");
  }
});

test("private API responses get noindex while the public render endpoints do not", () => {
  for (const path of ["/api/admin/reviews", "/api/auth/me", "/api/cart", "/api/orders/mine", "/api/users/me", "/api/payment/razorpay/order", "/api/upload/logo", "/api/enquiries", "/api/reviews/mine", "/api/health"]) {
    assert.equal(isPrivateApiPath(path), true, path + " should be private");
  }
  for (const path of ["/api/products", "/api/products/blue-cotton-tote", "/api/categories", "/api/settings", "/api/about", "/api/reviews"]) {
    assert.equal(isPrivateApiPath(path), false, path + " should stay indexable/renderable");
  }
});

test("sitemap never lists private URLs even when a record slug would resolve to one", () => {
  const xml = buildSitemapXml({
    siteUrl: "https://alyonabags.com",
    categories: [{ slug: "cotton-bags", isActive: true }],
    products: [{ slug: "blue-cotton-tote", isActive: true }],
  });
  const locations = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  assert.ok(locations.includes("/") && locations.includes("/faq") && locations.includes("/about"));
  assert.equal(locations.some((path) => isPrivatePath(path)), false);
});

test("server sends noindex as meta and X-Robots-Tag for private routes without a robots.txt block", () => {
  const server = readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /res\.set\("X-Robots-Tag", ROBOTS_NOINDEX\)/);
  assert.match(server, /isPrivatePath\(req\.path\) \|\| isPrivateApiPath\(req\.path\)/);
  assert.match(server, /metadata\.noindex \? ROBOTS_NOINDEX/);
  assert.doesNotMatch(buildRobotsTxt("https://alyonabags.com"), /admin/i);
});
