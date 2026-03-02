import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis.internal:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});
