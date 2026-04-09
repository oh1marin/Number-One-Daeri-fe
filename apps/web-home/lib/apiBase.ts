/**
 * NEXT_PUBLIC_API_BASE_URL:
 * - 권장: `http(s)://host/api/v1` (관리자·배포와 동일)
 * - 호환: `http://host:port` 만 있으면 `/api/v1` 를 붙임
 */
export function getApiV1Base(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5174";
  const b = raw.replace(/\/$/, "");
  if (b.endsWith("/api/v1")) return b;
  return `${b}/api/v1`;
}
