/**
 * NEXT_PUBLIC_API_BASE_URL:
 * - 권장: `http(s)://host/api/v1` (절대 URL)
 * - 호환: `http://host:port` 만 있으면 `/api/v1` 를 붙임
 *
 * 웹 홈(community) 서버 fetch는 **반드시 http(s) 절대 URL**이어야 함.
 * 관리자처럼 `/api/v1` 만 넣으면(상대 경로) web-home Next 서버가 자기 도메인으로 요청해 실패함.
 */
export function isAbsoluteHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

export function getApiV1Base(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5174";
  const b = raw.replace(/\/$/, "");
  if (b.endsWith("/api/v1")) return b;
  return `${b}/api/v1`;
}

/** `…/api/v1` 을 뗀 오리진 (백엔드 루트 `/notices` 폴백용) */
export function getApiOriginWithoutV1(): string {
  return getApiV1Base().replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "") || getApiV1Base();
}
