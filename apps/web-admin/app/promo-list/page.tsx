"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { hasAdminWebSession } from "@/lib/auth";
import { adminCredentialsInit } from "@/lib/api";
import { fetchCustomersWithAppUsers, type CustomerListItem } from "@/lib/customersApi";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const PAGE_SIZE = 10;

type CouponKey = "starbucks" | "kyochon";

function normalizePhone(s: string | undefined | null): string {
  return String(s ?? "").replace(/\D/g, "");
}

function formatPhone(s: string | undefined | null): string {
  const digits = normalizePhone(s);
  if (!digits) return "—";
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  return String(s ?? "—");
}

function formatNumber(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  if (Number.isNaN(v)) return "0";
  return v.toLocaleString();
}

function pageNumbersFor(current: number, totalPages: number, windowSize = 5): number[] {
  if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxStart = Math.max(1, totalPages - (windowSize - 1));
  const start = Math.max(1, Math.min(current - Math.floor(windowSize / 2), maxStart));
  return Array.from({ length: windowSize }, (_, i) => start + i).filter((n) => n <= totalPages);
}

type CouponSummary = { id: string; code: string; amount: number };

export default function PromoListPage() {
  const { getAccessToken } = useAuth();

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [phoneQuery, setPhoneQuery] = useState("");

  const [minReferrerCount, setMinReferrerCount] = useState(0);
  const [minRideCount, setMinRideCount] = useState(0);

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [coupons, setCoupons] = useState<CouponSummary[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [page, setPage] = useState(1);

  // 받은 쿠폰 체크 표시 (세션 내 표시용)
  const [receivedMap, setReceivedMap] = useState<
    Record<string, Partial<Record<CouponKey, boolean>>>
  >({});

  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [pendingCouponKey, setPendingCouponKey] = useState<CouponKey>("starbucks");

  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<null | { type: "ok" | "err"; msg: string }>(null);

  const normalizedPhoneQuery = useMemo(() => normalizePhone(phoneQuery), [phoneQuery]);

  const starbucksCouponCode = useMemo(() => {
    const upper = (x: string) => x.toUpperCase();
    const c1 = coupons.find((c) => upper(c.code).includes("STARBUCKS") || upper(c.code).includes("STARBUCKS_"));
    return c1?.code || coupons[0]?.code || "";
  }, [coupons]);

  const kyochonCouponCode = useMemo(() => {
    const upper = (x: string) => x.toUpperCase();
    const c1 = coupons.find((c) => upper(c.code).includes("KYOCHON") || upper(c.code).includes("KYOCHON_"));
    const fallback = coupons.find((c) => c.code !== starbucksCouponCode) ?? coupons[1] ?? coupons[0];
    return c1?.code || fallback?.code || "";
  }, [coupons, starbucksCouponCode]);

  // 앱회원 목록 로딩
  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      setLoadingCustomers(true);
      try {
        const list = await fetchCustomersWithAppUsers(getAccessToken, { year, month });
        if (cancelled) return;
        setCustomers(list ?? []);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    }
    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, year, month]);

  // 쿠폰 목록 로딩
  useEffect(() => {
    let cancelled = false;
    async function loadCoupons() {
      if (!API_BASE) {
        setCoupons([]);
        setLoadingCoupons(false);
        return;
      }
      setLoadingCoupons(true);
      try {
        if (!hasAdminWebSession()) return;
        const res = await fetch(`${API_BASE}/admin/coupons`, adminCredentialsInit(getAccessToken));
        if (!res.ok) {
          setCoupons([]);
          return;
        }
        const data = await res.json().catch(() => ({}));
        const root = data?.data ?? data?.items ?? data;
        const items = Array.isArray(root) ? root : [];
        const normalized: CouponSummary[] = items
          .map((c: any) => ({
            id: String(c.id ?? ""),
            code: String(c.code ?? ""),
            amount: Number(c.amount ?? 0),
          }))
          .filter((c: CouponSummary) => !!c.id && !!c.code);
        if (cancelled) return;
        setCoupons(normalized);
      } finally {
        if (!cancelled) setLoadingCoupons(false);
      }
    }
    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  const filtered = useMemo(() => {
    // 검색 + 추천/콜 필터 + 앱회원만
    return customers.filter((c) => {
      if (c.source !== "app_user") return false;

      const p = normalizePhone(c.phone);
      const m = normalizePhone(c.mobile);
      const o = normalizePhone(c.otherPhone);
      const phoneMatch =
        !normalizedPhoneQuery || p === normalizedPhoneQuery || m === normalizedPhoneQuery || o === normalizedPhoneQuery;

      const ref1 = Number(c.referrer1Count ?? 0);
      const ride = Number(c.rideCount ?? 0);
      return phoneMatch && ref1 >= minReferrerCount && ride >= minRideCount;
    });
  }, [customers, normalizedPhoneQuery, minReferrerCount, minRideCount]);

  useEffect(() => {
    setPage(1);
    setSelectedUserId("");
  }, [normalizedPhoneQuery, minReferrerCount, minRideCount, year, month]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const pageList = useMemo(() => pageNumbersFor(page, totalPages, 5), [page, totalPages]);

  const apiFetch = async (url: string, opts: RequestInit) => {
    const token = getAccessToken();
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
        ...(opts.headers as object),
      },
    });
  };

  const selectedUser = useMemo(() => customers.find((c) => c.id === selectedUserId) ?? null, [customers, selectedUserId]);

  const handleSendCoupon = async (couponKey: CouponKey) => {
    const couponCode = couponKey === "starbucks" ? starbucksCouponCode : kyochonCouponCode;
    if (!couponCode) {
      setToast({ type: "err", msg: "해당 쿠폰을 찾지 못했습니다. (쿠폰 코드 확인 필요)" });
      return;
    }
    if (!selectedUserId) {
      setToast({ type: "err", msg: "수신자를 선택하세요." });
      return;
    }
    if (!API_BASE) {
      setToast({ type: "err", msg: "API_BASE 설정이 필요합니다." });
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/coupons/send`, {
        method: "POST",
        body: JSON.stringify({ userIds: [selectedUserId], couponId: couponCode }),
      });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.success !== false || data?.data);
      if (!ok) {
        const msg = data?.message ?? data?.error ?? `${res.status} ${res.statusText}`;
        setToast({ type: "err", msg: `쿠폰 발송 실패: ${String(msg)}` });
        return;
      }

      const sent = data?.data?.sent;
      const total = data?.data?.total;

      // 체크표시: sent가 1 이상인 경우만 "받음"으로 간주
      if (typeof sent === "number" && sent > 0) {
        setReceivedMap((prev) => ({
          ...prev,
          [selectedUserId]: {
            ...(prev[selectedUserId] ?? {}),
            [couponKey]: true,
          },
        }));
      }

      setToast({
        type: sent > 0 ? "ok" : "err",
        msg:
          sent > 0
            ? `${selectedUser?.name || selectedUser?.phone || ""}님에게 쿠폰 지급 완료 (sent ${sent}/${total})`
            : `${selectedUser?.name || selectedUser?.phone || ""}님 대상 적용 건수 0 (sent ${sent}/${total})`,
      });
    } catch {
      setToast({ type: "err", msg: "네트워크 오류" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <div className="p-6 max-w-6xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-none">홍보리스트</h1>
          <p className="text-xs text-gray-500 mt-1">전화번호로 앱회원 검색 후 쿠폰 지급</p>
        </div>
        <Link href="/coupon-purchases" className="text-xs text-blue-700 hover:underline">
          ← 쿠폰구매현황
        </Link>
      </div>

      <div className="sheet-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] text-gray-600 mb-1.5">조회월</label>
              <input
                type="month"
                className="h-9 px-2 text-sm border border-[var(--sheet-border)] bg-white"
                value={`${year}-${String(month).padStart(2, "0")}`}
                onChange={(e) => {
                  const v = e.target.value;
                  const [yy, mm] = v.split("-").map((x) => Number(x));
                  if (Number.isFinite(yy)) setYear(yy);
                  if (Number.isFinite(mm)) setMonth(mm);
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1.5">전화번호 검색</label>
              <input
                className="h-9 w-56 px-2 text-sm border border-[var(--sheet-border)] bg-white"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                placeholder="0102184..."
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1.5">최소 추천수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="h-9 w-20 px-2 text-sm border border-[var(--sheet-border)] bg-white"
                  value={minReferrerCount}
                  onChange={(e) => setMinReferrerCount(Number(e.target.value || 0))}
                />
                <span className="text-[11px] text-gray-600">명 이상</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1.5">최소 콜수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="h-9 w-20 px-2 text-sm border border-[var(--sheet-border)] bg-white"
                  value={minRideCount}
                  onChange={(e) => setMinRideCount(Number(e.target.value || 0))}
                />
                <span className="text-[11px] text-gray-600">콜 이상</span>
              </div>
            </div>

            <button
              onClick={() => setPage(1)}
              disabled={loadingCustomers}
              className="h-9 px-4 text-sm sheet-btn sheet-btn-primary disabled:opacity-50"
            >
              검색
            </button>

            <button
              onClick={() => {
                setPhoneQuery("");
                setYear(2026);
                setMonth(3);
                setMinReferrerCount(0);
                setMinRideCount(0);
                setSelectedUserId("");
                setPage(1);
                setReceivedMap({});
              }}
              disabled={loadingCustomers}
              className="h-9 px-4 text-sm sheet-btn disabled:opacity-50"
            >
              초기화
            </button>
          </div>

          <div className="text-xs text-gray-600 leading-relaxed">
            총.{" "}
            <span className="font-semibold text-gray-800">{loadingCustomers ? "—" : totalCount}</span> 명
            <span className="text-gray-400"> / 전체 {loadingCustomers ? "—" : customers.length}명</span>
          </div>
        </div>
      </div>

      <div className="sheet-wrap mt-4">
        <div className="overflow-x-auto">
          <table className="sheet-table text-[11px]">
            <thead className="sticky">
              <tr>
                <th className="w-[60px]">No</th>
                <th className="w-[70px]">선택</th>
                <th className="w-[140px]">이름</th>
                <th className="w-[160px]">휴대전화</th>
                <th className="w-[90px] text-right">추천수</th>
                <th className="w-[90px] text-right">콜수</th>
                <th className="w-[90px] text-center">스타벅스</th>
                <th className="w-[100px] text-center">교촌치킨</th>
              </tr>
            </thead>

            <tbody>
              {loadingCustomers ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : totalCount === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-left text-gray-600">
                    자료가 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                pageItems.map((c, i) => {
                  const idx = (page - 1) * PAGE_SIZE + i + 1;
                  const isSelected = selectedUserId === c.id;
                  const rec = receivedMap[c.id] ?? {};
                  return (
                    <tr
                      key={c.id ?? idx}
                      className={isSelected ? "sheet-selected" : idx % 2 === 0 ? "" : "bg-white/5"}
                    >
                      <td className="text-center text-gray-700">{idx}</td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedUserId(isSelected ? "" : c.id)}
                        />
                      </td>
                      <td className="text-gray-800">{c.name || "—"}</td>
                      <td className="font-mono text-gray-700">{formatPhone(c.mobile || c.phone || c.otherPhone)}</td>
                      <td className="text-right text-gray-700">{formatNumber(c.referrer1Count ?? 0)}</td>
                      <td className="text-right text-gray-700">{formatNumber(c.rideCount ?? 0)}</td>
                      <td className="text-center">{rec.starbucks ? <span className="text-green-600 font-semibold">✓</span> : "—"}</td>
                      <td className="text-center">{rec.kyochon ? <span className="text-green-600 font-semibold">✓</span> : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[var(--sheet-border)] flex items-center justify-between gap-3">
          <div className="text-xs text-gray-700">
            {selectedUserId
              ? `선택됨: ${selectedUser?.name || selectedUser?.phone || ""} / ${formatPhone(
                  selectedUser?.mobile || selectedUser?.phone || selectedUser?.otherPhone
                )}`
              : "선택된 수신자가 없습니다."}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {pageList.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={loadingCustomers}
                  className={`h-8 px-3 text-sm sheet-btn ${p === page ? "sheet-btn-primary" : ""} disabled:opacity-50`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => setCouponModalOpen(true)}
          disabled={sending || !selectedUserId || loadingCustomers || loadingCoupons}
          className="h-10 px-5"
        >
          {sending ? "발송 중..." : "쿠폰 지급"}
        </Button>
      </div>

      {couponModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCouponModalOpen(false);
          }}
        >
          <div className="w-full max-w-md sheet-wrap bg-white">
            <div className="px-4 py-3 border-b border-[var(--sheet-border)] flex items-center justify-between">
              <div className="font-semibold text-sm text-gray-800">쿠폰 선택</div>
              <button
                className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                onClick={() => setCouponModalOpen(false)}
              >
          닫기
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                className={`w-full px-3 py-3 rounded border text-left flex items-center justify-between ${
                  pendingCouponKey === "starbucks" ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200"
                }`}
                onClick={() => setPendingCouponKey("starbucks")}
              >
                <span className="font-semibold text-gray-800">스타벅스 커피</span>
                <span className="text-gray-500 text-xs">({starbucksCouponCode ? starbucksCouponCode : "쿠폰없음"})</span>
              </button>

              <button
                className={`w-full px-3 py-3 rounded border text-left flex items-center justify-between ${
                  pendingCouponKey === "kyochon" ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200"
                }`}
                onClick={() => setPendingCouponKey("kyochon")}
              >
                <span className="font-semibold text-gray-800">교촌치킨</span>
                <span className="text-gray-500 text-xs">({kyochonCouponCode ? kyochonCouponCode : "쿠폰없음"})</span>
              </button>
            </div>

            <div className="px-4 py-3 border-t border-[var(--sheet-border)] flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                onClick={() => setCouponModalOpen(false)}
                disabled={sending}
              >
                취소
              </button>
              <button
                className="px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                onClick={async () => {
                  await handleSendCoupon(pendingCouponKey);
                  setCouponModalOpen(false);
                }}
                disabled={sending}
              >
                지급
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

