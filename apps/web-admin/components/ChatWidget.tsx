"use client";

import { hasAdminWebSession } from "@/lib/auth";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MessageCircle,
  X,
  Send,
  ChevronLeft,
  RotateCw,
  Minus,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useInquiryNotifier } from "@/lib/useInquiryNotifier";
import {
  fetchInquiriesList,
  fetchInquiryDetail,
  sendAdminInquiryMessage,
  type InquiryListItem,
  type InquiryDetail,
} from "@/lib/inquiriesAdminApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/* ─────────────────────── helpers ─────────────────────── */

function formatTime(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = h < 12 ? "오전" : "오후";
    return `${ampm} ${h % 12 === 0 ? 12 : h % 12}:${min}`;
  } catch { return ""; }
}

function formatDate(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}요일`;
  } catch { return ""; }
}

function getDateKey(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch { return ""; }
}

function formatListTime(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
    if (diffMin < 1) return "방금";
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}시간 전`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch { return ""; }
}

/* ─────────────── 앱 아이콘 스타일 유저 아바타 ─────────────── */
function UserAppIcon({ size = 32 }: { size?: number }) {
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

/* ─────────────────────── chat pane ─────────────────────── */

function ChatPane({
  detail,
  onSend,
  sending,
  error,
}: {
  detail: InquiryDetail;
  onSend: (text: string) => Promise<void>;
  sending: boolean;
  error: string | null;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sorted = detail.messages
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sorted.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "end" });
  }, [detail.id]);

  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }

  async function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await onSend(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  const elements: React.ReactNode[] = [];
  let lastDateKey = "";

  sorted.forEach((m, idx) => {
    const dateKey = getDateKey(m.createdAt);
    const isAdmin = m.sender === "admin";
    const prevMsg = idx > 0 ? sorted[idx - 1] : null;
    const nextMsg = idx < sorted.length - 1 ? sorted[idx + 1] : null;

    if (dateKey && dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      elements.push(
        <div key={`date-${dateKey}`} className="flex items-center justify-center my-3">
          <span className="bg-white/60 text-gray-600 text-[10px] px-3 py-0.5 rounded-full font-medium">
            {formatDate(m.createdAt)}
          </span>
        </div>
      );
    }

    const sameAsPrev =
      prevMsg?.sender === m.sender &&
      getDateKey(prevMsg.createdAt) === dateKey &&
      Math.abs(new Date(m.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 60_000;

    const sameAsNext =
      nextMsg?.sender === m.sender &&
      getDateKey(nextMsg?.createdAt ?? "") === dateKey &&
      Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(m.createdAt).getTime()) < 60_000;

    const showTime = !sameAsNext;
    const showAvatar = !isAdmin && !sameAsPrev;

    elements.push(
      <div
        key={m.id}
        className={`flex items-end gap-1.5 ${isAdmin ? "flex-row-reverse" : "flex-row"} ${sameAsPrev ? "mt-0.5" : "mt-2.5"}`}
      >
        {/* 유저 아바타 (앱 아이콘 스타일) */}
        {!isAdmin && (
          <div className="flex-shrink-0 w-7 flex items-end">
            {showAvatar ? <UserAppIcon size={28} /> : null}
          </div>
        )}

        <div className={`flex items-end gap-1 max-w-[75%] ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
          {/* 말풍선 */}
          <div
            className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
              isAdmin
                ? "text-white rounded-br-sm"
                : "bg-white text-gray-900 rounded-bl-sm"
            }`}
            style={isAdmin ? {
              background: "linear-gradient(135deg, #818cf8, #6366f1)",
            } : undefined}
          >
            {m.content}
          </div>
          {/* 시간 */}
          {showTime && (
            <span className="text-[9px] text-gray-500 flex-shrink-0 mb-0.5">
              {formatTime(m.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 대화 영역 */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ background: "#e5e7eb" }}
      >
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="bg-white/60 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              아직 메시지가 없습니다.
            </span>
          </div>
        ) : elements}
        <div ref={bottomRef} className="h-1" />
      </div>

      {error && (
        <div className="px-3 py-1.5 bg-red-50 text-red-600 text-xs border-t border-red-100">
          {error}
        </div>
      )}

      {/* 입력창 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-2.5 py-2">
        <div className="flex items-end gap-1.5">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKey}
            placeholder="메시지 입력… (Enter 전송)"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none px-3 py-2 border border-gray-200 rounded-2xl text-[13px] bg-gray-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition overflow-hidden leading-relaxed"
            style={{ minHeight: "38px" }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || !draft.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition disabled:opacity-40"
            style={{
              background: !sending && draft.trim()
                ? "linear-gradient(135deg, #818cf8, #6366f1)"
                : "#e5e7eb",
            }}
          >
            <Send
              className="w-3.5 h-3.5"
              strokeWidth={2}
              style={{ color: !sending && draft.trim() ? "#fff" : "#9ca3af" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── inquiry list row ─────────────────────── */

function InquiryRow({
  item,
  active,
  onClick,
}: {
  item: InquiryListItem;
  active: boolean;
  onClick: () => void;
}) {
  const u = item.user;
  const name = u?.name ?? u?.phone ?? "고객";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition border-b border-gray-100 ${
        active ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-gray-50"
      }`}
    >
      <UserAppIcon size={34} />
      <div className="flex-1 min-w-0 mt-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-gray-800 truncate">{name}</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{formatListTime(item.createdAt)}</span>
        </div>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.content || "—"}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {item.needsReply && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
              미답변
            </span>
          )}
          {item.handoffRequested && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">
              상담사 호출
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────── main widget ─────────────────────── */

export default function ChatWidget() {
  const { getAccessToken } = useAuth();
  const { unreadCount } = useInquiryNotifier(getAccessToken);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [inquiries, setInquiries] = useState<InquiryListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (!API_BASE || !hasAdminWebSession()) return;
    setListLoading(true);
    const res = await fetchInquiriesList(getAccessToken, { page: 1, limit: 50, status: "" });
    setListLoading(false);
    if (res.ok) setInquiries(res.data.items);
  }, [getAccessToken]);

  const loadDetail = useCallback(async (id: string, quiet = false) => {
    if (!API_BASE || !hasAdminWebSession()) return;
    if (!quiet) setDetailLoading(true);
    const res = await fetchInquiryDetail(getAccessToken, id);
    if (!quiet) setDetailLoading(false);
    if (res.ok) setDetail(res.data);
    else setChatError(res.message);
  }, [getAccessToken]);

  useEffect(() => {
    if (open && !minimized) loadList();
  }, [open, minimized, loadList]);

  useEffect(() => {
    if (!selectedId) return;
    setChatError(null);
    setDetail(null);
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!open || minimized) return;
    const t = window.setInterval(loadList, 30_000);
    return () => window.clearInterval(t);
  }, [open, minimized, loadList]);

  useEffect(() => {
    if (!open || minimized || !selectedId) return;
    const t = window.setInterval(() => loadDetail(selectedId, true), 4_000);
    return () => window.clearInterval(t);
  }, [open, minimized, selectedId, loadDetail]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleSend(text: string) {
    if (!selectedId) return;
    setSending(true);
    setChatError(null);
    const res = await sendAdminInquiryMessage(getAccessToken, selectedId, text);
    setSending(false);
    if (!res.ok) { setChatError(res.message); }
    else {
      setToast("전송되었습니다.");
      await loadDetail(selectedId, true);
    }
  }

  const selectedInquiry = inquiries.find((i) => i.id === selectedId);
  const userName = selectedInquiry?.user?.name ?? selectedInquiry?.user?.phone ?? "고객";

  return (
    <>
      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-[100] px-4 py-2 rounded-full bg-indigo-700 text-white text-xs shadow-lg">
          {toast}
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => {
          if (open && !minimized) { setMinimized(true); }
          else { setOpen(true); setMinimized(false); }
        }}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)" }}
      >
        <MessageCircle className="w-6 h-6 text-white" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 채팅 패널 */}
      {open && !minimized && (
        <div
          className="fixed bottom-24 right-6 z-[90] flex flex-col rounded-2xl overflow-hidden border border-gray-900"
          style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            width: 680,
            height: 540,
          }}
        >
          {/* 패널 헤더 */}
          <div
            className="flex items-center justify-between px-4 h-12 flex-shrink-0"
            style={{ background: "linear-gradient(90deg, #4f46e5 0%, #6d28d9 100%)" }}
          >
            <div className="flex items-center gap-2 text-white">
              {selectedId && (
                <button
                  type="button"
                  onClick={() => { setSelectedId(null); setDetail(null); }}
                  className="text-white/70 hover:text-white mr-0.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {selectedId ? (
                <UserAppIcon size={26} />
              ) : (
                <MessageCircle className="w-4 h-4 text-white/80" strokeWidth={1.75} />
              )}
              <span className="font-semibold text-sm">
                {selectedId ? userName : "1:1 문의"}
              </span>
              {selectedId && (
                <button
                  type="button"
                  onClick={() => selectedId && loadDetail(selectedId, true)}
                  className="ml-1 text-white/60 hover:text-white"
                  title="새로고침"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized(true)}
                className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition"
                title="최소화"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setSelectedId(null); setDetail(null); }}
                className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 패널 바디 */}
          <div className="flex flex-1 min-h-0">
            {/* 문의 목록 */}
            <div
              className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
                selectedId ? "w-0 overflow-hidden" : "w-full"
              }`}
            >
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-semibold text-gray-500">
                  전체 {inquiries.length}건
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                      미답변 {unreadCount}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={loadList}
                  disabled={listLoading}
                  className="text-gray-400 hover:text-indigo-600 transition"
                  title="새로고침"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${listLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {listLoading && inquiries.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                    로딩 중...
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                    접수된 문의가 없습니다.
                  </div>
                ) : (
                  inquiries.map((item) => (
                    <InquiryRow
                      key={item.id}
                      item={item}
                      active={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 채팅 상세 */}
            {selectedId && (
              <div className="flex flex-col flex-1 min-h-0 min-w-0">
                {detailLoading || !detail ? (
                  <div
                    className="flex-1 flex items-center justify-center"
                    style={{ background: "#e5e7eb" }}
                  >
                    <span className="bg-white/50 text-indigo-700 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {detailLoading ? "로딩 중..." : "대화를 선택하세요."}
                    </span>
                  </div>
                ) : (
                  <ChatPane
                    detail={detail}
                    onSend={handleSend}
                    sending={sending}
                    error={chatError}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
