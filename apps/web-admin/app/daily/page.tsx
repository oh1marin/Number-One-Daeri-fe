"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getRecords, saveRecord, deleteRecord, updateRecord, generateId, getCustomers, getDrivers } from "@/lib/store";
import { RideRecord, Customer, Driver } from "@/lib/types";
import Link from "next/link";

// ─── 빈 오더 폼 ───────────────────────────────────────────────────
const blankOrder = (date: string): Omit<RideRecord, "id" | "total"> => ({
  customerName: "", phone: "",
  date, time: new Date().toTimeString().slice(0, 5),
  driverName: "", pickup: "", dropoff: "",
  fare: 0, discount: 0, extra: 0, note: "",
});

export default function DailyPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [now, setNow] = useState("");
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [selected, setSelected] = useState<RideRecord | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // 오더 입력 폼
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState<Omit<RideRecord, "id" | "total">>(blankOrder(date));
  const [editMode, setEditMode] = useState(false);

  // 기사 지정 모달
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const driverSearchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const all = getRecords();
    setRides(all.filter((r) => r.date === date).sort((a, b) => a.time.localeCompare(b.time)));
    setCustomers(getCustomers());
    setDrivers(getDrivers());
  }, [date]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("ko-KR", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // 고객 매칭
  const matchedCustomer = selected
    ? customers.find((c) => c.name === selected.customerName || c.mobile === selected.phone || c.phone === selected.phone)
    : null;

  const customerRides = matchedCustomer
    ? getRecords().filter((r) => r.customerName === matchedCustomer.name)
    : selected ? getRecords().filter((r) => r.customerName === selected.customerName) : [];

  const totalFare = customerRides.reduce((s, r) => s + r.total, 0);

  // 날짜 표시
  const dateLabel = (() => {
    const d = new Date(date);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
  })();

  // 오더 저장
  const handleSaveOrder = () => {
    if (!orderForm.customerName || !orderForm.pickup || !orderForm.dropoff) {
      alert("고객명, 출발지, 도착지는 필수입니다."); return;
    }
    const total = orderForm.fare + orderForm.extra - orderForm.discount;
    if (editMode && selected) {
      updateRecord(selected.id, { ...orderForm, total });
    } else {
      saveRecord({ ...orderForm, id: generateId(), total });
    }
    setShowOrderForm(false);
    setEditMode(false);
    load();
  };

  const handleCancelOrder = () => {
    if (!selected) return;
    if (!confirm("선택한 접수를 취소할까요?")) return;
    deleteRecord(selected.id);
    setSelected(null);
    load();
  };

  const handleArrival = () => {
    if (!selected) return;
    const arrivedTime = new Date().toTimeString().slice(0, 5);
    updateRecord(selected.id, { note: `도착: ${arrivedTime}` });
    load();
    alert(`도착 처리됐습니다. (${arrivedTime})`);
  };

  // 기사 지정 확정
  const handleAssignDriver = () => {
    if (!selected || !selectedDriver) return;
    updateRecord(selected.id, { driverName: selectedDriver.name });
    load();
    const updated = getRecords().find((r) => r.id === selected.id);
    if (updated) setSelected(updated);
    setShowDriverModal(false);
    setSelectedDriver(null);
    setDriverSearch("");
  };

  const filteredDrivers = drivers.filter((d) =>
    !driverSearch || d.name.includes(driverSearch) || d.mobile.includes(driverSearch) || d.phone.includes(driverSearch)
  );

  // 기사별 오늘 운행 현황
  const driverDailyRides = (driverName: string) =>
    rides.filter((r) => r.driverName === driverName);

  const FIELD = "px-2 py-1 border border-blue-300 rounded text-xs bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const LABEL = "text-xs text-gray-600 whitespace-nowrap";

  return (
    <div className="flex flex-col h-screen bg-gray-200 overflow-hidden text-xs">

      {/* ─── TOP HEADER ─── */}
      <div className="bg-gray-300 border-b border-gray-400 px-3 py-1.5 flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-sm">운행일보 (Daily)</span>
        <div className="flex items-center gap-1 ml-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-2 py-0.5 border border-gray-400 rounded text-xs bg-white" />
          <span className="text-gray-600 text-xs">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-1 ml-1 text-blue-700 font-mono text-xs">
          🕐 현재시간 <span className="font-bold">{now}</span>
        </div>
        <div className="ml-auto flex gap-1.5">
          {[
            { label: "수동요금검색", icon: "🔍" },
            { label: "모든운행자료", icon: "📋", action: () => setDate("") },
            { label: "환경설정", icon: "⚙️" },
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-400 rounded text-xs hover:bg-gray-50 shadow-sm">
              <span>{icon}</span>{label}
            </button>
          ))}
          <Link href="/drivers"
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-400 rounded text-xs hover:bg-gray-50 shadow-sm">
            👤 기사님 현황
          </Link>
        </div>
      </div>

      {/* ─── 고객 정보 패널 ─── */}
      <div className="bg-gray-100 border-b border-gray-400 px-3 py-2 flex-shrink-0">
        <div className="grid grid-cols-12 gap-x-2 gap-y-1.5">
          {/* Row 1 */}
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>고객번호</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.no ?? ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>등록일자</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.registeredAt ?? ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>고객성명</span>
            <div className={FIELD + " flex-1 font-bold"}>{selected?.customerName ?? ""}</div>
          </div>
          <div className="col-span-3 flex items-center gap-1">
            <span className={LABEL}>고객정보</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.info ?? ""}</div>
          </div>
          <div className="col-span-3 flex items-center gap-1">
            <span className={LABEL}>전화번호</span>
            <div className={FIELD + " flex-1"}>{selected?.phone ?? matchedCustomer?.phone ?? ""}</div>
          </div>

          {/* Row 2 */}
          <div className="col-span-4 flex items-center gap-1">
            <span className={LABEL}>주 소</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.address ?? ""}</div>
            <div className={FIELD + " w-20"}>{matchedCustomer?.addressDetail ?? ""}</div>
          </div>
          <div className="col-span-5 flex items-center gap-1">
            <span className={LABEL}>기타사항</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.notes ?? ""}</div>
          </div>
          <div className="col-span-3 flex items-center gap-1">
            <span className={LABEL}>휴 대 폰</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.mobile ?? ""}</div>
          </div>

          {/* Row 3 */}
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>이용실적</span>
            <div className={FIELD + " flex-1"}>{totalFare > 0 ? totalFare.toLocaleString() : ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>추천실적</span>
            <div className={FIELD + " flex-1"}></div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>전체실적</span>
            <div className={FIELD + " flex-1"}>{totalFare > 0 ? totalFare.toLocaleString() : ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>최근거래</span>
            <div className={FIELD + " flex-1"}>{customerRides.at(-1)?.date ?? ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>거래횟수</span>
            <div className={FIELD + " flex-1"}>{customerRides.length > 0 ? customerRides.length : ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>누적금액</span>
            <div className={FIELD + " flex-1"}>{totalFare > 0 ? totalFare.toLocaleString() : ""}</div>
          </div>

          {/* Row 4 */}
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>출 발 지</span>
            <div className={`${FIELD} flex-1 text-blue-700 font-bold`}>{selected?.pickup ?? ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>도 착 지</span>
            <div className={`${FIELD} flex-1 text-red-600 font-bold`}>{selected?.dropoff ?? ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>업 소 명</span>
            <div className={FIELD + " flex-1"}>{matchedCustomer?.info ?? ""}</div>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span className={LABEL}>출발일자</span>
            <div className={FIELD + " flex-1"}>{selected?.date ?? ""}</div>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <span className={LABEL}>출발시간</span>
            <div className={`${FIELD} flex-1 text-blue-700 font-bold`}>{selected?.time ?? ""}</div>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <span className={LABEL}>운행요금</span>
            <div className={FIELD + " flex-1"}>{selected ? selected.total.toLocaleString() : ""}</div>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <span className={LABEL}>기 사 님</span>
            <div className={`${FIELD} flex-1 ${selected?.driverName ? "text-green-700 font-bold" : "text-gray-400"}`}>
              {selected?.driverName || "미배정"}
            </div>
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <span className={LABEL}>도착시간</span>
            <div className={FIELD + " flex-1"}></div>
          </div>
        </div>
      </div>

      {/* ─── 운행 목록 테이블 ─── */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-gray-200">
            <tr>
              {["고객번호","고객명","고객정보","접수시간","비고","출발일자","출발","출발지","도착","도착지","운행요금","기사님","업소명"].map((h) => (
                <th key={h} className="border border-gray-400 px-2 py-1.5 text-left font-medium text-gray-700 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rides.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-8 text-center text-gray-400">
                  {date} 운행 데이터가 없습니다. 신규 오더를 접수하세요.
                </td>
              </tr>
            ) : rides.map((r, i) => {
              const cust = customers.find((c) => c.name === r.customerName);
              const isSelected = selected?.id === r.id;
              return (
                <tr key={r.id} onClick={() => setSelected(isSelected ? null : r)}
                  className={`cursor-pointer border-b border-gray-200 transition
                    ${isSelected ? "bg-blue-800 text-white" : i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-blue-50 hover:bg-blue-100"}`}>
                  <td className="border-r border-gray-200 px-2 py-1.5">{cust?.no ?? ""}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5 font-medium">{r.customerName}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{cust?.info ?? ""}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{r.time}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{r.note}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{r.date}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{r.time}</td>
                  <td className={`border-r border-gray-200 px-2 py-1.5 font-medium ${isSelected ? "" : "text-blue-700"}`}>{r.pickup}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5"></td>
                  <td className={`border-r border-gray-200 px-2 py-1.5 font-medium ${isSelected ? "" : "text-red-600"}`}>{r.dropoff}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5 text-right">{r.total.toLocaleString()}</td>
                  <td className={`border-r border-gray-200 px-2 py-1.5 font-bold ${isSelected ? "" : "text-green-700"}`}>
                    {r.driverName || <span className="text-gray-300">미배정</span>}
                  </td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{cust?.info ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── 하단 버튼 ─── */}
      <div className="bg-gray-300 border-t border-gray-400 px-2 py-1.5 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5">
          <DailyBtn icon="📝" label="신규오더접수" shortcut="sBar" color="blue"
            onClick={() => { setOrderForm(blankOrder(date)); setEditMode(false); setShowOrderForm(true); }} />
          <DailyBtn icon="✏️" label="접수내용변경" shortcut="F3" color="gray"
            onClick={() => {
              if (!selected) { alert("항목을 선택하세요."); return; }
              setOrderForm({ customerName: selected.customerName, phone: selected.phone, date: selected.date, time: selected.time, driverName: selected.driverName, pickup: selected.pickup, dropoff: selected.dropoff, fare: selected.fare, discount: selected.discount, extra: selected.extra, note: selected.note });
              setEditMode(true); setShowOrderForm(true);
            }} />
          <DailyBtn icon="🚗" label="기사 지정작업" shortcut="F5" color="amber"
            onClick={() => {
              if (!selected) { alert("오더를 먼저 선택하세요."); return; }
              setSelectedDriver(null); setDriverSearch(""); setShowDriverModal(true);
              setTimeout(() => driverSearchRef.current?.focus(), 100);
            }} />
          <DailyBtn icon="💬" label="기사님 문자전송" shortcut="F7" color="gray"
            onClick={() => { if (selected?.driverName) alert(`${selected.driverName}에게 문자 전송`); else alert("기사를 먼저 지정하세요."); }} />
          <DailyBtn icon="👤" label="고객정보 이동" shortcut="F9" color="gray"
            onClick={() => { if (selected) window.open(`/customers`, "_blank"); }} />
          <DailyBtn icon="🗑️" label="화면에서 자움" shortcut="F11" color="gray"
            onClick={() => setSelected(null)} />
          <div className="w-px bg-gray-400 mx-0.5" />
          <DailyBtn icon="❌" label="접수내용취소" shortcut="F4" color="red"
            onClick={handleCancelOrder} />
          <DailyBtn icon="📊" label="기사 운행이력" shortcut="F6" color="gray"
            onClick={() => window.open(`/drivers`, "_blank")} />
          <DailyBtn icon="📍" label="목적지 도착처리" shortcut="F8" color="teal"
            onClick={handleArrival} />
          <DailyBtn icon="🔍" label="접수고객 검색" shortcut="F0" color="gray"
            onClick={() => {}} />
          <DailyBtn icon="📱" label="고객 문자전송" shortcut="F12" color="gray"
            onClick={() => { if (selected) alert(`${selected.customerName} (${selected.phone})에게 문자 전송`); }} />
          <DailyBtn icon="✅" label="작업완료" shortcut="Esc" color="orange"
            onClick={() => setSelected(null)} />
        </div>
      </div>

      {/* ─── 신규/수정 오더 폼 모달 ─── */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[560px]">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-300 flex items-center justify-between rounded-t-xl">
              <h2 className="font-bold text-sm">{editMode ? "접수내용 변경" : "신규 오더 접수"}</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-gray-400 hover:text-red-500 font-bold text-lg">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="고객성명 *" name="customerName" value={orderForm.customerName}
                  onChange={(v) => setOrderForm((p) => ({ ...p, customerName: v }))} />
                <FormField label="연락처" name="phone" value={orderForm.phone}
                  onChange={(v) => setOrderForm((p) => ({ ...p, phone: v }))} placeholder="010-0000-0000" />
                <FormField label="날짜 *" name="date" value={orderForm.date} type="date"
                  onChange={(v) => setOrderForm((p) => ({ ...p, date: v }))} />
                <FormField label="시간" name="time" value={orderForm.time} type="time"
                  onChange={(v) => setOrderForm((p) => ({ ...p, time: v }))} />
                <FormField label="출발지 *" name="pickup" value={orderForm.pickup}
                  onChange={(v) => setOrderForm((p) => ({ ...p, pickup: v }))} />
                <FormField label="도착지 *" name="dropoff" value={orderForm.dropoff}
                  onChange={(v) => setOrderForm((p) => ({ ...p, dropoff: v }))} />
                <FormField label="운행요금" name="fare" value={String(orderForm.fare || "")} type="number"
                  onChange={(v) => setOrderForm((p) => ({ ...p, fare: Number(v) }))} />
                <FormField label="할인금액" name="discount" value={String(orderForm.discount || "")} type="number"
                  onChange={(v) => setOrderForm((p) => ({ ...p, discount: Number(v) }))} />
                <FormField label="추가금액" name="extra" value={String(orderForm.extra || "")} type="number"
                  onChange={(v) => setOrderForm((p) => ({ ...p, extra: Number(v) }))} />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">합계금액</label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs font-bold text-blue-700">
                    {((orderForm.fare || 0) + (orderForm.extra || 0) - (orderForm.discount || 0)).toLocaleString()}원
                  </div>
                </div>
              </div>
              <FormField label="비고" name="note" value={orderForm.note}
                onChange={(v) => setOrderForm((p) => ({ ...p, note: v }))} />
            </div>
            <div className="flex gap-2 px-5 pb-4">
              <button onClick={handleSaveOrder} className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                {editMode ? "수정 저장" : "접수 저장"} [F12]
              </button>
              <button onClick={() => setShowOrderForm(false)} className="px-5 py-2 bg-gray-400 text-white text-sm font-semibold rounded-lg hover:bg-gray-500">
                취소 [Esc]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 기사 지정 모달 ─── */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="bg-gray-200 px-4 py-2.5 border-b border-gray-400 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <h2 className="font-bold text-sm">기사님 운행조회 / 선택</h2>
              <button onClick={() => { setShowDriverModal(false); setSelectedDriver(null); }}
                className="text-gray-400 hover:text-red-500 font-bold text-lg">✕</button>
            </div>

            <div className="flex flex-1 min-h-0 gap-0">
              {/* 좌측: 기사 지정 클릭 패널 */}
              <div className="w-52 border-r border-gray-300 p-3 flex-shrink-0 bg-gray-50 flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-600 mb-1">기사님 클릭</p>
                <div>
                  <label className="text-xs text-red-500 font-medium">* 기사 명</label>
                  <div className="mt-1 px-2 py-1.5 border border-blue-300 rounded bg-blue-50 text-xs font-bold text-gray-800 min-h-[28px]">
                    {selectedDriver?.name ?? ""}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">휴 대 폰</label>
                  <div className="mt-1 px-2 py-1.5 border border-blue-300 rounded bg-blue-50 text-xs min-h-[28px]">
                    {selectedDriver?.mobile ?? ""}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">비고금액</label>
                  <div className="mt-1 px-2 py-1.5 border border-blue-300 rounded bg-blue-50 text-xs min-h-[28px]">
                    {selectedDriver
                      ? driverDailyRides(selectedDriver.name).reduce((s, r) => s + r.total, 0).toLocaleString()
                      : ""}
                  </div>
                </div>
                <div className="text-xs text-gray-400 border-t border-gray-300 pt-2 space-y-1">
                  <p>비고금액에는 운행요금을 기본으로 합니다.</p>
                  <p>운행요금은 도착처리에 따라 합산됩니다.</p>
                </div>
                {selectedDriver && (
                  <label className="flex items-start gap-1.5 text-xs text-gray-600 mt-1">
                    <input type="checkbox" className="mt-0.5 accent-blue-600" defaultChecked />
                    기사명을 클릭하지 않아도 기사명이 나타나게 합니다.
                  </label>
                )}
              </div>

              {/* 중앙: 기사 목록 */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300">
                <div className="p-3 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs text-gray-500">찾을자료</label>
                    <input
                      ref={driverSearchRef}
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      placeholder="성명 또는 휴대폰 검색"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">기사님의 관리번호나 성명 중 한가지로 검색할 수 있습니다.</p>
                  <p className="text-xs text-gray-600 mt-1 font-medium">성명순으로 정렬  {filteredDrivers.length} / {drivers.length}</p>
                </div>

                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {["관리번호","성명","휴대폰","출발일자","출발","도착","상태","횟수","금일운임"].map((h) => (
                          <th key={h} className="border border-gray-300 px-2 py-1.5 text-left text-gray-600 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.length === 0 ? (
                        <tr><td colSpan={9} className="px-3 py-4 text-center text-gray-300">기사 없음</td></tr>
                      ) : filteredDrivers.sort((a, b) => a.name.localeCompare(b.name)).map((d, i) => {
                        const dailyRides = driverDailyRides(d.name);
                        const dailyTotal = dailyRides.reduce((s, r) => s + r.total, 0);
                        const isChosen = selectedDriver?.id === d.id;
                        return (
                          <tr key={d.id} onClick={() => setSelectedDriver(d)}
                            className={`cursor-pointer border-b border-gray-100 transition
                              ${isChosen ? "bg-blue-800 text-white" : i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}`}>
                            <td className="border-r border-gray-200 px-2 py-1.5">{d.no}</td>
                            <td className={`border-r border-gray-200 px-2 py-1.5 font-bold ${isChosen ? "" : "text-blue-700"}`}>{d.name}</td>
                            <td className="border-r border-gray-200 px-2 py-1.5">{d.mobile || d.phone}</td>
                            <td className="border-r border-gray-200 px-2 py-1.5">{dailyRides.at(-1)?.date ?? ""}</td>
                            <td className="border-r border-gray-200 px-2 py-1.5">{dailyRides.at(-1)?.pickup ?? ""}</td>
                            <td className="border-r border-gray-200 px-2 py-1.5">{dailyRides.at(-1)?.dropoff ?? ""}</td>
                            <td className="border-r border-gray-200 px-2 py-1.5">
                              <span className={`px-1 rounded ${dailyRides.length > 0 ? (isChosen ? "bg-green-600" : "bg-green-100 text-green-700") : ""}`}>
                                {dailyRides.length > 0 ? "운행중" : "대기"}
                              </span>
                            </td>
                            <td className="border-r border-gray-200 px-2 py-1.5 text-center">{dailyRides.length}</td>
                            <td className={`px-2 py-1.5 text-right font-semibold ${isChosen ? "" : "text-blue-600"}`}>
                              {dailyTotal > 0 ? dailyTotal.toLocaleString() : "0"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 우측: 선택 기사의 오늘 운행 목록 */}
              <div className="w-72 flex-shrink-0 flex flex-col">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex-shrink-0">
                  <p className="text-xs font-bold text-gray-600">
                    운행범위: {date} 전체
                  </p>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {["고객성명","출발","출발지","도착지"].map((h) => (
                          <th key={h} className="border border-gray-300 px-2 py-1.5 text-left text-gray-600 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDriver ? (
                        driverDailyRides(selectedDriver.name).length === 0 ? (
                          <tr><td colSpan={4} className="px-2 py-3 text-center text-gray-300 text-xs">오늘 운행 없음</td></tr>
                        ) : driverDailyRides(selectedDriver.name).map((r) => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-blue-50">
                            <td className="px-2 py-1.5 font-medium">{r.customerName}</td>
                            <td className="px-2 py-1.5 text-gray-500">{r.time}</td>
                            <td className="px-2 py-1.5 text-blue-600">{r.pickup}</td>
                            <td className="px-2 py-1.5 text-red-600">{r.dropoff}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-2 py-3 text-center text-gray-300 text-xs">기사를 선택하세요</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex gap-2 px-4 py-2.5 border-t border-gray-300 bg-gray-50 rounded-b-xl flex-shrink-0">
              <button className="px-4 py-1.5 bg-gray-500 text-white text-xs font-semibold rounded hover:bg-gray-600">다시계산 [F5]</button>
              <button className="px-4 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600"
                onClick={() => selectedDriver && alert(`${selectedDriver.name} (${selectedDriver.mobile || selectedDriver.phone})에게 SMS 발송`)}>
                SMS [F7]
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
                className="px-6 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed ml-auto">
                자료선택 [F12]
              </button>
              <button onClick={() => { setShowDriverModal(false); setSelectedDriver(null); }}
                className="px-4 py-1.5 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600">
                작업완료 [Esc]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 하단 버튼 ────────────────────────────────────────────────────
function DailyBtn({ icon, label, shortcut, color, onClick }: {
  icon: string; label: string; shortcut: string; color: string; onClick: () => void;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    teal: "bg-teal-600 hover:bg-teal-700 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
  };
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold shadow-sm transition ${colors[color]}`}>
      <span>{icon}</span>
      <span>{label}</span>
      <span className="opacity-60 text-[10px]">[{shortcut}]</span>
    </button>
  );
}

// ─── 폼 필드 ────────────────────────────────────────────────────
function FormField({ label, name, value, onChange, type = "text", placeholder = "" }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );
}
