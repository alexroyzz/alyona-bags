import { createHash } from "node:crypto";
import { getRedisClient } from "../config/redis.js";

const CACHE_TTL_SECONDS = 300;
const isDevelopment = () => process.env.NODE_ENV !== "production";

const cacheKeyFor = (req) => {
  if (req.baseUrl.endsWith("/categories")) {
    const hash = createHash("sha256").update(req.originalUrl).digest("hex");
    return `categories:${hash}`;
  }
  const slug = req.params.slug;
  if (slug) return `products:item:${encodeURIComponent(slug)}`;
  const hash = createHash("sha256").update(req.originalUrl).digest("hex");
  return `products:list:${hash}`;
};

// Redis caches only successful public JSON GET responses. Authenticated/admin
// requests bypass Redis, and Redis failures always continue through to MongoDB.
export const cachePublic = async (req, res, next) => {
  if (req.headers.authorization || req.admin) {
    res.set("Cache-Control", "private, no-store");
    return next();
  }

  res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  if (!req.baseUrl.endsWith("/products") && !req.baseUrl.endsWith("/categories")) {
    return next();
  }
  const client = getRedisClient();
  const key = cacheKeyFor(req);
  if (client?.isReady) {
    try {
      const cached = await client.get(key);
      if (cached) {
        if (isDevelopment()) console.log(`Redis cache HIT ${key}`);
        const entry = JSON.parse(cached);
        return res.status(entry.status || 200).json(entry.body);
      }
    } catch (error) {
      if (isDevelopment()) console.error(`Redis cache read error: ${error.message}`);
    }
  }
  if (isDevelopment()) console.log(`Redis cache MISS ${key}`);

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (client?.isReady && res.statusCode >= 200 && res.statusCode < 300) {
      const entry = JSON.stringify({ status: res.statusCode, body });
      void client.setEx(key, CACHE_TTL_SECONDS, entry).catch((error) => {
        if (isDevelopment()) console.error(`Redis cache write error: ${error.message}`);
      });
    }
    return sendJson(body);
  };
  return next();
};

export { CACHE_TTL_SECONDS };
