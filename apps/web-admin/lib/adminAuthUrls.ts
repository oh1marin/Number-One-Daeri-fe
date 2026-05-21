/**
 * 관리자 로그인 URL — same-origin 프록시 시 Rate limit·쿠키 SameSite 유리.
 * NEXT_PUBLIC_USE_ADMIN_AUTH_PROXY=true 이면 /api/auth/login (middleware·Route Handler)
 */
export function getAdminLoginUrl(): string {
  if (process.env.NEXT_PUBLIC_USE_ADMIN_AUTH_PROXY === "true") {
    return "/api/auth/login";
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "") || "";
  return base ? `${base}/admin/auth/login` : "/api/auth/login";
}

export function getAdminApiUpstream(): string {
  return (
    process.env.ADMIN_API_UPSTREAM?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "").replace(/\/api\/v1$/, "") ||
    ""
  );
}
