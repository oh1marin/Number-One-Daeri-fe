"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, RotateCw, Send, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchInquiryDetail,
  sendAdminInquiryMessage,
  type InquiryDetail,
  type InquiryMessage,
} from "@/lib/inquiriesAdminApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatTime(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = h < 12 ? "오전" : "오후";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${ampm} ${hour}:${min}`;
  } catch {
    return "";
  }
}

function formatDate(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${y}년 ${m}월 ${day}일 ${weekdays[d.getDay()]}요일`;
  } catch {
    return "";
  }
}

function getDateKey(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return "";
  }
}

function UserAppIcon({ size = 36 }: { size?: number }) {
  const r = Math.round(size * 0.28);
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
        boxShadow: "0 2px 6px rgba(99,102,241,0.35)",
      }}
    >
      <Smartphone
        strokeWidth={1.8}
        style={{ width: size * 0.52, height: size * 0.52, color: "#fff" }}
      />
    </div>
  );
}

export default function InquiryDetailPage() {
  const params = useParams();
  const id = useMemo(() => {
    const raw = params.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw[0];
    return "";
  }, [params.id]);

  const { getAccessToken } = useAuth();

  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [draft, setDraft] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  const load = useCallback(
    async (quiet = false) => {
      const token = getAccessToken();
      if (!API_BASE || !token || !id) {
        setDetail(null);
        setLoading(false);
        setError(!id ? "잘못된 경로입니다." : !API_BASE ? "API 주소가 없습니다." : "로그인이 필요합니다.");
        return;
      }
      if (!quiet) setLoading(true);
      const res = await fetchInquiryDetail(getAccessToken, id);
      if (!res.ok) {
        setError(res.message);
        setDetail(null);
        setLoading(false);
        return;
      }
      setError(null);
      setDetail(res.data);
      setLoading(false);
    },
    [getAccessToken, id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // 4초 폴링 (조용하게)
  useEffect(() => {
    if (!id) return;
    const t = window.setInterval(() => load(true), 4000);
    return () => window.clearInterval(t);
  }, [id, load]);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [detail?.messages?.length]);

  // 첫 로드 시 즉시 스크롤
  useEffect(() => {
    if (!loading && detail) scrollToBottom("instant");
  }, [loading]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  async function handleSend() {
    if (!detail) return;
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    const res = await sendAdminInquiryMessage(getAccessToken, detail.id, text);
    setSending(false);

    if (!res.ok) {
      setToast({ text: res.message, ok: false });
      return;
    }
    setDraft("");
    setToast({ text: "전송되었습니다.", ok: true });
    await load(true);
    // 텍스트에어리아 포커스 유지
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // 텍스트에어리아 높이 자동 조절
  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 h-14 border-b border-indigo-100 bg-white">
          <Link href="/inquiries" className="text-gray-500 hover:text-indigo-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-gray-400">로딩 중...</span>
        </div>
        <div
          className="flex-1 flex items-center justify-center"
          style={{ background: "#e5e7eb" }}
        >
          <p className="text-gray-400 text-sm">대화를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6">
        <Link href="/inquiries" className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </Link>
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  const u = detail.user;
  const userName = u?.name ?? u?.phone ?? "고객";
  const sorted = detail.messages
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* 토스트 */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-lg text-sm font-medium transition-all ${
            toast.ok ? "bg-gray-800 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* 채팅 헤더 */}
      <header
        className="flex items-center gap-3 px-4 h-14 text-white flex-shrink-0"
        style={{ background: "linear-gradient(90deg,#4f46e5 0%,#6d28d9 100%)" }}
      >
        <Link href="/inquiries" className="text-white/70 hover:text-white transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <UserAppIcon size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{userName}</p>
          {u?.phone && <p className="text-xs text-white/60 leading-tight">{u.phone}</p>}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          title="새로고침"
          className={`text-white/70 hover:text-white transition ${refreshing ? "animate-spin" : ""}`}
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </header>

      {/* 에러 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">
          {error}
        </div>
      )}

      {/* 메시지 영역 */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: "#e5e7eb" }}
      >
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-black/20 text-white text-xs px-4 py-1.5 rounded-full">
              아직 메시지가 없습니다.
            </div>
          </div>
        ) : (
          (() => {
            const elements: React.ReactNode[] = [];
            let lastDateKey = "";

            sorted.forEach((m, idx) => {
              const dateKey = getDateKey(m.createdAt);
              const isAdmin = m.sender === "admin";
              const prevMsg = idx > 0 ? sorted[idx - 1] : null;
              const nextMsg = idx < sorted.length - 1 ? sorted[idx + 1] : null;

              // 날짜 구분선
              if (dateKey && dateKey !== lastDateKey) {
                lastDateKey = dateKey;
                elements.push(
                  <div key={`date-${dateKey}`} className="flex items-center justify-center my-4">
                    <span className="bg-white/70 text-gray-600 text-[11px] px-3 py-1 rounded-full font-medium">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                );
              }

              // 같은 발신자·분 단위로 묶음 처리
              const sameAsPrev =
                prevMsg?.sender === m.sender &&
                getDateKey(prevMsg.createdAt) === dateKey &&
                Math.abs(
                  new Date(m.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
                ) < 60_000;

              const sameAsNext =
                nextMsg?.sender === m.sender &&
                getDateKey(nextMsg?.createdAt ?? "") === dateKey &&
                Math.abs(
                  new Date(nextMsg.createdAt).getTime() - new Date(m.createdAt).getTime()
                ) < 60_000;

              const showTime = !sameAsNext;
              const showAvatar = !isAdmin && !sameAsPrev;

              elements.push(
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"} ${
                    sameAsPrev ? "mt-0.5" : "mt-3"
                  }`}
                >
                  {/* 고객 아바타 (앱 아이콘 스타일) */}
                  {!isAdmin && (
                    <div className="flex-shrink-0 w-9 flex items-end">
                      {showAvatar ? <UserAppIcon size={36} /> : null}
                    </div>
                  )}

                  {/* 시간 + 말풍선 */}
                  <div className={`flex items-end gap-1.5 max-w-[72%] ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                    {/* 말풍선 */}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                        isAdmin ? "text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm"
                      }`}
                      style={isAdmin ? { background: "linear-gradient(135deg,#818cf8,#6366f1)" } : undefined}
                    >
                      {m.content}
                    </div>
                    {/* 시간 */}
                    {showTime && (
                      <span className="text-[10px] text-gray-500 flex-shrink-0 mb-0.5">
                        {formatTime(m.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            });

            return elements;
          })()
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* 입력 영역 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요… (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            className="flex-1 resize-none px-3.5 py-2.5 border border-gray-200 rounded-2xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition overflow-hidden leading-relaxed"
            style={{ minHeight: "44px" }}
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)" }}
          >
            <Send className="w-4 h-4 text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
