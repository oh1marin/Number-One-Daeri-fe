"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { ContactIcons, SuccessIcon } from "@/components/Icons";
import { getApiV1Base } from "@/lib/apiBase";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", content: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${getApiV1Base()}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          content: form.content.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", content: "" });
        toast.success(data?.data?.message || "문의가 접수되었습니다.");
        return;
      }
      setStatus("error");
      const msg = data?.message || "오류가 발생했습니다. 다시 시도해주세요.";
      setErrorMsg(msg);
      toast.error(msg);
    } catch {
      setStatus("error");
      const msg = "네트워크 오류입니다. 다시 시도해주세요.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <>
      {/* Hero — help 배너, 문구 없음 */}
      <section className="relative overflow-hidden bg-blue-950 py-32 md:py-40 px-4 min-h-[320px] md:min-h-[400px] flex items-center justify-center">
        <img
          src="/images/help.png"
          alt="상담문의"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </section>

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">

          {/* 빠른 연락 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex-shrink-0">{ContactIcons.phone}</div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">대표전화</p>
                <a href="tel:1668-0001" className="font-bold text-gray-900 hover:text-blue-600">1668-0001</a>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex-shrink-0">{ContactIcons.email}</div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">이메일 문의</p>
                <a href="mailto:sj2mail2@gmail.com" className="font-bold text-blue-600 hover:underline">
                  sj2mail2@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* 폼 */}
          {status === "success" ? (
            <div className="text-center py-16">
              <div className="mb-6">{SuccessIcon}</div>
              <h2 className="text-2xl font-bold mb-3">문의가 접수되었습니다</h2>
              <p className="text-gray-500 mb-8">
                빠른 시일 내에 답변 드리겠습니다.
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
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="홍길동 (미입력 시 비공개)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* 전화번호 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  전화번호
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
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
                <p className="text-sm text-red-500">{errorMsg}</p>
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
