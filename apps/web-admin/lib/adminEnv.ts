/**
 * 관리자 앱 공개 환경 플래그 (NEXT_PUBLIC_* / NODE_ENV).
 * 쿠폰 API와 무관 — 인증·회원가입 UI 제어용.
 */

export function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production";
}

/** 개발 전용: API 베이스 없이 mock 토큰 로그인 (운영에서는 항상 false) */
export function allowMockAdminAuth(): boolean {
  if (isProductionBuild()) return false;
  return process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === "true";
}

/** 회원가입 UI·라우트 비활성화 (운영에서는 항상 true) */
export function isAdminSignupDisabled(): boolean {
  if (isProductionBuild()) return true;
  return process.env.NEXT_PUBLIC_DISABLE_ADMIN_SIGNUP === "true";
}
