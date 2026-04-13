import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchNoticeById } from "@/lib/notices";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const notice = await fetchNoticeById(id);
  if (!notice) return { title: "공지사항 | 일등대리" };
  return { title: `${notice.title} | 일등대리` };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await fetchNoticeById(id);
  if (!notice) notFound();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 to-blue-950 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          {notice.coverImageUrl ? (
            <div className="mb-8 rounded-xl overflow-hidden border border-white/10 shadow-lg max-h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={notice.coverImageUrl}
                alt=""
                className="w-full h-full max-h-64 object-cover"
              />
            </div>
          ) : null}
          <Link
            href="/community"
            className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-6 transition"
          >
            ← 공지사항 목록
          </Link>
          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full mb-4 ${notice.badgeColor}`}>
            {notice.badge}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{notice.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{notice.date}</span>
            <span>👁 {(notice.views ?? 0).toLocaleString()}회 조회</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-gray max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-12">{notice.content}</div>

          {(notice.events?.length ?? 0) > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                상세 내용
              </h2>
              <ul className="space-y-6">
                {(notice.events ?? []).map((evt, i) => (
                  <li key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold sm:mt-1">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-4">
                      {evt.imageUrl ? (
                        <div className="shrink-0 w-full sm:w-40 rounded-lg overflow-hidden border border-gray-200 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={evt.imageUrl} alt="" className="w-full h-28 sm:h-full sm:min-h-[7rem] object-cover" />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{evt.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{evt.date}</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{evt.desc}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
          >
            ← 목록으로
          </Link>
        </div>
      </article>
    </>
  );
}
