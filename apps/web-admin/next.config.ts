import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** 설정 시 브라우저는 같은 출처(HTTPS)로만 요청 → Mixed Content 방지. EC2는 HTTP여도 됨. */
const adminApiUpstream = process.env.ADMIN_API_UPSTREAM?.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL ?? "http://localhost:3002",
    // 고객/앱회원 API용 - .env.local에 NEXT_PUBLIC_API_BASE_URL 없으면 5174 기본값
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5174/api/v1",
  },
  async rewrites() {
    if (!adminApiUpstream) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${adminApiUpstream}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
