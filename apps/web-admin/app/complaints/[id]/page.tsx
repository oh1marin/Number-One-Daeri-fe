"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchComplaintDetail,
  patchComplaintStatus,
  patchComplaintReply,
  sendComplaintReplySms,
  type ComplaintDetail,
  type ComplaintStatus,
  STATUS_LABEL,
} from "@/lib/complaintsAdminApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatDateTime(s: string): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const sec = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}:${sec}`;
  } catch {
    return s;
  }
}

export default function ComplaintDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const { getAccessToken } = useAuth();

  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [status, setStatus] = useState<ComplaintStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [smsBody, setSmsBody] = useState("");
  const [smsSending, setSmsSending] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!API_BASE || !token || !id) {
      setDetail(null);
      setLoading(false);
      setError(!id ? "잘못된 경로입니다." : !API_BASE ? "API 주소가 없습니다." : "로그인이 필요합니다.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchComplaintDetail(getAccessToken, id);
    if (!res.ok) {
      setDetail(null);
      setError(res.message);
    } else {
      setDetail(res.data);
      setStatus(res.data.status);
    }
    setLoading(false);
  }, [getAccessToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleSaveStatus() {
    if (!id || !detail) return;
    setSaving(true);
    setError(null);
    const res = await patchComplaintStatus(getAccessToken, id, status);
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDetail(res.data);
    setStatus(res.data.status);
    setToast("상태가 저장되었습니다.");
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 max-w-3xl">
        <Link href="/complaints" className="text-sm text-blue-700 hover:underline">
          ← 목록으로
        </Link>
        {error && (
          <p className="mt-4 text-red-600 text-sm">{error}</p>
        )}
      </div>
    );
  }

  const u = detail.user;
  const replyUserId = (u?.id ?? detail.userId ?? "").trim();
  const replyPhone = (u?.phone ?? "").trim();
  const replyPhoneDigits = replyPhone.replace(/\D/g, "");
  const canSendSms = !!(replyUserId || replyPhoneDigits.length >= 10);

  async function handleSendSms() {
    if (!canSendSms) return;
    const d = detail;
    if (!d) return;
    const message = smsBody.trim();
    if (!message) return;
    setSmsSending(true);
    setError(null);
    const res = await sendComplaintReplySms(getAccessToken, {
      message,
      userId: replyUserId || undefined,
      phone: replyPhone,
    });
    if (!res.ok) {
      setSmsSending(false);
      setError(res.message);
      return;
    }
    const saveRes = await patchComplaintReply(getAccessToken, d.id, {
      reply: message,
      status: "resolved",
    });
    setSmsSending(false);

    if (!saveRes.ok) {
      setError(`문자는 발송됐지만 DB 답변 저장은 실패했습니다: ${saveRes.message}`);
      setToast(`문자 발송 완료 (${res.sent}건)`);
      return;
    }

    setDetail(saveRes.data);
    setStatus(saveRes.data.status);
    setToast(`문자 발송 및 답변 저장 완료 (${res.sent}건)`);
    setSmsBody("");
  }

  return (
    <div className="p-6 max-w-3xl">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium bg-green-600 text-white">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/complaints" className="text-sm text-blue-700 hover:underline">
          ← 불편사항 목록
        </Link>
        <button
          type="button"
          onClick={() => load()}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          새로고침
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-1">불편사항 상세</h1>
      <p className="text-xs text-gray-500 mb-6 font-mono">ID: {detail.id}</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">처리 상태</h2>
          <div className="flex flex-wrap items-end gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
              className="px-3 py-2 border border-gray-300 rounded text-sm bg-white min-w-[160px]"
            >
              <option value="pending">{STATUS_LABEL.pending}</option>
              <option value="resolved">{STATUS_LABEL.resolved}</option>
            </select>
            <button
              type="button"
              onClick={handleSaveStatus}
              disabled={saving || status === detail.status}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "저장 중…" : "상태 저장"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">등록 시각</h2>
          <p className="text-gray-900">{formatDateTime(detail.createdAt)}</p>
        </section>

        {(u?.phone || u?.name || u?.email || u?.id || detail.userId) && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">회원 요약</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {u?.phone && (
                <>
                  <dt className="text-gray-500">전화</dt>
                  <dd className="font-mono text-gray-900">{u.phone}</dd>
                </>
              )}
              {u?.name && (
                <>
                  <dt className="text-gray-500">이름</dt>
                  <dd className="text-gray-900">{u.name}</dd>
                </>
              )}
              {u?.email && (
                <>
                  <dt className="text-gray-500">이메일</dt>
                  <dd className="text-gray-900 break-all">{u.email}</dd>
                </>
              )}
              {(u?.id || detail.userId) && (
                <>
                  <dt className="text-gray-500">User ID</dt>
                  <dd className="font-mono text-xs text-gray-800 break-all">{u?.id || detail.userId}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">접수 내용</h2>
          <p className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed">{detail.content || "—"}</p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">관리자 답변</h2>
          {detail.reply.trim() ? (
            <>
              {detail.repliedAt ? (
                <p className="text-xs text-gray-500 mb-2">{formatDateTime(detail.repliedAt)}</p>
              ) : null}
              <p className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed">{detail.reply}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">저장된 답변이 없습니다.</p>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">답장 문자 (SMS)</h2>
          <p className="text-xs text-gray-500 mb-3">
            {replyUserId ? "회원 ID로 문자를 보냅니다." : replyPhoneDigits ? "등록된 전화번호로 보냅니다." : ""}
          </p>
          {!canSendSms ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              접수자 전화번호 또는 회원 ID가 없어 문자를 보낼 수 없습니다. 상세 API에 회원 전화번호 또는 사용자 ID가
              내려오는지 백엔드를 확인해 주세요.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-2 font-mono">
                수신: {replyPhone || "(회원 ID만 있음 · 서버가 번호 매칭)"}
              </p>
              <textarea
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                rows={5}
                placeholder="고객에게 보낼 답변 내용을 입력하세요."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-y min-h-[100px]"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{smsBody.length}자 · 약 {Math.ceil(smsBody.length / 80) || 0}건(80자 기준)</p>
              <button
                type="button"
                onClick={handleSendSms}
                disabled={smsSending || !smsBody.trim()}
                className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {smsSending ? "발송 중…" : "문자 보내기"}
              </button>
            </>
          )}
        </section>

        {detail.attachments.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">첨부 (URL)</h2>
            <ul className="space-y-2">
              {detail.attachments.map((url, i) => (
                <li key={`${url}-${i}`}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
