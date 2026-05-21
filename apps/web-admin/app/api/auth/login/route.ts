import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/loginRateLimit";
import { getAdminApiUpstream } from "@/lib/adminAuthUrls";

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * POST /api/auth/login — BE /admin/auth/login 프록시 (Same-Origin, Rate limit)
 * Set-Cookie 는 BE 응답을 그대로 전달.
 */
export async function POST(request: NextRequest) {
  const rl = await checkLoginRateLimit(clientIp(request));
  if (rl.limited) {
    return NextResponse.json(
      {
        success: false,
        error: `로그인 시도가 너무 많습니다. ${rl.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const upstream = getAdminApiUpstream();
  if (!upstream) {
    return NextResponse.json(
      { success: false, error: "ADMIN_API_UPSTREAM 또는 NEXT_PUBLIC_API_BASE_URL 이 필요합니다." },
      { status: 503 },
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ success: false, error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  const target = `${upstream}/api/v1/admin/auth/login`;
  let beRes: Response;
  try {
    beRes = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "백엔드에 연결할 수 없습니다." },
      { status: 502 },
    );
  }

  const text = await beRes.text();
  const res = new NextResponse(text, {
    status: beRes.status,
    headers: { "Content-Type": beRes.headers.get("content-type") || "application/json" },
  });

  const setCookies =
    typeof beRes.headers.getSetCookie === "function"
      ? beRes.headers.getSetCookie()
      : beRes.headers.get("set-cookie")
        ? [beRes.headers.get("set-cookie")!]
        : [];

  for (const c of setCookies) {
    if (c) res.headers.append("Set-Cookie", c);
  }

  return res;
}
