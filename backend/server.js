import "./config/loadEnv.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { connectRedis, closeRedis } from "./config/redis.js";
import migrateProductSlugs from "./utils/migrateProductSlugs.js";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Settings from "./models/Settings.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { mongoInputGuard } from "./middleware/mongoInputGuard.js";
import { buildBreadcrumbStructuredData, buildProductStructuredData, buildSiteStructuredData } from "./shared/structuredData.mjs";
import { cloudinaryImageUrl, cloudinarySrcSet } from "./shared/cloudinaryImage.mjs";
import { ROBOTS_NOINDEX, buildNoscriptFallback, buildRobotsTxt, buildSitemapXml, getPublicSiteUrl, isPrivateApiPath, isPrivatePath } from "./utils/seo.js";
import { faqItems } from "./shared/faq.mjs";
import { CATALOGUE_HEADING, HOME_HEADING } from "./shared/pageMeta.mjs";
import { createRateLimitHandler } from "./middleware/authRateLimiters.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import aboutRoutes from "./routes/aboutRoutes.js";
import publicReviewRoutes from "./routes/publicReviewRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { getProductRatingSummary } from "./controllers/reviewController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGINS = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const PUBLIC_SITE_URL = getPublicSiteUrl({
  publicSiteUrl: process.env.PUBLIC_SITE_URL,
  clientUrl: process.env.CLIENT_URL,
  nodeEnv: process.env.NODE_ENV,
});
const htmlEscape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
})[character]);

const app = express();
const server = http.createServer(app);

// Set this to the exact proxy hop count when deployed behind a trusted proxy.
const trustProxySetting = process.env.TRUST_PROXY?.trim().toLowerCase();
if (trustProxySetting && trustProxySetting !== "false" && trustProxySetting !== "0") {
  if (!/^\d+$/.test(trustProxySetting) || Number(trustProxySetting) < 1) {
    throw new Error("TRUST_PROXY must be unset/false or the exact positive trusted proxy hop count (for example, 1).");
  }
  app.set("trust proxy", Number(trustProxySetting));
}

app.disable("x-powered-by");

// Send the alternate www/non-www host to the canonical origin with a permanent
// redirect so search engines consolidate on one host. Only the exact
// "www." <-> apex counterpart of PUBLIC_SITE_URL is redirected, in production.
const CANONICAL_HOSTNAME = new URL(PUBLIC_SITE_URL).hostname;
const ALTERNATE_HOSTNAME = CANONICAL_HOSTNAME.startsWith("www.")
  ? CANONICAL_HOSTNAME.slice(4)
  : "www." + CANONICAL_HOSTNAME;
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    (req.method === "GET" || req.method === "HEAD") &&
    !req.path.startsWith("/api/") &&
    req.hostname === ALTERNATE_HOSTNAME
  ) {
    return res.redirect(301, PUBLIC_SITE_URL + req.originalUrl);
  }
  return next();
});
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        formAction: ["'self'", "https://api.razorpay.com"],
        frameAncestors: ["'self'"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com", "https://www.google.com", "https://accounts.google.com/gsi/", "https://maps.google.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://www.googletagmanager.com", "https://accounts.google.com/gsi/client"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com/gsi/style"],
        connectSrc: ["'self'", "https:", "https://accounts.google.com/gsi/"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CLIENT_ORIGINS.includes(origin)) return callback(null, true);
      const error = new Error("Origin is not allowed by CORS");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
  }),
);

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/health"),
  handler: createRateLimitHandler("Too many API requests.", Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000),
});

app.use("/api", apiLimiter);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(mongoInputGuard);

if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

const health = (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const status = dbReady ? "ok" : "degraded";
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    status,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbReady ? "connected" : "disconnected",
    memoryUsageBytes: process.memoryUsage().rss,
  });
};

// Liveness can be monitored without requiring MongoDB; readiness includes MongoDB state.
app.get("/api/health/live", (req, res) => {
  res.json({ success: true, status: "alive", uptimeSeconds: Math.floor(process.uptime()) });
});
app.get("/api/health/ready", health);
app.get("/api/health", health);

