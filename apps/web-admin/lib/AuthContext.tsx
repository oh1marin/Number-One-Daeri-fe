"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AdminUser, getStoredAuth, setStoredAuth, clearStoredAuth } from "./auth";
import { allowMockAdminAuth } from "./adminEnv";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const AUTO_LOGOUT_MS = 60 * 60 * 1000; // 1시간
/** 백엔드 JWT_ACCESS_EXPIRES(기본 1h) 전에 선제 갱신 — 쿠키만 전송 */
const PROACTIVE_REFRESH_MS = 45 * 60 * 1000;

/** httpOnly 리프레시 쿠키만 사용(본문 토큰 없음). 성공 시 새 액세스·리프레시 쿠키 Set-Cookie */
async function postAdminSessionRefresh(): Promise<boolean> {
  if (!API_BASE?.trim()) return false;
  try {
    const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return false;
    const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return json?.success !== false;
  } catch {
    return false;
  }
}

/** GET /admin/auth/me — 401/403이면 refresh 1회 후 /me 재시도 */
async function fetchAdminMeWithRefresh(): Promise<Response> {
  const me = await fetch(`${API_BASE}/admin/auth/me`, {
    credentials: "include",
  });
  if (me.status === 401 || me.status === 403) {
    const refreshed = await postAdminSessionRefresh();
    if (refreshed) {
      return fetch(`${API_BASE}/admin/auth/me`, {
        credentials: "include",
      });
    }
  }
  return me;
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  /** @deprecated 쿠키 세션만 사용. 항상 `null` — Bearer는 httpOnly 쿠키로만 전송 */
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 로그인/가입 `data`: `data.admin` 또는 플랫 `data` { id, email, name } */
function adminFromAuthData(data: unknown): AdminUser | null {
  if (data == null || typeof data !== "object") return null;
  const p = data as Record<string, unknown>;
  const raw = p.admin ?? p;
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const email = String(o.email ?? "");
  if (!email) return null;
  const id = String(o.id ?? "");
  const name = String(o.name ?? "");
  return { id: id || email, email, name: name || email.split("@")[0] };
}

function parseMePayload(json: unknown): AdminUser | null {
  if (json == null || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const payload = (root.data ?? root) as Record<string, unknown>;
  const admin = (payload.admin ?? payload) as Record<string, unknown> | null;
  if (!admin || typeof admin !== "object") return null;
  const id = String(admin.id ?? "");
  const email = String(admin.email ?? "");
  const name = String(admin.name ?? "");
  if (!email) return null;
  return { id: id || email, email, name: name || email.split("@")[0] };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      const stored = getStoredAuth();
      if (!stored?.admin) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (!API_BASE?.trim()) {
        if (!cancelled) {
          setUser(stored.admin);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetchAdminMeWithRefresh();
        if (res.ok) {
          const json = await res.json();
          const me = parseMePayload(json);
          if (me) {
            setStoredAuth({ admin: me });
            if (!cancelled) setUser(me);
          } else if (!cancelled) setUser(stored.admin);
        } else if (res.status === 401 || res.status === 403) {
          clearStoredAuth();
          if (!cancelled) setUser(null);
        } else if (!cancelled) {
          setUser(stored.admin);
        }
      } catch {
        if (!cancelled) setUser(stored.admin);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      return { ok: false, error: "이메일과 비밀번호를 입력하세요." };
    }
    if (API_BASE?.trim()) {
      try {
        const res = await fetch(`${API_BASE}/admin/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const json = await res.json();
        if (!json.success || !res.ok) {
          const msg = json.error || "로그인에 실패했습니다.";
          const hint = res.status === 401 ? " (백엔드: /admin/auth/login 은 인증 없이 공개되어야 합니다)" : "";
          return { ok: false, error: msg + hint };
        }
        const u = adminFromAuthData(json.data ?? json);
        if (u) {
          setStoredAuth({ admin: u });
          setUser(u);
          return { ok: true };
        }
        return { ok: false, error: "로그인 응답 형식이 올바르지 않습니다." };
      } catch {
        return { ok: false, error: "네트워크 오류가 발생했습니다." };
      }
    }
    if (!allowMockAdminAuth()) {
      return {
        ok: false,
        error:
          "API 주소(NEXT_PUBLIC_API_BASE_URL)가 없습니다. 로컬에서만 모의 로그인을 쓰려면 .env에 NEXT_PUBLIC_ALLOW_MOCK_AUTH=true 를 추가하세요.",
      };
    }
    const mockUser: AdminUser = { id: "1", email: email.trim(), name: email.split("@")[0] };
    setStoredAuth({ admin: mockUser });
    setUser(mockUser);
    return { ok: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      return { ok: false, error: "이메일, 비밀번호, 이름을 모두 입력해주세요." };
    }
    const emailTrim = email.trim();
    const nameTrim = name.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailTrim)) return { ok: false, error: "올바른 이메일 형식이 아닙니다." };
    if (password.length < 6) return { ok: false, error: "비밀번호는 6자 이상이어야 합니다." };
    if (nameTrim.length < 2) return { ok: false, error: "이름은 2자 이상이어야 합니다." };
    if (API_BASE?.trim()) {
      try {
        const res = await fetch(`${API_BASE}/admin/auth/register`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailTrim, password, name: nameTrim }),
        });
        const json = await res.json();
        if (!json.success || !res.ok) {
          const msg = json.error || "회원가입에 실패했습니다.";
          const hint = res.status === 401 ? " (백엔드: /admin/auth/register 는 인증 없이 공개되어야 합니다)" : "";
          return { ok: false, error: msg + hint };
        }
        const u = adminFromAuthData(json.data ?? json);
        if (u) {
          setStoredAuth({ admin: u });
          setUser(u);
          return { ok: true };
        }
        return { ok: false, error: "회원가입 응답 형식이 올바르지 않습니다." };
      } catch {
        return { ok: false, error: "네트워크 오류가 발생했습니다." };
      }
    }
    if (!allowMockAdminAuth()) {
      return {
        ok: false,
        error:
          "API 주소가 없거나 모의 가입이 비활성화되어 있습니다. NEXT_PUBLIC_API_BASE_URL 또는 NEXT_PUBLIC_ALLOW_MOCK_AUTH=true 를 확인하세요.",
      };
    }
    const mockUser: AdminUser = { id: "1", email: email.trim(), name: nameTrim };
    setStoredAuth({ admin: mockUser });
    setUser(mockUser);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (API_BASE?.trim()) {
      try {
        await fetch(`${API_BASE}/admin/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        /* ignore */
      }
    }
    clearStoredAuth();
    setUser(null);
  }, []);

  const getAccessToken = useCallback((): string | null => null, []);

  useEffect(() => {
    if (!user) return;
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events: (keyof WindowEventMap)[] = ["click", "keydown", "mousemove", "scroll", "focus"];
    events.forEach((ev) => window.addEventListener(ev, updateActivity));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (!user) return;
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= AUTO_LOGOUT_MS) {
        logout();
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [user, logout]);

  useEffect(() => {
    if (!API_BASE?.trim()) return;
    if (!user) return;

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetchAdminMeWithRefresh();
        if (!res.ok && (res.status === 401 || res.status === 403)) {
          if (!cancelled) logout();
        }
      } catch {
        /* ignore */
      }
    }

    verify();
    const id = setInterval(verify, 5 * 60 * 1000);
    const refreshId = setInterval(() => {
      void postAdminSessionRefresh();
    }, PROACTIVE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearInterval(refreshId);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
