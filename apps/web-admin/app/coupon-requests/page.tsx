"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatDate(s: string): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${m}-${day} ${h}:${min}`;
  } catch {
    return s;
  }
}

function maskPhone(phone: string): string {
  if (!phone) return "-";
  return phone; // 자동 발송을 위해 전체 번호 표시
}

type StatusFilter = "pending_delivery" | "delivered" | "all";

interface CouponRequest {
  id: string;
  userName?: string;
  userPhone?: string;
  couponName?: string;
  couponType?: string;
  status: string;
  redeemedAt?: string;
  deliveredAt?: string;
  isMock?: boolean;
}

export default function CouponRequestsPage() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<CouponRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [completing, setCompleting] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [mockBannerDismissed, setMockBannerDismissed] = useState(false);

  // TODO: 백엔드 연동 후 MOCK_MODE = false 로 변경
  const MOCK_MODE = true;

  const MOCK_DATA: CouponRequest[] = [
    {
      id: "mock_real_user_01",
      userName: "김유진",
      userPhone: "010-2184-8822",
      couponName: "교촌치킨 프라이드 세트",
      couponType: "chicken",
      status: "pending_delivery",
      redeemedAt: new Date().toISOString(),
      isMock: true,
    },
  ];

  const load = useCallback(async () => {
    setLoading(true);

    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 400)); // 로딩 연출
      const filtered =
        statusFilter === "all" ? MOCK_DATA : MOCK_DATA.filter((r) => r.status === statusFilter);
      setItems(filtered);
      setLastRefreshed(new Date());
      setLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setItems([]);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);

    try {
      const res = await fetch(`${API_BASE}/admin/coupon-requests?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setItems([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const root = data?.data ?? data;
      const list = root?.items ?? root?.list ?? (Array.isArray(root) ? root : []);
      setItems(Array.isArray(list) ? list : []);
      setLastRefreshed(new Date());
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [getAccessToken, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async (id: string) => {
    if (completing) return;
    if (!confirm("발송 완료로 처리하시겠습니까?")) return;
    setCompleting(id);
    const token = getAccessToken();
    try {
      const res = await fetch(`${API_BASE}/admin/coupon-requests/${id}/complete`, {
        credentials: "include",
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        await load();
      } else {
        alert("처리에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
    setCompleting(null);
  };

  const pendingCount = items.filter((r) => r.status === "pending_delivery").length;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">기프티콘 신청 목록</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            신청 접수 후 제휴사에서 발송하고, 이 화면에서 발송완료를 처리합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">
              {lastRefreshed.toLocaleTimeString()} 기준
            </span>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? "로딩 중…" : "새로고침"}
          </Button>
        </div>
      </div>

      {MOCK_MODE && !mockBannerDismissed && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <span className="text-xl" aria-hidden>
            ⚠️
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-yellow-800">현재 목업(테스트) 데이터입니다</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              실제 신청 데이터가 아닙니다. 백엔드 연동 후{" "}
              <code className="bg-yellow-100 px-1 rounded">MOCK_MODE = false</code>로 변경하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMockBannerDismissed(true)}
            className="text-yellow-600 hover:text-yellow-900 text-lg font-bold leading-none px-1"
            title="닫기"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        {(
          [
            { value: "pending_delivery", label: "발송 대기" },
            { value: "delivered", label: "발송 완료" },
            { value: "all", label: "전체" },
          ] as { value: StatusFilter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 text-sm rounded-full font-medium border transition-colors ${
              statusFilter === tab.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
            }`}
          >
            {tab.label}
            {tab.value === "pending_delivery" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {!loading && pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span className="text-base" aria-hidden>
            ⏳
          </span>
          <span>
            <span className="font-semibold">{pendingCount}건</span>의 기프티콘 신청이 발송 대기 중입니다.
            제휴사에서 발송을 마친 뒤 아래{" "}
            <span className="font-semibold">[발송완료]</span> 버튼을 눌러주세요.
          </span>
        </div>
      )}

      <div className="sheet-wrap">
        <div className="overflow-x-auto">
          <table className="sheet-table">
            <thead className="sticky">
              <tr>
                <th className="w-[130px]">이용자</th>
                <th className="w-[150px]">연락처</th>
                <th className="w-[160px]">쿠폰</th>
                <th className="w-[70px] text-center">상태</th>
                <th className="w-[120px]">신청시각</th>
                <th className="w-[120px]">발송시각</th>
                <th className="w-[130px] text-center">처리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    로딩 중…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    {statusFilter === "pending_delivery"
                      ? "대기 중인 신청이 없습니다."
                      : "데이터가 없습니다."}
                  </td>
                </tr>
              ) : (
                items.map((r) => {
                  const isPending = r.status === "pending_delivery";
                  return (
                    <tr
                      key={r.id}
                      className={r.isMock ? "opacity-70 bg-gray-50" : isPending ? "bg-amber-50/40" : ""}
                    >
                      <td className="font-medium text-gray-800">
                        {r.userName || "—"}
                        {r.isMock && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-300 text-yellow-900 border border-yellow-400 align-middle">
                            MOCK
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-gray-700">{maskPhone(r.userPhone || "")}</td>
                      <td className="text-gray-800">{r.couponName || r.couponType || "—"}</td>
                      <td className="text-center">
                        {isPending ? (
                          <Badge variant="warning">대기중</Badge>
                        ) : (
                          <Badge variant="success">발송완료</Badge>
                        )}
                      </td>
                      <td className="text-gray-500 text-xs">{formatDate(r.redeemedAt || "")}</td>
                      <td className="text-gray-500 text-xs">
                        {r.deliveredAt ? formatDate(r.deliveredAt) : "—"}
                      </td>
                      <td className="text-center">
                        {isPending ? (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleComplete(r.id)}
                            disabled={completing === r.id}
                          >
                            {completing === r.id ? "처리 중…" : "발송완료"}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">완료</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <div className="text-xs text-gray-500">
                    총 {loading ? "…" : `${items.length}건`}
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
