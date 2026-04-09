"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function MileageHistoryPage() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const limit = 30;

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (userId) params.set("userId", userId);
        const res = await fetch(`${API_BASE}/admin/mileage/history?${params}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.data?.items || data.items || []);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken, page, userId]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">마일리지 적립현황</h1>
          <p className="text-gray-500 text-sm mt-1">
            전체 적립 이력 · 앱 완료 시 rideEarnRate(%), 추천인 referrerRideRate(%) 등은{" "}
            <Link href="/accumulation" className="text-blue-600 hover:underline">
              적립설정
            </Link>
            에서 변경
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          placeholder="이용자 ID 검색"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-48"
        />
      </div>

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
          <h2 className="font-semibold">마일리지 이력</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left">시각</th>
                <th className="px-4 py-2.5 text-left">이용자</th>
                <th className="px-4 py-2.5 text-left">유형</th>
                <th className="px-4 py-2.5 text-right">금액</th>
                <th className="px-4 py-2.5 text-left">비고</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((r, i) => (
                  <tr key={r.id || i}>
                    <td className="px-4 py-2.5 text-gray-500">{r.createdAt || r.date || "-"}</td>
                    <td className="px-4 py-2.5 font-medium">{r.userName || r.userId || "-"}</td>
                    <td className="px-4 py-2.5">{r.type || "-"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{(r.amount ?? 0).toLocaleString()}P</td>
                    <td className="px-4 py-2.5 text-gray-500">{r.note || "-"}</td>
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
