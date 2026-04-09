"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  fetchInquiriesList,
  type InquiryListItem,
  type InquiryStatus,
} from "@/lib/inquiriesAdminApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatDateTime(s: string): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return s;
  }
}

function statusBadgeVariant(status: InquiryStatus): "success" | "secondary" | "outline" {
  if (status === "active") return "success";
  if (status === "closed") return "secondary";
  return "outline";
}

function statusLabel(status: InquiryStatus): string {
  if (status === "active") return "진행중";
  if (status === "closed") return "종료";
  return "접수";
}

function previewContent(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "-";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function InquiriesListPage() {
  const { getAccessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "">("");
  const [result, setResult] = useState<{
    items: InquiryListItem[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setResult({ items: [], total: 0, page: 1, limit });
      setLoading(false);
      setError(!API_BASE ? "API 주소가 설정되지 않았습니다." : "로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetchInquiriesList(getAccessToken, { page, limit, status: statusFilter });
    if (!res.ok) {
      setResult(null);
      setError(res.message);
      setLoading(false);
      return;
    }

    setResult(res.data);
    setLoading(false);
  }, [getAccessToken, page, limit, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const total = result?.total ?? 0;
  const currentLimit = result?.limit ?? limit;
  const totalPages = Math.max(1, Math.ceil(total / currentLimit) || 1);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">1:1 문의</h1>
          <p className="text-gray-500 text-sm mt-1">접수된 1:1 문의 목록</p>
        </div>
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          대시보드
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter((e.target.value || "") as InquiryStatus | ""); }}>
          <option value="">전체 상태</option>
          <option value="pending">접수</option>
          <option value="active">진행중</option>
          <option value="closed">종료</option>
        </Select>
        <Select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}>
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}개씩</option>)}
        </Select>
        <Button type="button" onClick={() => load()} disabled={loading}>새로고침</Button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">{error}</div>
      )}

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
          <h2 className="font-semibold">접수 목록</h2>
          {!loading && result != null && (
            <span className="text-xs text-gray-500 block mt-1">
              총 {total.toLocaleString()}건 · {result.page}/{totalPages}페이지
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3.5 text-left w-40">등록일시</th>
                <th className="px-4 py-3.5 text-left w-24">상태</th>
                <th className="px-4 py-3.5 text-left">내용</th>
                <th className="px-4 py-3.5 text-left w-80">최근 답장</th>
                <th className="px-4 py-3.5 text-left w-44">회원</th>
                <th className="px-4 py-3.5 text-right w-24">상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : !result || result.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    접수된 문의가 없습니다.
                  </td>
                </tr>
              ) : (
                result.items.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                        {row.needsReply && <Badge variant="destructive">미답변</Badge>}
                        {row.handoffRequested && <Badge variant="warning">상담원 호출</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-800 max-w-md">{previewContent(row.content)}</td>
                    <td className="px-4 py-4 text-gray-700 text-xs max-w-[320px]">
                      {row.lastAdminReply ? (
                        previewContent(row.lastAdminReply, 160)
                      ) : (
                        <span className="text-gray-400">답변 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-700 text-xs">
                      {row.user?.phone || row.user?.name || row.user?.id || "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/inquiries/${encodeURIComponent(row.id)}`} className="text-blue-600 hover:underline text-xs font-medium">
                        보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && result && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</Button>
          <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</Button>
        </div>
      )}
    </div>
  );
}

