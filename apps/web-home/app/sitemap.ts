import type { MetadataRoute } from "next";
import { fetchNotices } from "@/lib/notices";
import { SITE_URL } from "@/lib/seo";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] =
  [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/services", priority: 0.9, changeFrequency: "monthly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
    { path: "/location", priority: 0.7, changeFrequency: "yearly" },
    { path: "/community", priority: 0.8, changeFrequency: "weekly" },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/refund", priority: 0.4, changeFrequency: "yearly" },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let noticeEntries: MetadataRoute.Sitemap = [];
  try {
    const notices = await fetchNotices();
    noticeEntries = notices.map((n) => ({
      url: `${SITE_URL}/community/${n.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // API 미연결 시 정적 페이지만 노출
  }

  return [...staticEntries, ...noticeEntries];
}
