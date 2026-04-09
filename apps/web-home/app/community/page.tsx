import type { Metadata } from "next";
import Link from "next/link";
import { fetchNotices } from "@/lib/notices";

export const metadata: Metadata = {
  title: "공지사항 | 일등대리",
};

export default async function CommunityPage() {
  const notices = await fetchNotices();
  return (
    <>
      {/* Hero — 넓은 배너 이미지, 비율 유지하여 전체 노출 */}
      <section className="relative overflow-hidden bg-blue-950 py-32 md:py-40 px-4 min-h-[320px] md:min-h-[400px] flex items-center justify-center">
        <img
          src="/images/GongG.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden
        />
        <h1 className="relative text-2xl md:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-center">
          일등대리의 공지사항을 확인하세요
        </h1>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <section>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
            {notices.map((n) => (
              <Link
                key={n.id}
                href={`/community/${n.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
              >
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${n.badgeColor}`}>
                  {n.badge}
                </span>
                <p className="flex-1 font-medium text-sm truncate">{n.title}</p>
                <div className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-3">
                  <span>👁 {n.views.toLocaleString()}</span>
                  <span>{n.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
