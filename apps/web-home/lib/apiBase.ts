/**
 * NEXT_PUBLIC_API_BASE_URL — 브라우저(문의 폼 등)에서도 필요하면 반드시 설정.
 *
 * 서버(RSC)에서만: RIDE_API_BASE_URL 또는 API_SERVER_BASE_URL (Vercel Environment Variables)
 * → NEXT_PUBLIC 없이도 공지 SSR이 백엔드로 갈 수 있음. 값 추가 후 재배포 필수.
 *
 * 웹 홈에는 관리자용 `/api/v1` 상대 경로 리라이트가 없으므로, 운영은 http(s) 절대 URL 권장.
 */

function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, "").trim();
}

/** 서버에서 백엔드 베이스(스킴 포함) 후보 — 따옴표 제거 */
export function getBackendBaseForServer(): string {
  return stripQuotes(
    process.env.RIDE_API_BASE_URL?.trim() ||
      process.env.API_SERVER_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
      ""
  );
}

/**
 * 공지 등 서버 fetch용: 서버 env → 로컬 개발 기본값.
 * (프로덕션에서 비어 있으면 API 연동 안 함)
 */
export function getServerApiBaseRaw(): string {
  const s = getBackendBaseForServer();
  if (s) return s;
  if (process.env.NODE_ENV === "development") return "http://localhost:5174";
  return "";
}

export function isAbsoluteHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

export function getApiV1Base(): string {
  const isBrowser = typeof window !== "undefined";
  const raw =
    stripQuotes(
      (isBrowser
        ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
        : getBackendBaseForServer() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) || ""
    ) || "http://localhost:5174";
  const b = raw.replace(/\/$/, "");
  if (b.endsWith("/api/v1")) return b;
  return `${b}/api/v1`;
}

/** `…/api/v1` 을 뗀 오리진 (백엔드 루트 `/notices` 폴백용) */
export function getApiOriginWithoutV1(): string {
  return getApiV1Base().replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "") || getApiV1Base();
}
