"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** ISO 날짜 → YYYY.MM.DD HH:mm */
function formatDateTime(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day} ${h}:${min}`;
  } catch {
    return s;
  }
}

/** userType 표시 라벨 (앱/비앱 구분) */
function formatUserType(type: string): { label: string; isApp: boolean } {
  const t = (type || "").toLowerCase();
  if (t === "user") return { label: "이용자", isApp: true };
  if (t === "driver") return { label: "기사", isApp: false };
  if (t === "admin") return { label: "관리자", isApp: false };
  return { label: type || "기타", isApp: false };
}

export default function AppAccessPage() {
  const { getAccessToken } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [userType, setUserType] = useState<string>("");
  const limit = 30;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setLogs([]);
        setLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (userType) params.set("userType", userType);
        const res = await fetch(`${API_BASE}/admin/app-access?${params}`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.data?.items || data.items || []);
        } else {
          setLogs([]);
        }
      } catch {
        setLogs([]);
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken, page, userType]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">앱 접속 로그</h1>
        <p className="text-gray-500 text-sm mt-1">로그인 이력 조회</p>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">전체 유형</option>
          <option value="user">앱 회원</option>
          <option value="driver">기사</option>
        </select>
      </div>

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
          <h2 className="font-semibold">접속 로그</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left">시각</th>
                <th className="px-4 py-2.5 text-left">유형</th>
                <th className="px-4 py-2.5 text-left">이용자</th>
                <th className="px-4 py-2.5 text-left">기기정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    로딩 중…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => {
                  const { label: typeLabel, isApp } = formatUserType(log.userType);
                  return (
                    <tr key={log.id || i}>
                      <td className="px-4 py-2.5 text-gray-500">
                        {formatDateTime(log.loggedAt || log.createdAt || "") || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            isApp ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{log.userName || log.email || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{log.deviceInfo || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
