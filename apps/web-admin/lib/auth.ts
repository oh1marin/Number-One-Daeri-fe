/** 관리자 페이지 인증 — 세션은 httpOnly 쿠키, 여기에는 프로필(비밀 아님)만 저장 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

/** 로컬에 두는 값: 로그인 직후·새로고침 시 UI용 프로필만 (액세스/리프레시 토큰은 저장하지 않음) */
export interface StoredAuth {
  admin: AdminUser;
}

const AUTH_KEY = "ride_admin_auth";

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { admin?: AdminUser; accessToken?: unknown; refreshToken?: unknown };
    if (!parsed?.admin) return null;
    const next: StoredAuth = { admin: parsed.admin };
    if ("accessToken" in parsed || "refreshToken" in parsed) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ admin: auth.admin }));
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}

/** 로그인으로 간주: 저장된 프로필이 있으면 true (실제 권한은 쿠키 + 백엔드 검증) */
export function hasAdminWebSession(): boolean {
  return Boolean(getStoredAuth()?.admin);
}
