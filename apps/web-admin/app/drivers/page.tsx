"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDrivers, saveDriver, updateDriver, deleteDriver, getDriverRides,
} from "@/lib/store";
import { Driver, TIME_SLOTS } from "@/lib/types";
import { RideRecord } from "@/lib/types";

const BLANK: Omit<Driver, "id" | "no"> = {
  registeredAt: new Date().toISOString().slice(0, 10),
  name: "", region: "", timeSlot: "아무때나",
  address: "", addressZip: "", addressDetail: "",
  phone: "", mobile: "", licenseNo: "", residentNo: "",
  aptitudeTest: "", notes: "",
};

type Mode = "new" | "edit" | "view";
type SortKey = "no" | "name" | "region" | "registeredAt";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState<Omit<Driver, "id" | "no">>(BLANK);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [mode, setMode] = useState<Mode>("new");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"name" | "region" | "phone" | "mobile" | "licenseNo">("name");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cursor, setCursor] = useState(0); // 현재 레코드 인덱스

  const load = useCallback(() => {
    setDrivers(getDrivers());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = drivers
    .filter((d) => !search.trim() || String(d[searchField]).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === "no") return a.no - b.no;
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });

  const selectDriver = (d: Driver, idx?: number) => {
    setSelected(d);
    setForm({
      registeredAt: d.registeredAt, name: d.name, region: d.region,
      timeSlot: d.timeSlot, address: d.address, addressZip: d.addressZip,
      addressDetail: d.addressDetail, phone: d.phone, mobile: d.mobile,
      licenseNo: d.licenseNo, residentNo: d.residentNo,
      aptitudeTest: d.aptitudeTest, notes: d.notes,
    });
    setMode("view");
    setRides(getDriverRides(d.name));
    if (idx !== undefined) setCursor(idx);
  };

  const navigate = (dir: "first" | "prev" | "next" | "last") => {
    if (filtered.length === 0) return;
    let idx = cursor;
    if (dir === "first") idx = 0;
    else if (dir === "prev") idx = Math.max(0, cursor - 1);
    else if (dir === "next") idx = Math.min(filtered.length - 1, cursor + 1);
    else if (dir === "last") idx = filtered.length - 1;
    setCursor(idx);
    selectDriver(filtered[idx], idx);
  };

  const handleNew = () => {
    setSelected(null);
    setForm(BLANK);
    setMode("new");
    setRides([]);
  };

  const handleSave = () => {
    if (!form.name.trim()) { alert("성명을 입력하세요."); return; }
    if (mode === "new") {
      const created = saveDriver(form);
      load();
      const newList = getDrivers();
      const idx = newList.findIndex((d) => d.id === created.id);
      setSelected(created);
      setCursor(idx >= 0 ? idx : 0);
      setMode("view");
    } else if (mode === "edit" && selected) {
      updateDriver(selected.id, form);
      load();
      setSelected({ ...selected, ...form });
      setMode("view");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`"${selected.name}" 기사를 삭제할까요?`)) return;
    deleteDriver(selected.id);
    load();
    handleNew();
  };

  const handleCancel = () => {
    if (selected) { selectDriver(selected); setMode("view"); }
    else { setForm(BLANK); setMode("new"); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const FIELD = "px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white";
  const RO = "px-2 py-1.5 border border-gray-200 rounded text-xs bg-blue-50 text-gray-700";
  const isRO = mode === "view";

  const totalFare = rides.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Title */}
      <div className="mb-3">
        <h1 className="text-xl font-bold">기사님 자료관리</h1>
      </div>

      {/* ─── 상단 목록 ─── */}
      <div className="bg-white border border-gray-400 rounded-lg overflow-hidden mb-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                {[
                  ["no","관리번호"], ["registeredAt","등록일자"], ["name","성명"],
                  ["region","담당지역"], ["timeSlot","시간대"], ["phone","전화번호"],
                  ["mobile","휴대폰"], ["licenseNo","면허번호"], ["aptitudeTest","적성검사"], ["residentNo","주민등록번호"],
                ].map(([key, label]) => (
                  <th key={key}
                    onClick={() => setSortKey(key as SortKey)}
                    className={`px-2 py-2 text-left border border-gray-300 cursor-pointer hover:bg-gray-300 whitespace-nowrap select-none ${sortKey === key ? "bg-amber-100" : ""}`}>
                    {label}{sortKey === key ? " ▲" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-4 text-center text-gray-300">기사 데이터가 없습니다</td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.id}
                  onClick={() => selectDriver(d, i)}
                  className={`cursor-pointer border-b border-gray-100 transition
                    ${selected?.id === d.id ? "bg-blue-900 text-white" : i % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-yellow-50 hover:bg-blue-50"}`}>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.no}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.registeredAt}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100 font-medium">{d.name}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.region}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.timeSlot}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.phone}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.mobile}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.licenseNo}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100">{d.aptitudeTest}</td>
                  <td className="px-2 py-1.5">{d.residentNo ? d.residentNo.slice(0, 6) + "-" + d.residentNo.slice(6, 7) + "XXXXXX" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 하단 폼 ─── */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* 자료조회 폼 */}
        <div className="bg-white border border-gray-400 rounded-lg p-4 flex-1 min-w-0">
          {/* 폼 헤더 */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-600">자료조회</span>
            {/* 레코드 네비게이션 */}
            <div className="flex items-center gap-1">
              {[
                ["◄◄", "first"], ["◄", "prev"], ["►", "next"], ["►►", "last"]
              ].map(([label, dir]) => (
                <button key={dir} onClick={() => navigate(dir as any)}
                  className="px-1.5 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100 font-mono">
                  {label}
                </button>
              ))}
              <button onClick={load} className="px-1.5 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">↺</button>
              <span className="ml-2 text-xs text-gray-500">
                {selected ? `${cursor + 1}/${filtered.length}` : `0/${filtered.length}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
            {/* 관리번호 + 등록일자 */}
            <div className="flex items-center gap-2">
              <label className="w-16 flex-shrink-0 text-gray-600">관리번호</label>
              <div className={RO + " w-20"}>{selected?.no ?? ""}</div>
              <span className="text-gray-400">(생략가능)</span>
              <label className="ml-2 text-gray-600">등록일자</label>
              {isRO
                ? <div className={RO + " w-28"}>{form.registeredAt}</div>
                : <input type="date" name="registeredAt" value={form.registeredAt} onChange={handleChange} className={FIELD + " w-32"} />
              }
            </div>

            {/* 성명 + 담당지역 */}
            <div className="flex items-center gap-2">
              <label className="w-10 flex-shrink-0 text-gray-600">성 명</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.name}</div>
                : <input name="name" value={form.name} onChange={handleChange} placeholder="성명" className={FIELD + " flex-1"} />
              }
              <label className="ml-2 text-gray-600 flex-shrink-0">담당지역</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.region}</div>
                : <input name="region" value={form.region} onChange={handleChange} placeholder="강남지역" className={FIELD + " flex-1"} />
              }
              <label className="ml-2 text-gray-600 flex-shrink-0">시간대</label>
              {isRO
                ? <div className={RO + " w-24"}>{form.timeSlot}</div>
                : <select name="timeSlot" value={form.timeSlot} onChange={handleChange} className={FIELD + " w-28"}>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    <option value="">직접입력</option>
                  </select>
              }
            </div>

            {/* 주소 */}
            <div className="col-span-2 flex items-start gap-2">
              <label className="w-16 flex-shrink-0 text-gray-600 mt-1.5">주 소</label>
              <div className="flex-1 space-y-1">
                <div className="flex gap-2">
                  {isRO
                    ? <div className={RO + " flex-1"}>{form.address}</div>
                    : <input name="address" value={form.address} onChange={handleChange} placeholder="시/도 구/군 동" className={FIELD + " flex-1"} />
                  }
                  {isRO
                    ? <div className={RO + " w-20"}>{form.addressZip}</div>
                    : <input name="addressZip" value={form.addressZip} onChange={handleChange} placeholder="우편번호" className={FIELD + " w-24"} />
                  }
                </div>
                {isRO
                  ? <div className={RO + " w-full"}>{form.addressDetail}</div>
                  : <input name="addressDetail" value={form.addressDetail} onChange={handleChange} placeholder="상세주소 (동/호수)" className={FIELD + " w-full"} />
                }
              </div>
            </div>

            {/* 전화번호 + 휴대폰 */}
            <div className="flex items-center gap-2">
              <label className="w-16 flex-shrink-0 text-gray-600">전화번호</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.phone}</div>
                : <input name="phone" value={form.phone} onChange={handleChange} placeholder="02-0000-0000" className={FIELD + " flex-1"} />
              }
            </div>
            <div className="flex items-center gap-2">
              <label className="w-14 flex-shrink-0 text-gray-600">휴 대 폰</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.mobile}</div>
                : <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="010-0000-0000" className={FIELD + " flex-1"} />
              }
            </div>

            {/* 면허번호 + 주민번호 */}
            <div className="flex items-center gap-2">
              <label className="w-16 flex-shrink-0 text-gray-600">면허번호</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.licenseNo}</div>
                : <input name="licenseNo" value={form.licenseNo} onChange={handleChange} placeholder="서울 92-932690-20" className={FIELD + " flex-1"} />
              }
            </div>
            <div className="flex items-center gap-2">
              <label className="w-14 flex-shrink-0 text-gray-600">주민번호</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.residentNo ? form.residentNo.slice(0,6) + "-" + form.residentNo.slice(6,7) + "XXXXXX" : ""}</div>
                : <input name="residentNo" value={form.residentNo} onChange={handleChange} placeholder="650420-1030001" className={FIELD + " flex-1"} />
              }
            </div>

            {/* 적성검사 */}
            <div className="flex items-center gap-2">
              <label className="w-16 flex-shrink-0 text-gray-600">적성검사</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.aptitudeTest}</div>
                : <input name="aptitudeTest" value={form.aptitudeTest} onChange={handleChange} placeholder="2005.04.20~" className={FIELD + " flex-1"} />
              }
            </div>
            <div className="flex items-center gap-2">
              <label className="w-14 flex-shrink-0 text-gray-600">비고</label>
              {isRO
                ? <div className={RO + " flex-1"}>{form.notes}</div>
                : <input name="notes" value={form.notes} onChange={handleChange} className={FIELD + " flex-1"} />
              }
            </div>
          </div>

          {/* 저장/취소 (편집 모드) */}
          {!isRO && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
              <button onClick={handleSave} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700">저장 [F12]</button>
              <button onClick={handleCancel} className="px-4 py-1.5 bg-gray-400 text-white text-xs font-semibold rounded hover:bg-gray-500">취소 [Esc]</button>
              {saved && <span className="text-green-600 text-xs self-center">✓ 저장됐습니다</span>}
            </div>
          )}
        </div>

        {/* 우측: 사진 영역 */}
        <div className="w-48 flex-shrink-0 space-y-2">
          <div className="bg-blue-900 rounded-lg h-36 flex items-center justify-center text-white text-xs text-center p-2">
            {selected ? (
              <div>
                <div className="text-3xl mb-1">👤</div>
                <div className="font-bold">{selected.name}</div>
                <div className="text-blue-300 text-[10px] mt-0.5">{selected.region}</div>
              </div>
            ) : (
              <span className="text-blue-400">사진 영역</span>
            )}
          </div>

          {/* 미니 스탯 */}
          {selected && (
            <div className="bg-white border border-gray-300 rounded-lg p-3 space-y-1.5 text-xs">
              <p className="font-bold text-gray-600 border-b border-gray-100 pb-1">운행 현황</p>
              <div className="flex justify-between">
                <span className="text-gray-500">총 건수</span>
                <span className="font-bold">{rides.length}건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">총 매출</span>
                <span className="font-bold text-blue-600">{totalFare.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">최근 운행</span>
                <span className="font-medium">{rides.at(-1)?.date ?? "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 검색 바 ─── */}
      <div className="mt-2 flex items-center gap-2">
        <select value={searchField} onChange={(e) => setSearchField(e.target.value as any)}
          className="px-2 py-1.5 border border-gray-300 rounded text-xs">
          <option value="name">성명</option>
          <option value="region">담당지역</option>
          <option value="phone">전화번호</option>
          <option value="mobile">휴대폰</option>
          <option value="licenseNo">면허번호</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setSearch("")}
          placeholder="검색어 입력 후 Enter"
          className="px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 w-48" />
        <button onClick={() => setSearch("")} className="px-2 py-1.5 bg-gray-100 text-xs rounded border border-gray-300 hover:bg-gray-200">전체</button>
      </div>

      {/* ─── 하단 액션 버튼 ─── */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <BtnAction label="신규입력" shortcut="F2" color="blue" onClick={handleNew} />
        <BtnAction label="수정" shortcut="F3" color="gray" onClick={() => selected && setMode("edit")} disabled={!selected} />
        <BtnAction label="삭제" shortcut="F4" color="red" onClick={handleDelete} disabled={!selected} />
        <BtnAction label="검색" shortcut="F5" color="gray" onClick={() => {}} />
        <BtnAction label="정렬" shortcut="F6" color="gray" onClick={() => setSortKey("name")} />
        <BtnAction label="문자메세지" shortcut="F7" color="gray" onClick={() => selected && alert(`${selected.name} (${selected.mobile || selected.phone})에게 문자 발송`)} disabled={!selected} />
        <BtnAction label="자료출력" shortcut="F9" color="teal" onClick={() => window.print()} disabled={!selected} />
        <BtnAction label="운행이력" shortcut="F11" color="green" onClick={() => setShowHistory(true)} disabled={!selected} />
        <BtnAction label="작업완료" shortcut="Esc" color="orange" onClick={handleNew} />
      </div>

      {/* ─── 운행이력 모달 ─── */}
      {showHistory && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold">운행이력 — {selected.name} 기사</h3>
                <p className="text-xs text-gray-400 mt-0.5">총 {rides.length}건 · 합계 {totalFare.toLocaleString()}원</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["날짜","시간","고객명","출발지","도착지","요금","할인","추가","합계","비고"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left border-b border-gray-200 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rides.length === 0 ? (
                    <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-300">운행 이력 없음</td></tr>
                  ) : rides.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{r.date}</td>
                      <td className="px-3 py-2 text-gray-500">{r.time}</td>
                      <td className="px-3 py-2 font-medium">{r.customerName}</td>
                      <td className="px-3 py-2">{r.pickup}</td>
                      <td className="px-3 py-2">{r.dropoff}</td>
                      <td className="px-3 py-2 text-right">{r.fare.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-red-500">{r.discount ? `-${r.discount.toLocaleString()}` : ""}</td>
                      <td className="px-3 py-2 text-right text-green-600">{r.extra ? `+${r.extra.toLocaleString()}` : ""}</td>
                      <td className="px-3 py-2 text-right font-bold text-blue-600">{r.total.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
                {rides.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-gray-600">합계</td>
                      <td className="px-3 py-2 text-right">{rides.reduce((s,r)=>s+r.fare,0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-red-500">-{rides.reduce((s,r)=>s+r.discount,0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-green-600">+{rides.reduce((s,r)=>s+r.extra,0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{totalFare.toLocaleString()}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BtnAction({ label, shortcut, color, onClick, disabled = false }: {
  label: string; shortcut: string; color: string; onClick: () => void; disabled?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    teal: "bg-teal-600 hover:bg-teal-700 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${colors[color]} disabled:opacity-40 disabled:cursor-not-allowed`}>
      {label} <span className="opacity-70">[{shortcut}]</span>
    </button>
  );
}
