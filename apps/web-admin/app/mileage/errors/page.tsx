"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function MileageErrorsPage() {
  const { getAccessToken } = useAuth();
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setErrors([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/mileage/errors`, {
        credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.data?.items ?? data.data ?? data.items ?? data;
          setErrors(Array.isArray(raw) ? raw : []);
        } else {
          setErrors([]);
        }
      } catch {
        setErrors([]);
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">마일리지 오류현황</h1>
        <p className="text-gray-500 text-sm mt-1">오류 목록</p>
      </div>

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
          <h2 className="font-semibold">오류 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left">시각</th>
                <th className="px-4 py-2.5 text-left">이용자</th>
                <th className="px-4 py-2.5 text-left">내용</th>
                <th className="px-4 py-2.5 text-left">상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">로딩 중…</td>
                </tr>
              ) : errors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    오류가 없습니다.
                  </td>
                </tr>
              ) : (
                (Array.isArray(errors) ? errors : []).map((e, i) => (
                  <tr key={e.id || i} className={e.resolved ? "opacity-60" : ""}>
                    <td className="px-4 py-2.5 text-gray-500">{e.createdAt || e.date || "—"}</td>
                    <td className="px-4 py-2.5 font-medium">{e.userId || e.userName || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-700">{e.message || e.content || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={e.resolved ? "text-green-600" : "text-red-600"}>
                        {e.resolved ? "해결됨" : "미해결"}
                      </span>
                    </td>
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
