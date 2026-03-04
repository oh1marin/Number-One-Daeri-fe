"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRecords, deleteRecord } from "@/lib/store";
import { RideRecord } from "@/lib/types";
import Link from "next/link";

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<RideRecord | null>(null);

  useEffect(() => {
    const found = getRecords().find((r) => r.id === params.id);
    setRecord(found ?? null);
  }, [params.id]);

  if (!record) {
    return (
      <div className="p-6">
        <Link href="/rides" className="text-sm text-gray-500 hover:underline">← 콜 목록으로</Link>
        <p className="mt-6 text-gray-400">데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirm("이 콜을 삭제할까요?")) return;
    deleteRecord(record.id);
    router.push("/rides");
  };

  const ROWS: [string, string | number][] = [
    ["고객명 및 업소명", record.customerName],
    ["연락처", record.phone],
    ["날짜", record.date],
    ["시간", record.time],
    ["기사명", record.driverName],
    ["출발지", record.pickup],
    ["도착지", record.dropoff],
    ["요금", `${record.fare.toLocaleString()}원`],
    ["할인금액", record.discount ? `-${record.discount.toLocaleString()}원` : "—"],
    ["추가금액", record.extra ? `+${record.extra.toLocaleString()}원` : "—"],
    ["금액합계", `${record.total.toLocaleString()}원`],
    ["비고", record.note || "—"],
  ];

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/rides" className="text-sm text-gray-500 hover:underline">← 콜 목록으로</Link>
        <h1 className="text-2xl font-bold mt-2">콜 상세</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">{record.customerName}</h2>
          <p className="text-xs text-gray-400">{record.date} {record.time}</p>
        </div>
        <dl className="divide-y divide-gray-50">
          {ROWS.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <dt className="text-xs text-gray-500 w-36">{label}</dt>
              <dd className={`text-sm font-medium ${label === "금액합계" ? "text-blue-600 font-bold" : ""}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleDelete}
          className="px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition"
        >
          삭제
        </button>
        <Link
          href="/rides"
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}
