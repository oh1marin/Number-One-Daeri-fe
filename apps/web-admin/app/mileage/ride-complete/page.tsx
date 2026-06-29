"use client";

import { hasAdminWebSession } from "@/lib/auth";
import {
  adminCredentialsInit,
  getAdminApiFailureMessage,
  readAdminResponseBody,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const PAGE_SIZE = 20;

type MileagePaymentRow = {
  rideId: string;
  status?: string;
  pickup?: string;
  dropoff?: string;
  amount?: number;
  createdAt?: string;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    mileageBalance?: number;
  } | null;
  mileage?: {
    deducted?: boolean;
    deductedAmount?: number;
    deductedAt?: string | null;
    balanceAfterDeduct?: number | null;
    refunded?: boolean;
    refundedAmount?: number;
    refundedAt?: string | null;
    canRefund?: boolean;
  };
};

function formatNumber(n: unknown) {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  if (Number.isNaN(v)) return "0";
  return v.toLocaleString();
}

function formatDateTime(s: unknown): string {
  if (!s) return "-";
  try {
    const d = new Date(String(s));
    if (isNaN(d.getTime())) return String(s);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return String(s);
  }
}

function statusLabel(s: unknown): string {
  const map: Record<string, string> = {
    pending: "대기",
    accepted: "접수",
    driving: "운행",
    completed: "완료",
    cancelled: "취소",
  };
  const v = String(s ?? "").toLowerCase();
  return map[v] ?? (v ? String(s) : "-");
}

