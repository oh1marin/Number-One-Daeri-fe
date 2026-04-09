"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** 3월~12월 기준 월 라벨 */
const MONTHS = ["03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

/** API 없을 때 목업 월별 데이터 */
function getDefaultChartData() {
  const baseYear = 2026;
  const key = String(baseYear);
  return MONTHS.map((m, i) => ({
    month: m,
    [key]: [57, 0, 0, 0, 0, 0, 0, 0, 0, 0][i],
  }));
}

export default function AppInstallStatsPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  const [stats, setStats] = useState<{
    thisMonthInstall: number;
    thisMonthDailyAvg: number;
    annualTotalInstall: number;
    annualTotalCalls: number;
    maxInstall: number;
    maxInstallMonth: number;
    monthlyAvgInstall: number;
    monthlyAvgBaseMonths: number;
    chartData: { month: string; [key: string]: string | number }[];
  } | null>(null);

  const load = async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setStats({
        thisMonthInstall: 57,
        thisMonthDailyAvg: 4.14,
        annualTotalInstall: 57,
        annualTotalCalls: 0,
        maxInstall: 57,
        maxInstallMonth: 3,
        monthlyAvgInstall: 57,
        monthlyAvgBaseMonths: 1,
        chartData: getDefaultChartData(),
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) });
      const res = await fetch(`${API_BASE}/admin/app-install-stats?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const d = data.data ?? data;
        setStats({
          thisMonthInstall: d.thisMonthInstall ?? 57,
          thisMonthDailyAvg: d.thisMonthDailyAvg ?? 4.14,
          annualTotalInstall: d.annualTotalInstall ?? 57,
          annualTotalCalls: d.annualTotalCalls ?? 0,
          maxInstall: d.maxInstall ?? 57,
          maxInstallMonth: d.maxInstallMonth ?? 3,
          monthlyAvgInstall: d.monthlyAvgInstall ?? 57,
          monthlyAvgBaseMonths: d.monthlyAvgBaseMonths ?? 1,
          chartData: Array.isArray(d.chartData) ? d.chartData : getDefaultChartData(),
        });
      } else {
        setStats({
          thisMonthInstall: 57,
          thisMonthDailyAvg: 4.14,
          annualTotalInstall: 57,
          annualTotalCalls: 0,
          maxInstall: 57,
          maxInstallMonth: 3,
          monthlyAvgInstall: 57,
          monthlyAvgBaseMonths: 1,
          chartData: getDefaultChartData(),
        });
      }
    } catch {
      setStats({
        thisMonthInstall: 57,
        thisMonthDailyAvg: 4.14,
        annualTotalInstall: 57,
        annualTotalCalls: 0,
        maxInstall: 57,
        maxInstallMonth: 3,
        monthlyAvgInstall: 57,
        monthlyAvgBaseMonths: 1,
        chartData: getDefaultChartData(),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [getAccessToken, year, month]);

  const handleSearch = () => load();

  const baseYear = 2026;

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">앱 설치 통계</h1>
        <p className="text-gray-500 text-sm mt-1">월별 설치 현황</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">로딩 중…</div>
      ) : stats ? (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">이번 달 설치:</span>
              <span className="font-bold text-lg">{stats.thisMonthInstall.toLocaleString()}건</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">이번 달 일평균:</span>
              <span className="font-bold text-lg">{stats.thisMonthDailyAvg.toFixed(2)}건</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="month"
              min="2026-03"
              value={`${year}-${String(month).padStart(2, "0")}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                if (y) setYear(y);
                if (m) setMonth(m);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              검색
            </button>
          </div>

          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
            추천 콜 수 등 지표는 백엔드 응답에 따라 표시됩니다.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">연간 설치 총계</p>
              <p className="text-2xl font-bold text-gray-900">{stats.annualTotalInstall.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">3월 기준</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">연간 콜 총계</p>
              <p className="text-2xl font-bold text-gray-900">{stats.annualTotalCalls.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">3월 기준</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">최고 설치</p>
              <p className="text-2xl font-bold text-gray-900">{stats.maxInstall}</p>
              <p className="text-xs text-gray-500 mt-1">{String(stats.maxInstallMonth).padStart(2, "0")}월</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">설치 월평균</p>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlyAvgInstall}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.monthlyAvgBaseMonths}개월 기준</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {baseYear}년 월별 설치 추이 (3월~)
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [Number(value ?? 0), ""]}
                    labelFormatter={(label) => `월 ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={String(baseYear)}
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    name={String(baseYear)}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