// Send the noindex directive as an HTTP header too, so crawlers get it for every
// private route (admin, auth, cart/checkout, orders, account, thank-you) and
// private API response regardless of how the body renders: this covers the
// HTML shell, redirects, error responses and non-HTML content. It is not a
// security control; admin pages and APIs are protected by authentication.
// These paths must stay crawlable (no robots.txt Disallow) so Google can read it.
app.use((req, res, next) => {
  if (isPrivatePath(req.path) || isPrivateApiPath(req.path)) {
    res.set("X-Robots-Tag", ROBOTS_NOINDEX);
  }
  next();
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(buildRobotsTxt(PUBLIC_SITE_URL));
});

app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select("slug updatedAt isActive").lean(),
      Category.find({ isActive: true }).select("slug updatedAt isActive").lean(),
    ]);
    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=1800")
      .send(buildSitemapXml({ siteUrl: PUBLIC_SITE_URL, products, categories }));
  } catch (error) {
    next(error);
  }
});
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/users", userAuthRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", publicReviewRoutes);
app.use("/api/admin/reviews", reviewRoutes);

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api/")) return next();

  const query = req.originalUrl.slice(req.path.length);
  if (req.path === "/checkout") return res.redirect(301, "/cart" + query);
  if (req.path.length > 1 && req.path.endsWith("/")) {
    return res.redirect(301, req.path.replace(/\/+$/, "") + query);
  }
  next();
});
const frontendPath = path.resolve(__dirname, "dist");
const frontendIndexPath = path.join(frontendPath, "index.html");
const hasFrontendBuild = existsSync(frontendIndexPath);
if (hasFrontendBuild) app.use(
  express.static(frontendPath, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(`${path.sep}index.html`)) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (
        filePath.includes(`${path.sep}assets${path.sep}`) &&
        /-[\w-]{8,}\./.test(path.basename(filePath))
      ) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  }),
);
// Short-lived in-memory cache so crawler traffic on HTML routes does not add a
// database query per request. Keys are fixed names or validated category ids.
const memoCache = new Map();
const memoAsync = async (key, ttlMs, loader) => {
  const hit = memoCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  memoCache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
};
const FALLBACK_TTL_MS = 60 * 1000;
const loadCategoryLinks = () => memoAsync("fallback:categories", FALLBACK_TTL_MS, async () => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).select("name slug").lean();
  return categories.filter((c) => c.slug).map((c) => ({ name: c.name, path: "/categories/" + encodeURIComponent(c.slug) }));
});
const loadProductLinks = (key, filter = {}) => memoAsync("fallback:products:" + key, FALLBACK_TTL_MS, async () => {
  const products = await Product.find({ isActive: true, ...filter }).sort({ createdAt: -1 }).limit(48).select("name slug").lean();
  return products.filter((p) => p.slug).map((p) => ({ name: p.name, path: "/products/" + encodeURIComponent(p.slug) }));
});
const plainText = (value, maxLength) => String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const safePublicImageUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
};

