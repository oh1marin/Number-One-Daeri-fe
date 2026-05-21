import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let loginLimiter: Ratelimit | null | undefined;

function getLoginLimiter(): Ratelimit | null {
  if (loginLimiter !== undefined) return loginLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    loginLimiter = null;
    return null;
  }

  const requests = Number(process.env.ADMIN_LOGIN_RATE_LIMIT_PER_MINUTE || "10");
  const windowSec = Number(process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_SEC || "60");

  loginLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
    prefix: "ride-admin-login",
    analytics: false,
  });
  return loginLimiter;
}

export type LoginRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSec: number };

/** IP 기준 로그인 시도 제한. Upstash 미설정 시 제한 없음. */
export async function checkLoginRateLimit(ip: string): Promise<LoginRateLimitResult> {
  const limiter = getLoginLimiter();
  if (!limiter) return { limited: false };

  const key = ip || "unknown";
  const { success, reset } = await limiter.limit(key);
  if (success) return { limited: false };

  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { limited: true, retryAfterSec };
}

export function isLoginRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}
