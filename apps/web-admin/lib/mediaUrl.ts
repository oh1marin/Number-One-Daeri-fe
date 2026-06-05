/** 상대 경로 이미지를 API 오리진 기준 절대 URL로 (앱·웹 resolveMediaUrl 과 동일 목적) */
export function resolveMediaUrl(url: string | undefined | null, apiBase: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const origin = apiBase.replace(/\/api\/v1\/?$/i, "").replace(/\/$/, "");
  if (!origin) return u;
  if (u.startsWith("/")) return `${origin}${u}`;
  return `${origin}/${u}`;
}