const renderHtmlRoute = async (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  if (!hasFrontendBuild) return next();
  res.set("Cache-Control", "no-cache");

  try {
    let html = await readFile(frontendIndexPath, "utf8");
    const staticPages = {
      "/": { heading: HOME_HEADING, title: "Custom Cotton & Canvas Tote Bags | Alyona Bags", description: "Shop durable cotton and canvas tote bags from Alyona Bags. Explore custom printing, wholesale options, and bag styles for retailers, brands, and events.", path: "/" },
      "/categories": { heading: CATALOGUE_HEADING, title: "Wholesale Tote Bags | Alyona Bags", description: "Browse cotton and canvas bags from Alyona Bags, with custom styles and wholesale options for your business.", path: "/categories" },
      "/about": { title: "About Alyona Bags | Cotton & Canvas Bag Manufacturer", description: "Meet Alyona Bags, a manufacturer of durable cotton and canvas bags for retailers, distributors, and custom branding projects.", path: "/about" },
      "/contact": { title: "Contact Alyona Bags | Wholesale & Custom Orders", description: "Contact Alyona Bags about wholesale tote bags, custom printing, bulk orders, and product enquiries.", path: "/contact" },
      "/reviews": { title: "Customer Reviews | Alyona Bags", description: "Read customer reviews of Alyona Bags products and share your own experience with our bags.", path: "/reviews" },
      "/faq": { title: "Frequently Asked Questions | Alyona Bags", description: "Answers about Alyona Bags wholesale minimum quantities, customization, shipping, bulk quotes, payment and order tracking.", path: "/faq" },
      "/privacy": { title: "Privacy Policy | Alyona Bags", description: "How Alyona Bags collects and uses account, order, payment, enquiry and website information, and how to make a privacy request.", path: "/privacy" },
      "/terms-and-conditions": { title: "Terms & Conditions | Alyona Bags", description: "Terms for using the Alyona Bags website: products and pricing, orders and payments, shipping in India, returns and refunds, accounts and contact details.", path: "/terms-and-conditions" },
      "/thank-you": { title: "Thank You | Alyona Bags", description: "Thank you for contacting Alyona Bags. Our team will review your enquiry.", noindex: true },
      "/login": { title: "Sign In | Alyona Bags", description: "Sign in to your Alyona Bags customer account.", noindex: true },
      "/register": { title: "Create Account | Alyona Bags", description: "Create an Alyona Bags customer account to manage orders and checkout.", noindex: true },
      "/verify-email": { title: "Verify Email | Alyona Bags", description: "Verify your email address for your Alyona Bags account.", noindex: true },
      "/forgot-password": { title: "Forgot Password | Alyona Bags", description: "Request a password reset for your Alyona Bags account.", noindex: true },
      "/cart": { title: "Your Cart | Alyona Bags", description: "Review your Alyona Bags order and checkout details.", noindex: true },
      "/order-success": { title: "Order Confirmed | Alyona Bags", description: "Your Alyona Bags order confirmation.", noindex: true },
      "/order-failure": { title: "Payment Update | Alyona Bags", description: "Review the payment status for your Alyona Bags order.", noindex: true },
      "/my-orders": { title: "My Orders | Alyona Bags", description: "View your Alyona Bags order history and delivery status.", noindex: true },
      "/my-profile": { title: "My Account | Alyona Bags", description: "Manage your Alyona Bags account and saved addresses.", noindex: true },
      "/admin/login": { title: "Admin Sign In | Alyona Bags", description: "Alyona Bags administration sign in.", noindex: true },
      "/admin/dashboard": { title: "Admin Dashboard | Alyona Bags", description: "Alyona Bags administration dashboard.", noindex: true },
      "/admin/products": { title: "Manage Products | Alyona Bags", description: "Manage the Alyona Bags product catalogue.", noindex: true },
      "/admin/categories": { title: "Manage Categories | Alyona Bags", description: "Manage Alyona Bags product categories.", noindex: true },
      "/admin/orders": { title: "Manage Orders | Alyona Bags", description: "Manage Alyona Bags customer orders.", noindex: true },
      "/admin/enquiries": { title: "Manage Enquiries | Alyona Bags", description: "Manage customer enquiries for Alyona Bags.", noindex: true },
      "/admin/settings": { title: "Site Settings | Alyona Bags", description: "Manage Alyona Bags site settings.", noindex: true },
      "/admin/about": { title: "Manage About Page | Alyona Bags", description: "Manage the Alyona Bags about page.", noindex: true },
      "/admin/reviews": { title: "Manage Reviews | Alyona Bags", description: "Moderate customer reviews for Alyona Bags.", noindex: true },
    };

    const routePath = req.path.replace(/\/+$/, "") || "/";
    let metadata = staticPages[routePath];
    if (!metadata && /^\/reset-password\/[^/]+$/.test(routePath)) {
      metadata = { title: "Reset Password | Alyona Bags", description: "Choose a new password for your Alyona Bags account.", noindex: true };
    }
    if (!metadata && /^\/my-orders\/[^/]+$/.test(routePath)) {
      metadata = { title: "Order Details | Alyona Bags", description: "View details for your Alyona Bags order.", noindex: true };
    }

    const productMatch = routePath.match(/^\/products\/([^/]+)$/);
    const categoryMatch = routePath.match(/^\/categories\/([^/]+)$/);
    const decodeSegment = (value) => {
      try { return decodeURIComponent(value); }
      catch { return null; }
    };

    if (!metadata && productMatch) {
      const requestedSlug = decodeSegment(productMatch[1]);
      const product = requestedSlug ? await Product.findOne({
        $or: [{ slug: requestedSlug }, { legacySlugs: requestedSlug }],
        isActive: true,
      }).populate("category", "name slug").lean() : null;

      if (product) {
        if (requestedSlug !== product.slug) {
          const query = req.originalUrl.slice(req.path.length);
          return res.redirect(301, "/products/" + encodeURIComponent(product.slug) + query);
        }

        const price = product.discountPrice > 0 && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;
        const description = String(product.description || (product.name + " from Alyona Bags."))
          .replace(/\s+/g, " ").slice(0, 155);
        const productRating = await getProductRatingSummary(product._id);
        const ratingSummary = productRating.count ? {
          reviewCount: productRating.count,
          ratingValue: productRating.averageRating,
        } : null;

        metadata = {
          title: product.name.slice(0, 45) + " | Alyona Bags",
          description,
          path: "/products/" + encodeURIComponent(product.slug),
          image: safePublicImageUrl(product.images?.[0]?.url),
          imageAlt: product.name + " product image",
          type: "product",
          fallback: {
            heading: product.name,
            description: plainText(product.description, 1500) || description,
            facts: [
              ["Material", product.material],
              ["Minimum order quantity", product.moq],
              ["Category", product.category?.name],
            ],
            categoryLinks: product.category?.slug && product.category?.name
              ? [{ name: product.category.name, path: "/categories/" + encodeURIComponent(product.category.slug) }]
              : [],
          },
          preload: product.images?.[0]?.url ? {
            href: cloudinaryImageUrl(product.images[0].url, 1200),
            srcSet: cloudinarySrcSet(product.images[0].url, [480, 800, 1200, 1600]),
            sizes: "(max-width: 767px) 100vw, 55vw",
          } : null,
          jsonLd: buildProductStructuredData({
            siteUrl: PUBLIC_SITE_URL,
            product,
            description,
            ratingSummary,
          }),
        };
      }
    } else if (!metadata && categoryMatch) {
      const requestedSlug = decodeSegment(categoryMatch[1]);
      const category = requestedSlug ? await Category.findOne({
        slug: requestedSlug,
        isActive: true,
      }).lean() : null;

      if (category) {
        const categoryPath = "/categories/" + encodeURIComponent(category.slug);
        const categoryIntro = plainText(category.description, 1500);
        const categoryProductLinks = await loadProductLinks("category:" + category._id, { category: category._id })
          .catch(() => []);
        metadata = {
          fallback: {
            heading: category.name,
            description: categoryIntro || undefined,
            productLinks: categoryProductLinks,
          },
          title: category.name.slice(0, 48) + " | Alyona Bags",
          description: String(category.description || "Browse Alyona Bags' cotton and canvas tote bag catalogue. Find customizable styles and wholesale options for your business.")
            .replace(/\s+/g, " ").slice(0, 155),
          path: categoryPath,
          image: safePublicImageUrl(category.image?.url),
          jsonLd: buildBreadcrumbStructuredData(PUBLIC_SITE_URL, [
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
            { name: category.name, path: categoryPath },
          ]),
        };
      }
    }

    if (!metadata) {
      res.status(404);
      metadata = {
        title: "Page Not Found | Alyona Bags",
        description: "This Alyona Bags page could not be found. Browse the current bag collection or return to the home page.",
        noindex: true,
      };
    }

    const settings = metadata.noindex
      ? null
      : await memoAsync("settings", FALLBACK_TTL_MS, () =>
        Settings.findOne().select("heroBanner logo email socialLinks").lean()).catch(() => null);
    if (!metadata.noindex && !metadata.image) {
      metadata.image = safePublicImageUrl(settings?.heroBanner?.url);
      metadata.imageAlt = "Alyona Bags products";
    }
    if (!metadata.noindex && routePath === "/" && metadata.image) {
      metadata.preload = {
        href: cloudinaryImageUrl(metadata.image, 1920),
        srcSet: cloudinarySrcSet(metadata.image, [960, 1440, 1920, 2560]),
        sizes: "100vw",
      };
    }

    const canonicalUrl = new URL(metadata.path || routePath, PUBLIC_SITE_URL + "/").href;
    const replaceOrAppend = (pattern, tag) => {
      let found = false;
      html = html.replace(pattern, () => { found = true; return tag; });
      if (!found) html = html.replace("</head>", tag + "</head>");
    };
    const removeTag = (pattern) => { html = html.replace(pattern, ""); };
    const metaPattern = (attribute, key) => new RegExp("<meta\\b(?=[^>]*\\b" + attribute + "=[\\\"']" + key + "[\\\"'])[^>]*>", "i");
    const linkPattern = (rel) => new RegExp("<link\\b(?=[^>]*\\brel=[\\\"']" + rel + "[\\\"'])[^>]*>", "i");
    const scriptPattern = (id) => new RegExp("<script\\b(?=[^>]*\\bid=[\\\"']" + id + "[\\\"'])[\\s\\S]*?<\\/script>", "i");
    const idPattern = (id) => new RegExp("<(?:link|script)\\b(?=[^>]*\\bid=[\\\"']" + id + "[\\\"'])[^>]*>(?:[\\s\\S]*?<\\/script>)?", "i");
    const setMeta = (attribute, key, content) => replaceOrAppend(
      metaPattern(attribute, key),
      '<meta ' + attribute + '="' + key + '" content="' + htmlEscape(content) + '" />',
    );

    replaceOrAppend(/<title>[\s\S]*?<\/title>/i, "<title>" + htmlEscape(metadata.title) + "</title>");
    setMeta("name", "description", metadata.description);
    setMeta("name", "site-origin", PUBLIC_SITE_URL);
    setMeta("name", "robots", metadata.noindex ? ROBOTS_NOINDEX : "index,follow");
    if (metadata.noindex) res.set("X-Robots-Tag", ROBOTS_NOINDEX);
    setMeta("property", "og:type", metadata.type || "website");
    setMeta("property", "og:site_name", "Alyona Bags");
    setMeta("property", "og:title", metadata.title);
    setMeta("property", "og:description", metadata.description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("name", "twitter:card", metadata.image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", metadata.title);
    setMeta("name", "twitter:description", metadata.description);
    if (metadata.noindex) {
      removeTag(linkPattern("canonical"));
    } else {
      replaceOrAppend(
        linkPattern("canonical"),
        '<link rel="canonical" href="' + htmlEscape(canonicalUrl) + '" />',
      );
    }

    if (metadata.image) {
      setMeta("name", "default-social-image", metadata.image);
      setMeta("property", "og:image", metadata.image);
      setMeta("name", "twitter:image", metadata.image);
      setMeta("property", "og:image:alt", metadata.imageAlt || metadata.title);
      setMeta("name", "twitter:image:alt", metadata.imageAlt || metadata.title);
    } else {
      removeTag(metaPattern("name", "default-social-image"));
      removeTag(metaPattern("property", "og:image"));
      removeTag(metaPattern("name", "twitter:image"));
      removeTag(metaPattern("property", "og:image:alt"));
      removeTag(metaPattern("name", "twitter:image:alt"));
    }

    if (process.env.GOOGLE_SITE_VERIFICATION) {
      setMeta("name", "google-site-verification", process.env.GOOGLE_SITE_VERIFICATION);
    }

    // Organization details come only from values the owner entered in Settings
    // (and that the storefront already displays); nothing is invented here.
    const organizationProfile = {
      logo: safePublicImageUrl(settings?.logo?.url),
      email: typeof settings?.email === "string" && EMAIL_PATTERN.test(settings.email.trim()) ? settings.email.trim() : "",
      sameAs: Object.values(settings?.socialLinks || {}).map((url) => safePublicImageUrl(url)).filter(Boolean),
    };
    const siteJsonLd = '<script id="site-json-ld" type="application/ld+json">' +
      JSON.stringify(buildSiteStructuredData(PUBLIC_SITE_URL, organizationProfile)).replace(/</g, "\\u003c") + "</script>";
    if (metadata.noindex) {
      removeTag(scriptPattern("site-json-ld"));
    } else {
      replaceOrAppend(scriptPattern("site-json-ld"), siteJsonLd);
    }
    if (metadata.jsonLd) {
      const pageJsonLd = '<script id="page-json-ld" type="application/ld+json">' +
        JSON.stringify(metadata.jsonLd).replace(/</g, "\\u003c") + "</script>";
      replaceOrAppend(scriptPattern("page-json-ld"), pageJsonLd);
    } else {
      removeTag(scriptPattern("page-json-ld"));
    }

    if (metadata.preload?.href) {
      const preload = '<link id="page-image-preload" rel="preload" as="image" href="' +
        htmlEscape(metadata.preload.href) + '" imagesrcset="' + htmlEscape(metadata.preload.srcSet || "") +
        '" imagesizes="' + htmlEscape(metadata.preload.sizes || "100vw") + '" fetchpriority="high" />';
      replaceOrAppend(idPattern("page-image-preload"), preload);
    } else {
      removeTag(idPattern("page-image-preload"));
    }

    html = html.replace(/<noscript id="seo-fallback">[\s\S]*?<\/noscript>/i, "");
    if (!metadata.noindex) {
      // "About Alyona Bags | Cotton & Canvas Bag Manufacturer" -> "About Alyona Bags"
      const headingFromTitle = (title) => String(title || "").split(" | ")[0].trim();
      const fallbackInput = {
        heading: metadata.heading || headingFromTitle(metadata.title),
        description: metadata.description,
        ...(metadata.fallback || {}),
      };
      if (!fallbackInput.description) fallbackInput.description = metadata.description;
      if (routePath === "/" || routePath === "/categories") {
        const [categoryLinks, productLinks] = await Promise.all([
          loadCategoryLinks().catch(() => []),
          loadProductLinks("all").catch(() => []),
        ]);
        fallbackInput.categoryLinks = categoryLinks;
        fallbackInput.productLinks = productLinks;
      }
      if (routePath === "/faq") fallbackInput.qa = faqItems;
      const noscript = buildNoscriptFallback(fallbackInput);
      html = /<div id="root"><\/div>/i.test(html)
        ? html.replace(/<div id="root"><\/div>/i, (root) => root + noscript)
        : html.replace("</body>", () => noscript + "</body>");
    }

    res.type("html").send(html);
  } catch (error) {
    next(error);
  }
};

app.get("*", renderHtmlRoute);
app.use(notFound);
app.use(errorHandler);

// Bound slow requests and idle sockets. Headers timeout must exceed request timeout.
server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS) || 120000;
server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS) || 125000;
server.timeout = Number(process.env.SOCKET_TIMEOUT_MS) || 120000;
server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS) || 5000;

let shuttingDown = false;
let retryShouldStop = false;
const shutdown = async (signal, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  retryShouldStop = true;
  console.log(`${signal} received; shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out; closing active connections.");
    server.closeAllConnections?.();
    process.exit(1);
  }, Number(process.env.SHUTDOWN_TIMEOUT_MS) || 15000);
  forceExit.unref();

  if (server.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect().catch((error) => {
    console.error(`MongoDB disconnect error: ${error.message}`);
    exitCode = 1;
  });
  await closeRedis();
  clearTimeout(forceExit);
  process.exitCode = exitCode;
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  void shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  void shutdown("uncaughtException", 1);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  void connectRedis();
  connectDB({ shouldStop: () => retryShouldStop })
    .catch((error) => {
      console.error(`Database startup failed: ${error.message}`);
      void shutdown("database startup failure", 1);
    })
    .then(async (connection) => {
      if (!connection) return;
      try {
        await migrateProductSlugs();
      } catch (error) {
        console.error(`Product slug migration failed: ${error.message}`);
      }
    });
});
