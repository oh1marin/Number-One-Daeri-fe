"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveRecord, generateId, getRecords, getCustomers } from "@/lib/store";
import { RideRecord, Customer } from "@/lib/types";

const SETTINGS_KEY = "ride_admin_settings";

function getAreas(): string[] {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return s.areas ?? [];
  } catch { return []; }
}

function getFare(pickup: string, dropoff: string): number {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return s.fares?.[pickup]?.[dropoff] ?? 0;
  } catch { return 0; }
}

const BLANK: Omit<RideRecord, "id" | "total"> = {
  customerName: "",
  phone: "",
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  driverName: "",
  pickup: "",
  dropoff: "",
  fare: 0,
  discount: 0,
  extra: 0,
  note: "",
};

export default function RideNewPage() {
  const router = useRouter();
  const [form, setForm] = useState(BLANK);
  const [areas, setAreas] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [showCustModal, setShowCustModal] = useState(false);
  const [linkedCustomerId, setLinkedCustomerId] = useState("");

  useEffect(() => {
    setAreas(getAreas());
    const recs = getRecords();
    const ds = Array.from(new Set(recs.map((r) => r.driverName).filter(Boolean)));
    setDrivers(ds);
    setCustomers(getCustomers());
  }, []);

  const filteredCustomers = customers.filter((c) =>
    !custSearch || c.name.includes(custSearch) || c.mobile.includes(custSearch) || c.phone.includes(custSearch)
  );

  const selectCustomer = (c: Customer) => {
    setForm((prev) => ({ ...prev, customerName: c.name, phone: c.mobile || c.phone }));
    setLinkedCustomerId(c.id);
    setShowCustModal(false);
    setCustSearch("");
  };

  const total = (form.fare || 0) + (form.extra || 0) - (form.discount || 0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: name === "fare" || name === "discount" || name === "extra" ? Number(value) : value };
      if (name === "pickup" || name === "dropoff") {
        const autoFare = getFare(
          name === "pickup" ? value : prev.pickup,
          name === "dropoff" ? value : prev.dropoff
        );
        if (autoFare > 0) next.fare = autoFare;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!form.customerName || !form.date || !form.pickup || !form.dropoff) {
      alert("고객명, 날짜, 출발지, 도착지는 필수입니다.");
      return;
    }
    saveRecord({ ...form, id: generateId(), total, ...(linkedCustomerId ? { customerId: linkedCustomerId } : {}) } as any);
    setSaved(true);
    setTimeout(() => { setForm({ ...BLANK, date: form.date }); setLinkedCustomerId(""); setSaved(false); }, 1200);
  };

  const handleReset = () => setForm(BLANK);

  const FIELD_CLS = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">콜 입력</h1>
        <p className="text-gray-500 text-sm mt-1">정보내역 입력창</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              고객명 및 업소명 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-1">
              <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="홍길동" className={FIELD_CLS + " flex-1"} />
              <button type="button" onClick={() => setShowCustModal(true)}
                className="px-2 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 transition" title="고객 검색">
                🔍
              </button>
            </div>
            {linkedCustomerId && (
              <p className="text-xs text-blue-600 mt-1">✓ 고객 연동됨</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">연락처</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" className={FIELD_CLS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              날짜 <span className="text-red-400">*</span>
            </label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className={FIELD_CLS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">시간</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} className={FIELD_CLS} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">기사명</label>
            <input
              name="driverName"
              value={form.driverName}
              onChange={handleChange}
              placeholder="기사명 입력"
              list="driver-list"
              className={FIELD_CLS}
            />
            <datalist id="driver-list">
              {drivers.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              출발지 <span className="text-red-400">*</span>
            </label>
            {areas.length > 0 ? (
              <select name="pickup" value={form.pickup} onChange={handleChange} className={FIELD_CLS}>
                <option value="">선택</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <input name="pickup" value={form.pickup} onChange={handleChange} placeholder="출발지" className={FIELD_CLS} />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              도착지 <span className="text-red-400">*</span>
            </label>
            {areas.length > 0 ? (
              <select name="dropoff" value={form.dropoff} onChange={handleChange} className={FIELD_CLS}>
                <option value="">선택</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <input name="dropoff" value={form.dropoff} onChange={handleChange} placeholder="도착지" className={FIELD_CLS} />
            )}
          </div>
        </div>

        {/* Row 3 — 요금 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">요금 (원)</label>
            <input type="number" name="fare" value={form.fare || ""} onChange={handleChange} placeholder="0" className={FIELD_CLS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">할인금액 (원)</label>
            <input type="number" name="discount" value={form.discount || ""} onChange={handleChange} placeholder="0" className={FIELD_CLS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">추가금액 (원)</label>
            <input type="number" name="extra" value={form.extra || ""} onChange={handleChange} placeholder="0" className={FIELD_CLS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">금액합계 (원)</label>
            <div className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-bold text-blue-700">
              {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Row 4 — 비고 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">비고</label>
          <input name="note" value={form.note} onChange={handleChange} placeholder="메모 사항을 입력하세요" className={FIELD_CLS} />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            입력하기
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            다시쓰기
          </button>
          <button
            onClick={() => router.push("/rides")}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            조회 화면으로
          </button>
          {saved && <span className="text-green-600 text-sm font-medium">✓ 저장됐습니다</span>}
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 space-y-1">
        <p>• 흰색 영역에 각 데이터를 입력하세요. 날짜 형식: YYYY-MM-DD</p>
        <p>• 요금 설정에서 지역별 요금을 미리 설정하면 출발지/도착지 선택 시 자동 계산됩니다.</p>
        <p>• 🔍 버튼으로 고객을 검색하면 이름·연락처가 자동 입력되고 운행 이력이 연동됩니다.</p>
        <p>• 입력하기 버튼을 클릭하면 데이터가 저장됩니다.</p>
      </div>

      {/* 고객 검색 모달 */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-base">고객 검색</h3>
              <button onClick={() => { setShowCustModal(false); setCustSearch(""); }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <input
                autoFocus
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                placeholder="이름 또는 연락처로 검색"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">검색 결과 없음</p>
              ) : filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCustomer(c)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-50 transition text-left border-b border-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.name}
                      <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{c.category}</span>
                    </p>
                    <p className="text-xs text-gray-400">{c.mobile || c.phone} · {c.address}</p>
                  </div>
                  <span className="text-xs text-gray-400">{String(c.no).padStart(4,"0")}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