export default function MileageRideCompletePage() {
  const { getAccessToken } = useAuth();

  const [items, setItems] = useState<MileagePaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [phoneQuery, setPhoneQuery] = useState("");
  const [appliedPhone, setAppliedPhone] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setError(null);
    if (!API_BASE || !hasAdminWebSession()) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (appliedStatus) params.set("status", appliedStatus);
      if (appliedPhone.trim()) params.set("phone", appliedPhone.trim());

      const res = await fetch(
        `${API_BASE}/admin/mileage/ride-payments?${params}`,
        adminCredentialsInit(getAccessToken),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setItems([]);
        setTotal(0);
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const data = (json as { data?: { items?: MileagePaymentRow[]; total?: number } }).data;
      setItems(data?.items ?? []);
      setTotal(Number(data?.total ?? 0));
    } catch {
      setItems([]);
      setTotal(0);
      setError("목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, page, appliedPhone, appliedStatus]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = () => {
    setAppliedPhone(phoneQuery);
    setAppliedStatus(statusFilter);
    setPage(1);
  };

  const handleRefund = async (row: MileagePaymentRow) => {
    const rideId = row.rideId;
    if (!rideId || !row.mileage?.canRefund) return;
    const reason = window.prompt(
      "환불 사유 (선택)",
      "관리자 환불",
    );
    if (reason === null) return;

    const cancelRide = window.confirm(
      "콜 상태도 '취소'로 변경할까요?\n(확인=취소 처리, 취소=마일리지만 환불)",
    );

    setBusyId(rideId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${API_BASE}/admin/mileage/ride-payments/${encodeURIComponent(rideId)}/refund`,
        adminCredentialsInit(getAccessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || "관리자 환불", cancelRide }),
        }),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      setMessage(
        (json as { message?: string }).message ?? "마일리지를 환불했습니다.",
      );
      await loadItems();
    } catch {
      setError("환불 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (row: MileagePaymentRow) => {
    const rideId = row.rideId;
    if (!rideId || row.status === "completed" || row.status === "cancelled") return;

    const amount = row.amount ?? row.mileage?.deductedAmount ?? 0;
    if (amount <= 0) {
      setError("완료할 요금 정보가 없습니다.");
      return;
    }
    if (
      !window.confirm(
        `운행 완료 처리할까요?\n(이용 적립·추천인 적립만 반영, 마일리지는 이미 차감됨)\n요금: ${formatNumber(amount)}원`,
      )
    ) {
      return;
    }

    setBusyId(`complete-${rideId}`);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `${API_BASE}/admin/rides/${encodeURIComponent(rideId)}/complete`,
        adminCredentialsInit(getAccessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ total: amount }),
        }),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      setMessage(
        (json as { message?: string }).message ?? "운행 완료 처리되었습니다.",
      );
      await loadItems();
    } catch {
      setError("운행 완료 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-3">
        <h1 className="text-xl font-bold leading-none">마일리지 결제 내역</h1>
        <p className="text-xs text-gray-500 mt-1">
          앱 호출 시 마일리지가 즉시 차감됩니다. 문제 발생 시 환불하거나, 운행 종료 후 완료 처리로 적립을 반영하세요.
        </p>
      </div>

      {(message || error) && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="sheet-panel">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] text-gray-600 mb-1.5">콜 상태</label>
            <select
              className="h-9 px-2 text-sm border border-[var(--sheet-border)] bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-600 mb-1.5">전화번호</label>
            <input
              className="h-9 w-48 px-2 text-sm border border-[var(--sheet-border)] bg-white"
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

      <div className="sheet-wrap mt-4">
        <div className="overflow-x-auto">
          <table className="sheet-table text-[11px]">
            <thead className="sticky">
              <tr>
                <th className="w-[40px] text-center">No</th>
                <th className="w-[110px]">접수시간</th>
                <th className="w-[110px]">전화번호</th>
                <th className="w-[80px]">고객명</th>
                <th className="w-[60px]">콜상태</th>
                <th className="min-w-[100px]">출발→도착</th>
                <th className="w-[80px] text-right">결제액</th>
                <th className="w-[90px]">차감</th>
                <th className="w-[90px]">환불</th>
                <th className="w-[100px] text-right">현재 잔액</th>
                <th className="w-[130px] text-center">처리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500">
                    로딩 중…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-600">
                    마일리지 결제 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => {
                  const m = row.mileage;
                  const isCompleted = row.status === "completed";
                  const isCancelled = row.status === "cancelled";
                  const busy = busyId === row.rideId || busyId === `complete-${row.rideId}`;

                  return (
                    <tr key={row.rideId}>
                      <td className="text-center">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>{formatDateTime(row.createdAt)}</td>
                      <td className="font-mono">{row.user?.phone ?? "—"}</td>
                      <td>{row.user?.name ?? "—"}</td>
                      <td>{statusLabel(row.status)}</td>
                      <td className="max-w-[200px] truncate">
                        {row.pickup ?? "—"} → {row.dropoff ?? "—"}
                      </td>
                      <td className="text-right">{formatNumber(row.amount)}원</td>
                      <td>
                        {m?.deducted ? (
                          <span className="text-emerald-700">
                            {formatNumber(m.deductedAmount)}원
                            <br />
                            <span className="text-gray-500">{formatDateTime(m.deductedAt)}</span>
                          </span>
                        ) : (
                          <span className="text-amber-700">미차감</span>
                        )}
                      </td>
                      <td>
                        {m?.refunded ? (
                          <span className="text-blue-700">
                            {formatNumber(m.refundedAmount)}원
                            <br />
                            <span className="text-gray-500">{formatDateTime(m.refundedAt)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        {row.user?.mileageBalance != null
                          ? `${formatNumber(row.user.mileageBalance)}원`
                          : "—"}
                      </td>
                      <td className="text-center space-x-1">
                        {m?.canRefund && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] px-2"
                            disabled={busy}
                            onClick={() => void handleRefund(row)}
                          >
                            환불
                          </Button>
                        )}
                        {!isCompleted && !isCancelled && m?.deducted && !m?.refunded && (
                          <Button
                            size="sm"
                            className="h-7 text-[10px] px-2"
                            disabled={busy}
                            onClick={() => void handleComplete(row)}
                          >
                            운행완료
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--sheet-border)] flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </Button>
            <span className="text-xs text-gray-700">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
