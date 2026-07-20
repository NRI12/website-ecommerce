import "server-only";
import Redis from "ioredis";

let client: Redis | null = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      // Rate limiting is best-effort; swallow connection errors so a Redis
      // outage never blocks login/registration.
    });
  }
  return client;
}

/**
 * Sliding-window-ish fixed-window rate limiter. Returns true if the action
 * should be allowed. Fails open (allows the request) if Redis is unavailable.
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: limit };

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
