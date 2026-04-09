"use client";

import { useEffect, useState } from "react";
import { getRecords, deleteRecord, clearAllRecords } from "@/lib/store";
import { RideRecord, SearchField } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: "customerName", label: "고객명 및 업소명" },
  { value: "phone", label: "연락처" },
  { value: "date", label: "날짜" },
  { value: "time", label: "시간" },
  { value: "driverName", label: "기사명" },
  { value: "pickup", label: "출발지" },
  { value: "dropoff", label: "도착지" },
];

export default function RidesPage() {
  const [records, setRecords] = useState<RideRecord[]>([]);
  const [field, setField] = useState<SearchField>("customerName");
  const [keyword, setKeyword] = useState("");
  const [filtered, setFiltered] = useState<RideRecord[]>([]);
  const [showAll, setShowAll] = useState(true);

  const load = () => {
    const recs = getRecords();
    setRecords(recs);
    setFiltered(recs);
    setShowAll(true);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => {
    if (!keyword.trim()) { setFiltered(records); setShowAll(true); return; }
    const result = records.filter((r) =>
      String(r[field]).toLowerCase().includes(keyword.toLowerCase())
    );
    setFiltered(result);
    setShowAll(false);
  };

  const handleShowAll = () => { setKeyword(""); setFiltered(records); setShowAll(true); };

  const handleDelete = (id: string) => {
    if (!confirm("해당 행을 삭제할까요?")) return;
    deleteRecord(id);
    load();
  };

  const handleDeleteAll = () => {
    if (!confirm("모든 데이터를 삭제할까요? 복구할 수 없습니다.")) return;
    clearAllRecords();
    load();
  };

  const totalSum = filtered.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">콜 조회</h1>
          <p className="text-gray-500 text-sm mt-1">정보내역 조회창</p>
        </div>
        <Button asChild><Link href="/rides/new">+ 콜 입력</Link></Button>
      </div>

      {/* Search */}
      <div className="sheet-panel">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">조회항목</label>
            <Select value={field} onChange={(e) => setField(e.target.value as SearchField)}>
              {SEARCH_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">검색어</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="검색어를 입력하세요"
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button onClick={handleSearch}>조회하기</Button>
            <Button variant="secondary" onClick={handleShowAll}>전체보기</Button>
            <Button variant="destructive" onClick={handleDeleteAll}>모든정보삭제</Button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {showAll ? `전체 ${records.length}건` : `검색결과 ${filtered.length}건`}
          {" · "}합계: <Badge className="ml-1">{totalSum.toLocaleString()}원</Badge>
        </p>
      </div>

      {/* Table */}
      <div className="sheet-wrap overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left">고객명 및 업소명</th>
                <th className="px-3 py-3 text-left">연락처</th>
                <th className="px-3 py-3 text-left">날짜</th>
                <th className="px-3 py-3 text-left">시간</th>
                <th className="px-3 py-3 text-left">기사명</th>
                <th className="px-3 py-3 text-left">출발지</th>
                <th className="px-3 py-3 text-left">도착지</th>
                <th className="px-3 py-3 text-right">요금</th>
                <th className="px-3 py-3 text-right">할인</th>
                <th className="px-3 py-3 text-right">추가</th>
                <th className="px-3 py-3 text-right font-bold text-gray-700">합계</th>
                <th className="px-3 py-3 text-left">비고</th>
                <th className="px-3 py-3 text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 font-medium">{r.customerName}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.phone}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.date}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.time}</td>
                    <td className="px-3 py-2.5">{r.driverName}</td>
                    <td className="px-3 py-2.5">{r.pickup}</td>
                    <td className="px-3 py-2.5">{r.dropoff}</td>
                    <td className="px-3 py-2.5 text-right">{r.fare.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-red-500">{r.discount ? `-${r.discount.toLocaleString()}` : ""}</td>
                    <td className="px-3 py-2.5 text-right text-green-600">{r.extra ? `+${r.extra.toLocaleString()}` : ""}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-600">{r.total.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-gray-400">{r.note}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2">
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-gray-600">합 계</td>
                  <td className="px-3 py-3 text-right">{filtered.reduce((s, r) => s + r.fare, 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-red-500">-{filtered.reduce((s, r) => s + r.discount, 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-green-600">+{filtered.reduce((s, r) => s + r.extra, 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-right text-blue-600">{totalSum.toLocaleString()}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 space-y-1">
        <p>• 조회항목을 선택하고 검색어를 입력 후 조회하기를 클릭하세요.</p>
        <p>• 전체보기를 클릭하면 모든 데이터를 확인할 수 있습니다.</p>
        <p>• 개별 삭제는 행의 삭제 버튼을 클릭하세요.</p>
        <p>• 모든정보삭제는 모든 데이터를 삭제합니다. 신중하게 사용하세요.</p>
      </div>
    </div>
  );
}
