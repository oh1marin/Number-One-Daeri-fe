"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const DEFAULT_LIMIT = 20;

function formatNumber(n: unknown) {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  if (Number.isNaN(v)) return "0";
  return v.toLocaleString();
}

function formatDateTime(s: unknown): string {
  if (!s) return "-";
  const str = String(s);
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  } catch {
    return str;
  }
}

/** 상태 코드 → 라벨 */
function statusToLabel(s: unknown): string {
  const v = String(s ?? "").toLowerCase();
  const map: Record<string, string> = {
    pending: "대기",
    accepted: "접수",
    driving: "운행",
    completed: "완료",
    cancelled: "취소",
    matched: "매칭",
    arrived: "도착",
    failed: "실패",
  };
  return map[v] ?? (v ? String(s) : "-");
}

/** 결제방법 라벨 (GET /admin/rides paymentMethod) */
function paymentMethodToLabel(m: unknown): string {
  const v = String(m ?? "").toLowerCase();
  const map: Record<string, string> = {
    card: "카드",
    tosspay: "토스페이",
    kakaopay: "카카오페이",
    cash: "현금",
    mileage: "마일리지",
  };
  return map[v] ?? (v ? String(m) : "-");
}

/** 접수 구분 라벨 */
function sourceToLabel(s: unknown): string {
  const v = String(s ?? "").toLowerCase();
  if (v === "app") return "앱 접수";
  if (v === "manual") return "수동 접수";
  return v ? String(s) : "-";
}

const PLACEHOLDER_ADDRESSES = [
  "현재 위치",
  "지도에서 선택",
  "현재위치",
  "지도에서선택",
];
function toAddressDisplay(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s || PLACEHOLDER_ADDRESSES.some((p) => s === p || s.toLowerCase() === p.toLowerCase())) return "-";
  return s;
}

