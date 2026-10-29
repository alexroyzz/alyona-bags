import { createClient } from "redis";

let redisClient;
let connectionPromise;

export const getRedisClient = () => {
  if (!redisClient) {
    const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;
    if (!REDIS_HOST) return null;

    redisClient = createClient({
      username: REDIS_USERNAME || "default",
      password: REDIS_PASSWORD || undefined,
      socket: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT) || 6379,
        reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
      },
    });
    redisClient.on("error", (error) => {
      console.error(`Redis connection error: ${error.message}`);
    });
    redisClient.on("ready", () => {
      if (process.env.NODE_ENV !== "production") console.log("Redis connected");
    });
  }
  return redisClient;
};

// Call once during application startup. A missing or unavailable Redis service
// leaves the application running and all cache operations fall back to MongoDB.
export const connectRedis = async () => {
  const client = getRedisClient();
  if (!client || client.isOpen) return client;
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      console.error(`Redis connection error: ${error.message}`);
      return null;
    }).finally(() => {
      connectionPromise = null;
    });
  }
  return connectionPromise;
};

export const invalidateRedisKeys = async (...patterns) => {
  const client = getRedisClient();
  if (!client?.isReady) return;

  try {
    const keys = [];
    for (const pattern of patterns) {
      for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key);
      }
    }
    if (keys.length) await client.del([...new Set(keys)]);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Redis cache invalidation error: ${error.message}`);
    }
  }
};

export const closeRedis = async () => {
  if (redisClient?.isOpen) await redisClient.quit().catch(() => {});
};
