"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatDate(s: string): string {
  if (!s) return "—";
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

/** 결제 수단 라벨 (method / pgProvider / paymentProvider) */
function formatProvider(provider: string | undefined): string {
  if (!provider) return "—";
  const v = String(provider).toLowerCase();
  if (v.includes("toss") || v === "tosspay") return "토스페이";
  if (v.includes("kakao") || v === "kakaopay") return "카카오페이";
  if (v === "card" || v === "portone" || v.includes("card")) return "카드";
  return provider;
}

export default function CardPaymentsPage() {
  const { getAccessToken } = useAuth();
  const [todaySummary, setTodaySummary] = useState<{
    count?: number;
    totalAmount?: number;
  } | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setTodaySummary({ count: 0, totalAmount: 0 });
        setPayments([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const [todayRes, listRes] = await Promise.all([
          fetch(`${API_BASE}/admin/card-payments/today`, {
            credentials: "include",
            headers,
          }),
          fetch(`${API_BASE}/admin/card-payments?page=${page}&limit=${limit}`, {
            credentials: "include",
            headers,
          }),
        ]);
        if (todayRes.ok) {
          const t = await todayRes.json();
          setTodaySummary(t.data ?? t ?? {});
        } else {
          setTodaySummary({ count: 0, totalAmount: 0 });
        }
        if (listRes.ok) {
          const l = await listRes.json();
          const data = l.data ?? l;
          const items = data.items ?? data.list ?? data.payments ?? (Array.isArray(data) ? data : []);
          setPayments(Array.isArray(items) ? items : []);
          setTotalCount(data.total ?? items.length);
        } else {
          setPayments([]);
          setTotalCount(0);
        }
      } catch {
        setTodaySummary({ count: 0, totalAmount: 0 });
        setPayments([]);
        setTotalCount(0);
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken, page]);

  const count = todaySummary?.count ?? 0;
  const totalAmount = todaySummary?.totalAmount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const displayPayments = loading ? payments : [{ __dummy: true }, ...payments];
  const firstRealIndex = displayPayments.findIndex((p) => !p?.__dummy);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="flex items-end gap-3">
          <h1 className="text-xl font-bold leading-none">카드</h1>
          <div className="text-sm text-gray-600 leading-none">카드거래 현황</div>
          <Link href="/accumulation" className="text-xs text-blue-600 hover:underline ml-2">
            적립 설정
          </Link>
        </div>
        <Link href="/" className="text-xs text-blue-700 hover:underline">
          대시보드
        </Link>
      </div>

      <div className="sheet-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <select
              className="h-8 px-2 text-sm border border-[var(--sheet-border)] bg-white"
              defaultValue="all"
              aria-label="검색 범위"
            >
              <option value="all">전체</option>
              <option value="success">완료</option>
              <option value="pending">대기</option>
              <option value="fail">실패</option>
            </select>
            <button type="button" className="h-8 px-4 text-sm sheet-btn sheet-btn-primary">
              검색
            </button>
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">
            카드 거래를 관리합니다. <span className="font-semibold text-gray-700">[취소 가능합니다]</span>. 반드시
            콜번호·접수번호를 비교하세요.
            <br />
            견인번호를 클릭하면 취소 가능합니다.
          </div>
        </div>
      </div>

      <div className="sheet-wrap">
        <div className="overflow-x-auto">
          <table className="sheet-table">
            <thead className="sticky">
              <tr>
                <th className="w-[140px]">결제일시</th>
                <th className="w-[120px]">이용자</th>
                <th className="w-[140px]">전화번호</th>
                <th>운행정보</th>
                <th className="w-[90px]">결제수단</th>
                <th className="w-[100px]">결제상태</th>
                <th className="w-[120px] text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    로딩 중…
                  </td>
                </tr>
              ) : (
                displayPayments.map((p, i) => {
                  const isDummy = !!p?.__dummy;
                  const userName = p.userName ?? p.user?.name ?? p.name ?? "—";
                  const phone = p.phone ?? p.user?.phone ?? p.mobile ?? p.user?.mobile ?? "—";
                  const rideInfo = p.rideInfo ?? p.ride?.info ?? p.description ?? "—";
                  const rawStatus = p.status ?? p.paymentStatus ?? (p.amount != null ? "완료" : "—");
                  const status = rawStatus === "success" ? "완료" : rawStatus;
                  const amount = p.amount ?? p.total ?? p.paymentAmount ?? 0;
                  const paidAt = p.paidAt ?? p.paymentAt ?? p.createdAt ?? p.date ?? "—";
                  const provider = formatProvider(p.method ?? p.paymentProvider ?? p.pgProvider ?? p.provider);

                  return (
                    <tr
                      key={isDummy ? "__dummy" : p.id ?? i}
                      className={i === firstRealIndex ? "sheet-selected" : ""}
                    >
                      <td className="font-mono text-[11px]">{isDummy ? "—" : formatDate(paidAt)}</td>
                      <td className="font-medium">{isDummy ? "더미 데이터" : userName}</td>
                      <td className="font-mono">{isDummy ? "010-0000-0000" : phone}</td>
                      <td className="max-w-[340px] truncate">
                        {isDummy ? "더미 데이터(화면 확인용)" : rideInfo}
                      </td>
                      <td>{isDummy ? "—" : provider}</td>
                      <td>{isDummy ? "—" : status}</td>
                      <td className="text-right font-semibold">
                        {isDummy ? "0원" : `${Number(amount).toLocaleString()}원`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-700">
                      총 건수: {loading ? "…" : totalCount.toLocaleString()}
                      {loading
                        ? ""
                        : ` (오늘 ${count.toLocaleString()}건 / ${Number(totalAmount).toLocaleString()}원)`}
                    </div>
                    {!loading && payments.length > 0 && totalPages > 1 && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="h-8 px-3 text-sm sheet-btn"
                        >
                          이전
                        </button>
                        <span className="text-xs text-gray-700">
                          {page} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="h-8 px-3 text-sm sheet-btn"
                        >
                          다음
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
