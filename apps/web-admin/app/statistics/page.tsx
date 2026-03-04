"use client";

import { useEffect, useState } from "react";
import { getRecords } from "@/lib/store";
import { RideRecord } from "@/lib/types";

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}시`);

function getMonthlyData(records: RideRecord[], keyFn: (r: RideRecord) => string, keyValue: string) {
  const result = Array(12).fill(0);
  records
    .filter((r) => keyFn(r) === keyValue)
    .forEach((r) => {
      const m = new Date(r.date).getMonth();
      if (!isNaN(m)) result[m] += r.total;
    });
  return result;
}

function getHourlyData(records: RideRecord[]) {
  const result = Array(24).fill(0);
  records.forEach((r) => {
    const h = parseInt(r.time?.slice(0, 2) ?? "0");
    if (!isNaN(h)) result[h]++;
  });
  return result;
}

export default function StatisticsPage() {
  const [records, setRecords] = useState<RideRecord[]>([]);
  const [driverInput, setDriverInput] = useState("");
  const [pickupInput, setPickupInput] = useState("");

  useEffect(() => { setRecords(getRecords()); }, []);

  const driverData = getMonthlyData(records, (r) => r.driverName, driverInput);
  const pickupData = getMonthlyData(records, (r) => r.pickup, pickupInput);
  const hourlyData = getHourlyData(records);

  const driverTotal = driverData.reduce((s, v) => s + v, 0);
  const pickupTotal = pickupData.reduce((s, v) => s + v, 0);
  const hourlyTotal = hourlyData.reduce((s, v) => s + v, 0);

  const maxHourly = Math.max(...hourlyData, 1);

  const TABLE_CLS = "border border-gray-200 text-xs text-center";
  const TH_CLS = "bg-amber-100 border border-gray-200 px-2 py-1.5 font-medium text-gray-700";
  const TD_CLS = "border border-gray-200 px-2 py-1.5";
  const TD_VAL = "border border-gray-200 px-2 py-1.5 text-right font-medium";

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="text-gray-500 text-sm mt-1">기사별 · 출발지별 · 시간대별 통계</p>
      </div>

      {/* 기사별 통계 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-base">기사별 통계</h2>
          <input
            value={driverInput}
            onChange={(e) => setDriverInput(e.target.value)}
            placeholder="기사명을 입력하세요"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
          />
          {driverTotal > 0 && (
            <span className="text-sm text-blue-600 font-semibold">합계: {driverTotal.toLocaleString()}원</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${TABLE_CLS}`}>
            <thead>
              <tr>
                <th className={TH_CLS}>구분</th>
                {MONTHS.map((m) => <th key={m} className={TH_CLS}>{m}</th>)}
                <th className={`${TH_CLS} bg-amber-200`}>합계금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TD_CLS} bg-amber-50 font-medium`}>금액</td>
                {driverData.map((v, i) => (
                  <td key={i} className={TD_VAL}>{v > 0 ? v.toLocaleString() : ""}</td>
                ))}
                <td className={`${TD_VAL} bg-amber-50 font-bold text-blue-600`}>
                  {driverTotal > 0 ? driverTotal.toLocaleString() : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">기사명을 입력하면 해당 기사의 월별 매출이 표시됩니다.</p>
      </div>

      {/* 출발지별 통계 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-base">출발지별 통계</h2>
          <input
            value={pickupInput}
            onChange={(e) => setPickupInput(e.target.value)}
            placeholder="출발지를 입력하세요"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
          />
          {pickupTotal > 0 && (
            <span className="text-sm text-blue-600 font-semibold">합계: {pickupTotal.toLocaleString()}원</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${TABLE_CLS}`}>
            <thead>
              <tr>
                <th className={TH_CLS}>구분</th>
                {MONTHS.map((m) => <th key={m} className={TH_CLS}>{m}</th>)}
                <th className={`${TH_CLS} bg-amber-200`}>합계금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TD_CLS} bg-amber-50 font-medium`}>금액</td>
                {pickupData.map((v, i) => (
                  <td key={i} className={TD_VAL}>{v > 0 ? v.toLocaleString() : ""}</td>
                ))}
                <td className={`${TD_VAL} bg-amber-50 font-bold text-blue-600`}>
                  {pickupTotal > 0 ? pickupTotal.toLocaleString() : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">출발지명을 입력하면 해당 출발지의 월별 매출이 표시됩니다.</p>
      </div>

      {/* 시간대별 통계 */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base">시간대별 통계</h2>
          {hourlyTotal > 0 && (
            <span className="text-sm text-blue-600 font-semibold">총 {hourlyTotal}건</span>
          )}
        </div>

        {/* 바 차트 */}
        <div className="flex items-end gap-1 h-32 mb-3 px-1">
          {hourlyData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-blue-400 rounded-t transition-all"
                style={{ height: `${(v / maxHourly) * 100}%`, minHeight: v > 0 ? "4px" : "0" }}
              />
            </div>
          ))}
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className={`w-full ${TABLE_CLS}`}>
            <thead>
              <tr>
                <th className={TH_CLS}>시간대</th>
                {HOURS.slice(0, 12).map((h) => <th key={h} className={TH_CLS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TD_CLS} bg-amber-50 font-medium`}>건수</td>
                {hourlyData.slice(0, 12).map((v, i) => (
                  <td key={i} className={TD_VAL}>{v > 0 ? v : ""}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <table className={`w-full ${TABLE_CLS} mt-1`}>
            <thead>
              <tr>
                <th className={TH_CLS}>시간대</th>
                {HOURS.slice(12).map((h) => <th key={h} className={TH_CLS}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${TD_CLS} bg-amber-50 font-medium`}>건수</td>
                {hourlyData.slice(12).map((v, i) => (
                  <td key={i} className={TD_VAL}>{v > 0 ? v : ""}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">시간대별 건수를 통해 피크 타임을 파악할 수 있습니다.</p>
      </div>
    </div>
  );
}