type RideRow = Record<string, unknown>;

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "accepted", label: "접수" },
  { value: "driving", label: "운행" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

export default function OrderStatusPage() {
  const { getAccessToken } = useAuth();

  const [rides, setRides] = useState<RideRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const limit = DEFAULT_LIMIT;

  const [statusFilter, setStatusFilter] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [appliedPhoneQuery, setAppliedPhoneQuery] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("");

  const fetchRides = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setRides([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (appliedStatusFilter) params.set("status", appliedStatusFilter);
    if (appliedPhoneQuery.trim()) params.set("phone", appliedPhoneQuery.trim());

    try {
      const res = await fetch(`${API_BASE}/admin/rides?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setRides([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const root = data?.data ?? data;
      const list = root?.items ?? root?.list ?? root?.rides ?? (Array.isArray(root) ? root : []);
      const total = root?.total ?? root?.count ?? (Array.isArray(list) ? list.length : 0);
      setRides(Array.isArray(list) ? list : []);
      setTotalCount(typeof total === "number" ? total : Number(total ?? 0) || 0);
    } catch {
      setRides([]);
      setTotalCount(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken, page, appliedStatusFilter, appliedPhoneQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleSearch = () => {
    setAppliedPhoneQuery(phoneQuery);
    setAppliedStatusFilter(statusFilter);
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-none">오더 현황</h1>
          <p className="text-xs text-gray-500 mt-1">전체 목록 조회</p>
        </div>
        <Link href="/rides" className="text-xs text-blue-700 hover:underline">
          콜 조회
        </Link>
      </div>

      <div className="sheet-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1.5">상태</label>
              <select
                className="h-9 px-2 text-sm border border-[var(--sheet-border)] bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1.5">전화번호</label>
              <input
                className="h-9 w-56 px-2 text-sm border border-[var(--sheet-border)] bg-white"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="010..."
              />
            </div>

            <button type="button" onClick={handleSearch} className="h-9 px-4 text-sm sheet-btn sheet-btn-primary">
              조회
            </button>
          </div>
        </div>
      </div>

      <div className="sheet-wrap mt-4">
        <div className="overflow-x-auto">
          <table className="sheet-table text-[11px]">
            <thead className="sticky">
              <tr>
                <th className="w-[50px] text-center">No</th>
                <th className="w-[140px]">접수번호</th>
                <th className="w-[120px]">전화번호</th>
                <th className="w-[170px]">접수시간</th>
                <th className="w-[80px] text-right">경과(초)</th>
                <th className="w-[70px]">상태</th>
                <th className="min-w-[140px]">출발지</th>
                <th className="min-w-[140px]">도착지</th>
                <th className="w-[90px] text-right">총액</th>
                <th className="w-[80px] text-right">현금</th>
                <th className="w-[80px] text-right">카드</th>
                <th className="w-[80px] text-right">토스페이</th>
                <th className="w-[80px] text-right">카카오페이</th>
                <th className="w-[80px] text-right">마일리지</th>
                <th className="w-[110px]">결제방법</th>
                <th className="w-[90px]">접수구분</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-gray-500">
                    로딩 중…
                  </td>
                </tr>
              ) : rides.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-left text-gray-600">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rides.map((r, idx) => {
                  const row = (r as Record<string, unknown>).ride ?? r;
                  const rr = row as Record<string, unknown>;
                  const no = (page - 1) * limit + idx + 1;
                  const receiptNo =
                    rr.receiptNo ??
                    rr.receipt_no ??
                    rr.id ??
                    rr.rideId ??
                    (r as Record<string, unknown>).receiptNo ??
                    (r as Record<string, unknown>).receipt_no ??
                    (r as Record<string, unknown>).id ??
                    "—";
                  const user = (rr.user ?? (r as Record<string, unknown>).user) as Record<string, unknown> | undefined;
                  const phone =
                    user?.phone ??
                    user?.mobile ??
                    user?.userPhone ??
                    rr.userPhone ??
                    rr.phone ??
                    rr.mobile ??
                    (r as Record<string, unknown>).phone ??
                    (r as Record<string, unknown>).userPhone ??
                    "—";
                  const receivedAt =
                    rr.receivedAt ??
                    rr.date ??
                    rr.time ??
                    rr.createdAt ??
                    rr.offerAt ??
                    (r as Record<string, unknown>).receivedAt ??
                    (r as Record<string, unknown>).createdAt ??
                    "—";
                  const elapsedSeconds = rr.elapsedSeconds ?? (r as Record<string, unknown>).elapsedSeconds;
                  const status = statusToLabel(rr.status ?? (r as Record<string, unknown>).status);
                  const pickupRaw =
                    rr.pickup ??
                    rr.pickup_address ??
                    rr.pickupAddress ??
                    rr.address ??
                    (r as Record<string, unknown>).pickup ??
                    (r as Record<string, unknown>).pickup_address ??
                    "";
                  const pickup = toAddressDisplay(pickupRaw);
                  const dropoffRaw =
                    rr.dropoff ??
                    rr.dropoff_address ??
                    rr.dropoffAddress ??
                    rr.addressDetail ??
                    (r as Record<string, unknown>).dropoff ??
                    (r as Record<string, unknown>).dropoff_address ??
                    "";
                  const dropoff = toAddressDisplay(dropoffRaw);
                  const total = Number(
                    rr.displayFare ??
                      rr.amount ??
                      rr.total ??
                      rr.estimatedFare ??
                      rr.fee ??
                      (r as Record<string, unknown>).displayFare ??
                      (r as Record<string, unknown>).amount ??
                      (r as Record<string, unknown>).total ??
                      0,
                  );
                  const cashAmount = Number(rr.cashAmount ?? (r as Record<string, unknown>).cashAmount ?? 0);
                  const cardAmount = Number(rr.cardAmount ?? (r as Record<string, unknown>).cardAmount ?? 0);
                  const tosspayAmount = Number(rr.tosspayAmount ?? (r as Record<string, unknown>).tosspayAmount ?? 0);
                  const kakaopayAmount = Number(
                    rr.kakaopayAmount ?? (r as Record<string, unknown>).kakaopayAmount ?? 0,
                  );
                  const mileageAmount = Number(rr.mileageAmount ?? (r as Record<string, unknown>).mileageAmount ?? 0);
                  const paymentMethod = rr.paymentMethod ?? (r as Record<string, unknown>).paymentMethod;
                  const methodLabel = paymentMethodToLabel(paymentMethod);
                  const amount =
                    cardAmount || tosspayAmount || kakaopayAmount || cashAmount || mileageAmount;
                  const paymentDisplay =
                    methodLabel !== "현금"
                      ? amount > 0
                        ? `${formatNumber(amount)}원 · ${methodLabel}`
                        : methodLabel
                      : formatNumber(total);
                  const source = sourceToLabel(rr.source ?? (r as Record<string, unknown>).source);

                  return (
                    <tr key={String(receiptNo) || idx} className={idx % 2 === 0 ? "" : "bg-white/5"}>
                      <td className="text-center text-gray-700">{no}</td>
                      <td className="font-mono text-gray-700">{String(receiptNo)}</td>
                      <td className="font-mono text-gray-700">{String(phone)}</td>
                      <td className="text-gray-600">{formatDateTime(receivedAt)}</td>
                      <td className="text-right text-gray-700">
                        {elapsedSeconds != null && elapsedSeconds !== "" ? String(elapsedSeconds) : "—"}
                      </td>
                      <td className="text-gray-700">{status}</td>
                      <td className="max-w-[200px] truncate text-gray-700">{String(pickup)}</td>
                      <td className="max-w-[200px] truncate text-gray-700">{String(dropoff)}</td>
                      <td className="text-right text-gray-700">{formatNumber(total)}</td>
                      <td className="text-right text-gray-700">{formatNumber(cashAmount)}</td>
                      <td className="text-right text-gray-700">{formatNumber(cardAmount)}</td>
                      <td className="text-right text-gray-700">{formatNumber(tosspayAmount)}</td>
                      <td className="text-right text-gray-700">{formatNumber(kakaopayAmount)}</td>
                      <td className="text-right text-gray-700">{formatNumber(mileageAmount)}</td>
                      <td className="text-gray-700">{paymentDisplay}</td>
                      <td className="text-gray-700">{source}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && rides.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--sheet-border)] flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 disabled:opacity-40"
            >
              이전
            </Button>
            <span className="text-xs text-gray-700">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 disabled:opacity-40"
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
