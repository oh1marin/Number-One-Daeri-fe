import type { NextRequest } from "next/server";

/** middleware·Route Handler 공용 */
export const AUTH_PUBLIC_PATHS = ["/login", "/signup"] as const;

/** BE 로그인 Set-Cookie (Number-One-Daeri-be): ride_admin_at, ride_admin_rt */
const DEFAULT_SESSION_COOKIE_NAMES = [
  "ride_admin_at",
  "ride_admin_rt",
  "admin_refresh",
  "admin_access",
];

export function getSessionCookieNames(): string[] {
  const raw = process.env.ADMIN_SESSION_COOKIE_NAMES?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_SESSION_COOKIE_NAMES;
}

/** httpOnly 세션 쿠키 존재 여부 (이름은 BE·ADMIN_SESSION_COOKIE_NAMES 에 맞게 조정) */
export function hasAdminSessionCookie(request: NextRequest): boolean {
  const names = new Set(getSessionCookieNames().map((n) => n.toLowerCase()));
  for (const name of request.cookies.getAll().map((c) => c.name)) {
    if (names.has(name.toLowerCase())) return true;
  }
  return false;
}

export function isAuthPublicPath(pathname: string): boolean {
  return (AUTH_PUBLIC_PATHS as readonly string[]).includes(pathname);
}

export function isStaticOrInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

/** 로그인 Rate limit 대상 (관리자 Next 앱 기준) */
export const LOGIN_RATE_LIMIT_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/v1/admin/auth/login",
] as const;

export function isLoginRateLimitPath(pathname: string, method: string): boolean {
  if (pathname === "/login" && method === "GET") return true;
  if (method !== "POST") return false;
  return pathname === "/api/auth/login" || pathname === "/api/v1/admin/auth/login";
}

export function shouldSkipAuthMiddleware(): boolean {
  if (process.env.ADMIN_MIDDLEWARE_AUTH === "false") return true;
  // mock 로그인은 httpOnly 쿠키가 없음 → 개발 시 middleware 인증 생략
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === "true"
  ) {
    return true;
  }
  return false;
}
