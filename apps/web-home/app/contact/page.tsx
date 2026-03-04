"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // TODO: 실제 API 연결 (POST /support/inquiries)
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setForm({ name: "", email: "", content: "" });
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 to-blue-950 text-white py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-6 border border-blue-500/30">
            상담문의
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">무엇이든 물어보세요</h1>
          <p className="text-gray-300 text-lg">
            평일 09:00 – 18:00 내에 답변 드립니다.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">

          {/* 빠른 연락 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-3xl">📞</span>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">전화 문의</p>
                <p className="font-bold text-gray-900">1588-0000</p>
                <p className="text-xs text-gray-400">평일 09:00 – 18:00</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-3xl">✉️</span>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">이메일 문의</p>
                <a href="mailto:help@ride.kr" className="font-bold text-blue-600 hover:underline">
                  help@ride.kr
                </a>
                <p className="text-xs text-gray-400">24시간 접수</p>
              </div>
            </div>
          </div>

          {/* 폼 */}
          {status === "success" ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-2xl font-bold mb-3">문의가 접수되었습니다</h2>
              <p className="text-gray-500 mb-8">
                입력하신 이메일로 평일 09:00 – 18:00 내 답변 드리겠습니다.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                새 문의 작성
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold mb-2">1:1 상담 신청</h2>

              {/* 이름 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* 내용 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">
                  문의 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={6}
                  value={form.content}
                  onChange={handleChange}
                  placeholder="문의하실 내용을 자세히 적어주세요."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right">{form.content.length} / 1000</p>
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">오류가 발생했습니다. 다시 시도해주세요.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "제출 중..." : "문의 제출"}
              </button>

              <p className="text-xs text-gray-400 text-center">
                제출하신 정보는 문의 답변 외의 목적으로 사용되지 않습니다.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
