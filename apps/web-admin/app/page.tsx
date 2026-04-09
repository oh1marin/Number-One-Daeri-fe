"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Calendar, Wallet, TrendingUp } from "lucide-react";
import { getRecords } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { hasAdminWebSession } from "@/lib/auth";
import { adminCredentialsInit } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** API recentRides / driverSummary 항목 타입 */
interface RecentRide {
  id?: string;
  date?: string;
  customerName?: string;
  driverName?: string;
  pickup?: string;
  total?: number;
}
interface DriverSummaryItem {
  driverName?: string;
  name?: string;
  count?: number;
  amount?: number;
}

export default function DashboardPage() {
  const { getAccessToken } = useAuth();
  const [todayCard, setTodayCard] = useState<{
    count?: number;
    totalAmount?: number;
  } | null>(null);
  const [cardSectionOpen, setCardSectionOpen] = useState(true);
  const [dashboard, setDashboard] = useState<{
    totalCount: number;
    todayCount: number;
    totalAmount: number;
    todayAmount: number;
    recentRides: RecentRide[];
    driverSummary: DriverSummaryItem[];
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE || !hasAdminWebSession()) return;
    setApiError(null);
    Promise.all([
      fetch(`${API_BASE}/admin/dashboard`, adminCredentialsInit(getAccessToken)),
      fetch(`${API_BASE}/admin/card-payments/today`, adminCredentialsInit(getAccessToken)),
    ])
      .then(([r1, r2]) => {
        if (!r1.ok || !r2.ok) {
          setApiError(
            `대시보드 API 응답 오류 (대시보드 ${r1.status}, 카드 ${r2.status}). 서버·토큰을 확인하세요.`,
          );
        }
        return Promise.all([r1.ok ? r1.json() : null, r2.ok ? r2.json() : null]);
      })
      .then(([dashRes, cardRes]) => {
        const d = dashRes?.data ?? dashRes;
        if (
          d &&
          (d.totalCount != null ||
            d.totalAmount != null ||
            Array.isArray(d.recentRides))
        ) {
          setDashboard({
            totalCount: d.totalCount ?? 0,
            todayCount: d.todayCount ?? 0,
            totalAmount: d.totalAmount ?? 0,
            todayAmount: d.todayAmount ?? 0,
            recentRides: Array.isArray(d.recentRides) ? d.recentRides : [],
            driverSummary: Array.isArray(d.driverSummary)
              ? d.driverSummary
              : [],
          });
        }
        if (cardRes?.data) setTodayCard(cardRes.data);
      })
      .catch(() => {
        setApiError("대시보드 API에 연결할 수 없습니다. NEXT_PUBLIC_API_BASE_URL·백엔드 실행·CORS를 확인하세요.");
      });
  }, [getAccessToken]);

  const records = getRecords();
  const totalFare = records.reduce((s, r) => s + r.total, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayFare = todayRecords.reduce((s, r) => s + r.total, 0);

  const totalCount = dashboard?.totalCount ?? records.length;
  const todayCount = dashboard?.todayCount ?? todayRecords.length;
  const totalAmount = dashboard?.totalAmount ?? totalFare;
  const todayAmount = dashboard?.todayAmount ?? todayFare;
  const recent = dashboard?.recentRides?.length
    ? dashboard.recentRides.slice(0, 8)
    : [...records].reverse().slice(0, 8);
  const driverList: DriverSummaryItem[] = dashboard?.driverSummary?.length
    ? dashboard.driverSummary
    : Array.from(new Set(records.map((r) => r.driverName).filter(Boolean))).map(
        (driver) => {
          const driverRecs = records.filter((r) => r.driverName === driver);
          return {
            driverName: driver,
            count: driverRecs.length,
            amount: driverRecs.reduce((s, r) => s + r.total, 0),
          };
        },
      );

  const CARDS = [
    {
      label: "전체 건수",
      value: `${totalCount.toLocaleString()}건`,
      icon: ClipboardList,
      gradient: "from-indigo-500 to-violet-600",
      light: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "오늘 건수",
      value: `${todayCount.toLocaleString()}건`,
      icon: Calendar,
      gradient: "from-emerald-500 to-teal-600",
      light: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "전체 매출",
      value: `${totalAmount.toLocaleString()}원`,
      icon: Wallet,
      gradient: "from-blue-500 to-cyan-600",
      light: "bg-blue-50 text-blue-700",
    },
    {
      label: "오늘 매출",
      value: `${todayAmount.toLocaleString()}원`,
      icon: TrendingUp,
      gradient: "from-orange-500 to-rose-500",
      light: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">{todayStr} 기준</p>
        </div>
        <Button asChild>
          <Link href="/rides/new">+ 콜 입력</Link>
        </Button>
      </div>

      {apiError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {apiError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-sm`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <Badge className={c.light + " border-0 text-[10px]"}>{c.label}</Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 당일 카드결제 (API 연동 시) */}
      {API_BASE && todayCard && (
        <div className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setCardSectionOpen(!cardSectionOpen)}
            className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <h2 className="font-semibold">당일 카드결제</h2>
            <span
              className={`text-gray-400 transition-transform ${cardSectionOpen ? "rotate-90" : ""}`}
            >
              ›
            </span>
          </button>
          {cardSectionOpen && (
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">건수</p>
                <p className="text-xl font-bold">
                  {(todayCard.count ?? 0).toLocaleString()}건
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">금액</p>
                <p className="text-xl font-bold text-blue-600">
                  {(todayCard.totalAmount ?? 0).toLocaleString()}원
                </p>
              </div>
              <Link
                href="/card-payments"
                className="col-span-2 text-sm text-blue-600 hover:underline"
              >
                카드결재현황 전체 보기 →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Records */}
        <div className="lg:col-span-2 sheet-wrap overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[var(--sheet-header-bg)]">
            <h2 className="font-semibold">최근 입력 내역</h2>
            <Link
              href="/rides"
              className="text-xs text-blue-600 hover:underline"
            >
              전체보기
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="sheet-table w-full text-xs">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-left">날짜</th>
                  <th className="px-4 py-2.5 text-left">고객명</th>
                  <th className="px-4 py-2.5 text-left">기사</th>
                  <th className="px-4 py-2.5 text-left">출발지</th>
                  <th className="px-4 py-2.5 text-right">합계</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      입력된 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  recent.map((r, i) => (
                    <tr key={(r as { id?: string }).id ?? i}>
                      <td className="px-4 py-2.5 text-gray-500">
                        {r.date ?? ""}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {r.customerName ?? ""}
                      </td>
                      <td className="px-4 py-2.5">{r.driverName ?? ""}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {r.pickup ?? ""}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {(r.total ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">기사별 현황</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {driverList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">데이터 없음</p>
            ) : (
              driverList.map((d, i) => {
                const name = d.driverName ?? d.name ?? "";
                const count = d.count ?? 0;
                const amount = d.amount ?? 0;
                return (
                  <div
                    key={name ? `${name}-${i}` : `driver-${i}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{name}</p>
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">{count}건</Badge>
                    </div>
                    <p className="text-sm font-bold text-indigo-600">
                      {amount.toLocaleString()}원
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
