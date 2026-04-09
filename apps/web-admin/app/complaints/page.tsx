"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  fetchComplaintsList,
  fetchComplaintDetail,
  type ComplaintListItem,
  type ComplaintStatus,
  STATUS_LABEL,
} from "@/lib/complaintsAdminApi";

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

function previewContent(text: string, max = 80): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t || "-";
  return `${t.slice(0, max)}…`;
}

function statusBadgeVariant(status: ComplaintStatus): "success" | "secondary" {
  return status === "resolved" ? "success" : "secondary";
}

export default function ComplaintsListPage() {
  const { getAccessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    items: ComplaintListItem[];
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
    const res = await fetchComplaintsList(getAccessToken, { page, limit, status: statusFilter });
    if (!res.ok) {
      setResult(null);
      setError(res.message);
    } else {
      const rows = [...res.data.items];
      const emptyReplyRows = rows.filter((x) => !x.reply.trim()).slice(0, 10);
      if (emptyReplyRows.length > 0) {
        const filled = await Promise.all(
          emptyReplyRows.map(async (row) => {
            const d = await fetchComplaintDetail(getAccessToken, row.id);
            return d.ok ? { id: row.id, reply: d.data.reply, repliedAt: d.data.repliedAt } : null;
          })
        );
        const patchMap = new Map(
          filled
            .filter((x): x is { id: string; reply: string; repliedAt: string } => !!x && !!x.reply.trim())
            .map((x) => [x.id, x])
        );
        if (patchMap.size > 0) {
          for (const row of rows) {
            const p = patchMap.get(row.id);
            if (!p) continue;
            row.reply = p.reply;
            row.repliedAt = p.repliedAt || row.repliedAt;
          }
        }
      }
      setResult({ ...res.data, items: rows });
    }
    setLoading(false);
  }, [getAccessToken, page, limit, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const total = result?.total ?? 0;
  const currentLimit = result?.limit ?? limit;
  const totalPages = Math.max(1, Math.ceil(total / currentLimit) || 1);
  const q = query.trim().toLowerCase();
  const visibleItems = (result?.items ?? []).filter((row) => {
    if (!q) return true;
    const hay = [
      row.content,
      row.reply,
      row.user?.phone,
      row.user?.name,
      row.userId,
      row.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">불편사항</h1>
          <p className="text-gray-500 text-sm mt-1">접수된 민원·불편사항 목록</p>
        </div>
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          대시보드
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter((e.target.value || "") as ComplaintStatus | ""); }}>
          <option value="">전체 상태</option>
          <option value="pending">{STATUS_LABEL.pending}</option>
          <option value="resolved">{STATUS_LABEL.resolved}</option>
        </Select>
        <Select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}>
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}개씩</option>)}
        </Select>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="내용/전화/회원 검색"
          className="w-64"
        />
        <Button type="button" onClick={() => load()} disabled={loading}>새로고침</Button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)] flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">민원 목록</h2>
          {!loading && result != null && (
            <span className="text-xs text-gray-500">
              총 {total.toLocaleString()}건
              {q ? ` · 검색 결과 ${visibleItems.length.toLocaleString()}건` : ""}
              · {result.page}/{totalPages}페이지
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3.5 text-left w-40">접수일시</th>
                <th className="px-4 py-3.5 text-left w-24">상태</th>
                <th className="px-4 py-3.5 text-left">내용</th>
                <th className="px-4 py-3.5 text-left max-w-[200px]">답변</th>
                <th className="px-4 py-3.5 text-left w-36">회원</th>
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
              ) : !result || visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    {q ? "검색 결과가 없습니다." : "접수된 불편사항이 없습니다."}
                  </td>
                </tr>
              ) : (
                visibleItems.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadgeVariant(row.status)}>{STATUS_LABEL[row.status]}</Badge>
                    </td>
                    <td className="px-4 py-4 text-gray-800 max-w-md">
                      {previewContent(row.content)}
                    </td>
                    <td className="px-4 py-4 text-gray-700 max-w-[320px] text-xs align-top">
                      {row.reply.trim() ? (
                        <div className="whitespace-pre-wrap break-words leading-relaxed">
                          {row.reply}
                          {row.repliedAt ? (
                            <span className="block text-[10px] text-gray-400 mt-0.5">
                              {formatDateTime(row.repliedAt)}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-400">없음</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-700 text-xs">
                      {row.user?.phone || row.user?.name || row.userId || "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/complaints/${encodeURIComponent(row.id)}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
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
