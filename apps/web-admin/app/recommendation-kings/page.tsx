"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type RecommendationKingRow = {
  rank: number;
  phone: string;
  callCount: number;
  referralCount: number;
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function normalizeRows(json: unknown): RecommendationKingRow[] {
  const root = json as Record<string, unknown> | null | undefined;
  const data = root?.data ?? root;
  const raw =
    (data as Record<string, unknown>)?.items ??
    (data as Record<string, unknown>)?.list ??
    (Array.isArray(data) ? data : null) ??
    root?.items;
  if (!Array.isArray(raw)) return [];

  return raw.map((item, i) => {
    const o = item as Record<string, unknown>;
    const phone =
      str(o.phone) ||
      str(o.phoneNumber) ||
      str(o.tel) ||
      str(o.mobile) ||
      str(o.userPhone) || "-";
    const callCount =
      num(o.callCount) ||
      num(o.call_count) ||
      num(o.rideCount) ||
      num(o.ride_count) ||
      num(o.calls) ||
      num(o.cntCall);
    const referralCount =
      num(o.referralCount) ||
      num(o.referral_count) ||
      num(o.recommendCount) ||
      num(o.refCount) ||
      num(o.refs) ||
      num(o.inviteCount);
    const rank = num(o.rank) || i + 1;
    return { rank, phone, callCount, referralCount };
  });
}

export default function RecommendationKingsPage() {
  const { getAccessToken } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState<RecommendationKingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<null | { type: "ok" | "err"; msg: string }>(null);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return Array.from({ length: 7 }, (_, i) => y - 3 + i);
  }, [now]);

  const canUseApi = !!API_BASE && hasAdminWebSession();

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({
        year: String(year),
        month: String(month),
        limit: String(Math.min(100, Math.max(1, limit))),
      });
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/admin/recommendation-kings?${q}`, {
        credentials: "include",
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows([]);
        const msg =
          (json as { message?: string; error?: string })?.message ??
          (json as { error?: string })?.error ??
          res.statusText;
        setToast({ type: "err", msg: msg || "목록을 불러오지 못했습니다." });
        return;
      }
      setRows(normalizeRows(json));
      setToast(null);
    } catch {
      setRows([]);
      setToast({ type: "err", msg: "네트워크 오류" });
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, year, month, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div className="p-6 max-w-5xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-md ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-tight">추천왕 랭킹</h1>
          <p className="text-xs text-gray-500 mt-1">월별 추천·누적 실적 순위</p>
        </div>
        <Link href="/" className="text-xs text-blue-700 hover:underline">대시보드</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-auto min-w-[5.5rem]"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </Select>
        <Select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="w-auto min-w-[4.5rem]"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}월
            </option>
          ))}
        </Select>
        <Input
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value) || 10)}
          className="w-20"
          title="표시 순위 개수"
        />
        <Button type="button" onClick={() => load()} disabled={!canUseApi || loading}>
          조회
        </Button>
      </div>

      <div className="sheet-wrap overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-sm">
            <thead>
              <tr>
                <th className="w-16">순위</th>
                <th>전화번호</th>
                <th className="w-28">콜수</th>
                <th className="w-28">추천수</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    로딩 중…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={`${r.phone}-${idx}`}>
                    <td className="text-center font-medium">{r.rank}위</td>
                    <td className="font-mono text-gray-800">{r.phone}</td>
                    <td className="text-right text-gray-700">{r.callCount}건</td>
                    <td className="text-right text-gray-700">{r.referralCount}건</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
