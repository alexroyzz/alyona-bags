import express from "express";
import dotenv from "dotenv";
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
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { mongoInputGuard } from "./middleware/mongoInputGuard.js";

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
import { faqJsonLd } from "./utils/faqSchema.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGINS = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || CLIENT_ORIGINS[0] || "http://localhost:5173")
  .replace(/\/+$/, "");
const xmlEscape = (value) => String(value).replace(/[<>&"']/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;",
})[character]);
const htmlEscape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
})[character]);

const app = express();
const server = http.createServer(app);

// Set this to the exact proxy hop count when deployed behind a trusted proxy.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY === "true");
}

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        formAction: ["'self'", "https://api.razorpay.com"],
        frameAncestors: ["'self'"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        connectSrc: ["'self'", "https:"],
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
  message: { success: false, message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/users", authLimiter);
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

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cart\nDisallow: /checkout\nDisallow: /my-orders\nDisallow: /my-profile\nDisallow: /login\nDisallow: /register\nSitemap: ${PUBLIC_SITE_URL}/sitemap.xml\n`,
  );
});

app.get("/sitemap.xml", async (req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select("slug updatedAt").lean(),
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
    ]);
    const urls = [
      { loc: `${PUBLIC_SITE_URL}/`, lastmod: new Date() },
      { loc: `${PUBLIC_SITE_URL}/categories`, lastmod: new Date() },
      { loc: `${PUBLIC_SITE_URL}/about`, lastmod: new Date() },
      { loc: `${PUBLIC_SITE_URL}/contact`, lastmod: new Date() },
      { loc: `${PUBLIC_SITE_URL}/faq`, lastmod: new Date() },
      { loc: `${PUBLIC_SITE_URL}/privacy`, lastmod: new Date() },
      ...categories.map((category) => ({ loc: `${PUBLIC_SITE_URL}/categories/${encodeURIComponent(category.slug)}`, lastmod: category.updatedAt })),
      ...products.map((product) => ({ loc: `${PUBLIC_SITE_URL}/products/${encodeURIComponent(product.slug)}`, lastmod: product.updatedAt })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map(({ loc, lastmod }) => `<url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ""}</url>`)
      .join("")}</urlset>`;
    res.type("application/xml").set("Cache-Control", "public, max-age=1800").send(xml);
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

const frontendPath = path.resolve(__dirname, "dist");
const frontendIndexPath = path.join(frontendPath, "index.html");;
const hasFrontendBuild = existsSync(frontendIndexPath);
if (hasFrontendBuild) app.use(
  express.static(frontendPath, {
    index: false,
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
app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  if (!hasFrontendBuild) return next();
  res.set("Cache-Control", "no-cache");
  try {
    let html = await readFile(frontendIndexPath, "utf8");
    let metadata;
    const staticPages = {
      "/": { title: "Custom Cotton & Canvas Tote Bags | Alyona Bags", description: "Explore durable cotton and canvas bags from Alyona Bags, with customization options for wholesale, retail and business orders.", path: "/" },
      "/categories": { title: "Wholesale Tote Bags | Alyona Bags", description: "Browse cotton and canvas bags from Alyona Bags, with custom styles and wholesale options for your business.", path: "/categories" },
      "/about": { title: "About Alyona Bags | Cotton & Canvas Bag Manufacturer", description: "Meet Alyona Bags, a manufacturer of cotton and canvas bags for retailers, distributors and custom branding projects.", path: "/about" },
      "/contact": { title: "Contact Alyona Bags | Wholesale & Custom Orders", description: "Contact Alyona Bags about wholesale tote bags, custom printing, bulk orders and product enquiries.", path: "/contact" },
      "/faq": { title: "Frequently Asked Questions | Alyona Bags", description: "Answers about wholesale minimum quantities, customization, shipping, bulk quotes, payment and order tracking.", path: "/faq", jsonLd: faqJsonLd },
      "/privacy": { title: "Privacy Policy | Alyona Bags", description: "Learn how Alyona Bags uses account, order, contact and website information to provide its services.", path: "/privacy" },
      "/thank-you": { title: "Thank You | Alyona Bags", description: "Thank you for contacting Alyona Bags. Our team will review your enquiry.", path: "/thank-you", noindex: true },
      "/login": { title: "Sign In | Alyona Bags", description: "Sign in to your Alyona Bags customer account.", noindex: true },
      "/register": { title: "Create Account | Alyona Bags", description: "Create an Alyona Bags customer account to manage orders and checkout.", noindex: true },
      "/verify-email": { title: "Verify Email | Alyona Bags", description: "Verify your email address for your Alyona Bags account.", noindex: true },
      "/forgot-password": { title: "Forgot Password | Alyona Bags", description: "Request a password reset for your Alyona Bags account.", noindex: true },
      "/cart": { title: "Your Cart | Alyona Bags", description: "Review your Alyona Bags order and checkout details.", noindex: true },
      "/checkout": { title: "Checkout | Alyona Bags", description: "Complete your Alyona Bags order.", noindex: true },
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
    };
    const routePath = req.path.replace(/\/+$/, "") || "/";
    metadata = staticPages[routePath];
    if (!metadata && /^\/reset-password\/[^/]+$/.test(routePath)) {
      metadata = { title: "Reset Password | Alyona Bags", description: "Choose a new password for your Alyona Bags account.", noindex: true };
    }
    if (!metadata && /^\/my-orders\/[^/]+$/.test(routePath)) {
      metadata = { title: "Order Details | Alyona Bags", description: "View details for your Alyona Bags order.", noindex: true };
    }
    const productMatch = routePath.match(/^\/products\/([^/]+)$/);
    const categoryMatch = routePath.match(/^\/categories\/([^/]+)$/);

    if (!metadata && productMatch) {
      const requestedSlug = decodeURIComponent(productMatch[1]);
      const product = await Product.findOne({
        $or: [{ slug: requestedSlug }, { legacySlugs: requestedSlug }],
        isActive: true,
      }).lean();
      if (product) {
        if (requestedSlug !== product.slug) {
          return res.redirect(301, `/products/${encodeURIComponent(product.slug)}`);
        }
        const price = product.discountPrice > 0 && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;
        const description = String(product.description || `${product.name} from Alyona Bags.`).replace(/\s+/g, " ").slice(0, 155);
        metadata = {
          title: `${product.name.slice(0, 45)} | Alyona Bags`,
          description,
          path: `/products/${encodeURIComponent(product.slug)}`,
          image: product.images?.[0]?.url,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description,
            image: product.images?.map((image) => image.url).filter(Boolean),
            sku: product.sku || String(product._id),
            brand: { "@type": "Brand", name: "Alyona Bags" },
            ...(price > 0 ? {
              offers: {
                "@type": "Offer",
                priceCurrency: "INR",
                price,
                availability: product.stockStatus === "out_of_stock" || product.stockQuantity === 0
                  ? "https://schema.org/OutOfStock"
                  : product.stockStatus === "limited"
                    ? "https://schema.org/LimitedAvailability"
                    : "https://schema.org/InStock",
                url: `${PUBLIC_SITE_URL}/products/${encodeURIComponent(product.slug)}`,
                itemCondition: "https://schema.org/NewCondition",
              },
            } : {}),
          },
        };
      }
    } else if (!metadata && categoryMatch) {
      const category = await Category.findOne({ slug: decodeURIComponent(categoryMatch[1]), isActive: true }).lean();
      if (category) {
        metadata = {
          title: `${category.name.slice(0, 48)} | Alyona Bags`,
          description: String(category.description || "Browse Alyona Bags' cotton and canvas tote bag catalogue. Find customizable styles and wholesale options for your business.").replace(/\s+/g, " ").slice(0, 155),
          path: `/categories/${encodeURIComponent(category.slug)}`,
        };
      }
    }

    if (!metadata) {
      res.status(404);
      metadata = { title: "Page Not Found | Alyona Bags", description: "This Alyona Bags page could not be found. Browse the current bag collection or return to the home page.", noindex: true };
    }

    if (metadata) {
      const canonicalUrl = `${PUBLIC_SITE_URL}${metadata.path || routePath}`;
      html = html
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(metadata.title)}</title>`)
        .replace(/<meta\s+name="description"[\s\S]*?\/>/i, `<meta name="description" content="${htmlEscape(metadata.description)}" />`)
        .replace(/<meta\s+property="og:title"[^>]*\/>/i, `<meta property="og:title" content="${htmlEscape(metadata.title)}" />`)
        .replace(/<meta\s+property="og:description"[^>]*\/>/i, `<meta property="og:description" content="${htmlEscape(metadata.description)}" />`);
      const headTags = [
        metadata.noindex ? `<meta name="robots" content="noindex,nofollow" />` : `<link rel="canonical" href="${htmlEscape(canonicalUrl)}" />`,
        `<meta property="og:url" content="${htmlEscape(canonicalUrl)}" />`,
        metadata.image ? `<meta property="og:image" content="${htmlEscape(metadata.image)}" />` : "",
        `<meta name="twitter:title" content="${htmlEscape(metadata.title)}" />`,
        `<meta name="twitter:description" content="${htmlEscape(metadata.description)}" />`,
        metadata.image ? `<meta name="twitter:image" content="${htmlEscape(metadata.image)}" />` : "",
        process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${htmlEscape(process.env.GOOGLE_SITE_VERIFICATION)}" />` : "",
        metadata.jsonLd ? `<script id="page-json-ld" type="application/ld+json">${JSON.stringify(metadata.jsonLd).replace(/</g, "\\u003c")}</script>` : "",
      ].join("");
      html = html.replace("</head>", `${headTags}</head>`);
    }
    res.type("html").send(html);
  } catch (error) {
    next(error);
  }
});

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
