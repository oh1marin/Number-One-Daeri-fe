"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecords } from "@/lib/store";
import { RideRecord } from "@/lib/types";

export default function DashboardPage() {
  const [records, setRecords] = useState<RideRecord[]>([]);

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  const totalFare = records.reduce((s, r) => s + r.total, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayFare = todayRecords.reduce((s, r) => s + r.total, 0);

  const driverSet = new Set(records.map((r) => r.driverName).filter(Boolean));

  const CARDS = [
    { label: "전체 건수", value: `${records.length}건`, icon: "📋", color: "bg-blue-500" },
    { label: "오늘 건수", value: `${todayRecords.length}건`, icon: "📅", color: "bg-green-500" },
    { label: "전체 매출", value: `${totalFare.toLocaleString()}원`, icon: "💰", color: "bg-purple-500" },
    { label: "오늘 매출", value: `${todayFare.toLocaleString()}원`, icon: "📈", color: "bg-orange-500" },
  ];

  const recent = [...records].reverse().slice(0, 8);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">{todayStr} 기준</p>
        </div>
        <Link
          href="/rides/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + 콜 입력
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {CARDS.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center text-lg mb-3`}>
              {c.icon}
            </div>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Records */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold">최근 입력 내역</h2>
            <Link href="/rides" className="text-xs text-blue-600 hover:underline">전체보기</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">날짜</th>
                  <th className="px-4 py-2.5 text-left">고객명</th>
                  <th className="px-4 py-2.5 text-left">기사</th>
                  <th className="px-4 py-2.5 text-left">출발지</th>
                  <th className="px-4 py-2.5 text-right">합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      입력된 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  recent.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-500">{r.date}</td>
                      <td className="px-4 py-2.5 font-medium">{r.customerName}</td>
                      <td className="px-4 py-2.5">{r.driverName}</td>
                      <td className="px-4 py-2.5 text-gray-500">{r.pickup}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{r.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Summary */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold">기사별 현황</h2>
          </div>
          <div className="p-4 space-y-2">
            {driverSet.size === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">데이터 없음</p>
            ) : (
              Array.from(driverSet).map((driver) => {
                const driverRecs = records.filter((r) => r.driverName === driver);
                const sum = driverRecs.reduce((s, r) => s + r.total, 0);
                return (
                  <div key={driver} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{driver}</p>
                      <p className="text-xs text-gray-400">{driverRecs.length}건</p>
                    </div>
                    <p className="text-sm font-bold text-blue-600">{sum.toLocaleString()}원</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
