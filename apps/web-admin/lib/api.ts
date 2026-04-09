/** Admin API 호출 — `credentials: "include"`로 세션 쿠키 전송. Bearer는 레거시 호환용(토큰이 있을 때만). */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** 세션 쿠키 + (있으면) Bearer — 직접 fetch 할 때 사용 */
export function adminCredentialsInit(
  getAccessToken: () => string | null,
  init: RequestInit = {}
): RequestInit {
  const token = getAccessToken()?.trim();
  const baseHeaders: Record<string, string> = {
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) baseHeaders.Authorization = `Bearer ${token}`;
  return {
    ...init,
    credentials: "include",
    headers: baseHeaders,
  };
}

/** 응답 본문을 text로 읽은 뒤 JSON이면 파싱 (빈 본문·HTML 등에서도 메시지 유실 방지) */
export async function readAdminResponseBody(res: Response): Promise<{ json: unknown; rawText: string }> {
  const rawText = await res.text();
  const trimmed = rawText.trim();
  if (!trimmed) return { json: {}, rawText: "" };
  try {
    return { json: JSON.parse(rawText), rawText: trimmed };
  } catch {
    return { json: { message: trimmed }, rawText: trimmed };
  }
}

/** 백엔드 에러 JSON에서 사람이 읽을 메시지 추출 */
export function getAdminApiErrorMessage(json: unknown): string {
  if (json == null || typeof json !== "object") return "";
  const o = json as Record<string, unknown>;
  const pick = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  let s = pick(o.error) || pick(o.message) || pick(o.msg) || pick(o.detail);
  if (s) return s;
  const data = o.data;
  if (data != null && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    s = pick(d.error) || pick(d.message) || pick(d.msg);
    if (s) return s;
  }
  return "";
}

function isTrivialErrorBody(rawText: string): boolean {
  const t = rawText.trim();
  return t === "" || t === "{}" || t === "null" || t === "[]";
}

export function getAdminApiFailureMessage(res: Response, json: unknown, rawText: string): string {
  const fromJson = getAdminApiErrorMessage(json);
  if (fromJson) return fromJson;
  if (rawText && !isTrivialErrorBody(rawText)) {
    return rawText.length > 240 ? `${rawText.slice(0, 240)}…` : rawText;
  }
  if (res.status === 401 || res.status === 403) {
    return `접근이 거부되었습니다 (HTTP ${res.status}). 응답 본문이 없습니다. 로그인 후 세션 쿠키(httpOnly)가 내려오는지, CORS에 credentials가 허용되는지, 해당 경로가 관리자 미들웨어로 보호되는지 백엔드에서 확인하세요.`;
  }
  return res.statusText || "요청에 실패했습니다.";
}

/**
 * 로컬 스토리지 세션을 지울지 — HTTP 401/403만으로는 판단하지 않음.
 * (일부 라우트만 빈 401을 주면 오탐으로 전역 로그아웃되는 것을 방지)
 */
export function messageImpliesInvalidSession(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  const m = t.toLowerCase();
  if (/invalid[_\s-]*token|invalid_token|token[_\s-]*expired|jwt[_\s-]*expired|expired[_\s-]*token/.test(m)) {
    return true;
  }
  if (/unauthorized/.test(m) && /token|jwt|bearer|credential|인증/.test(t)) return true;
  if (/토큰/.test(t) && /유효하지|만료|불일치|없습|잘못/.test(t)) return true;
  if (/세션\s*만료|다시\s*로그인|로그인이\s*필요|만료된\s*접근/.test(t)) return true;
  return false;
}

export function shouldLogoutOnAdminApiError(_res: Response, message: string): boolean {
  return messageImpliesInvalidSession(message);
}

export function getAdminHeaders(getAccessToken: () => string | null): HeadersInit {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function adminFetch(
  path: string,
  options: RequestInit & { getAccessToken: () => string | null }
) {
  const { getAccessToken, ...init } = options;
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: { ...getAdminHeaders(getAccessToken), ...(init.headers as object) },
  });
  return res;
}
