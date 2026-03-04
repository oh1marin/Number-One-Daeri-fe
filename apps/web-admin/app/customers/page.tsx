"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCustomers, saveCustomer, updateCustomer, deleteCustomer, getRecords,
} from "@/lib/store";
import { Customer, CUSTOMER_CATEGORIES } from "@/lib/types";
import { RideRecord } from "@/lib/types";

// ─── 빈 폼 ────────────────────────────────────────────────────────
const BLANK: Omit<Customer, "id" | "no"> = {
  registeredAt: new Date().toISOString().slice(0, 10),
  dmSend: false, smsSend: false,
  category: "", name: "", info: "", memberNo: "",
  address: "", addressDetail: "",
  phone: "", mobile: "", otherPhone: "", notes: "",
  referrerId: "",
};

type Mode = "new" | "edit" | "view";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [form, setForm] = useState<Omit<Customer, "id" | "no">>(BLANK);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [mode, setMode] = useState<Mode>("new");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"name" | "phone" | "mobile" | "category">("name");
  const [showCatModal, setShowCatModal] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [lastNo, setLastNo] = useState(0);

  const load = useCallback(() => {
    const cs = getCustomers();
    setCustomers(cs);
    setLastNo(cs.reduce((m, c) => Math.max(m, c.no), 0));
    setRides(getRecords());
  }, []);

  useEffect(() => { load(); }, [load]);

  // 고객 선택 → view 모드
  const selectCustomer = (c: Customer) => {
    setSelected(c);
    setForm({
      registeredAt: c.registeredAt, dmSend: c.dmSend, smsSend: c.smsSend,
      category: c.category, name: c.name, info: c.info, memberNo: c.memberNo,
      address: c.address, addressDetail: c.addressDetail,
      phone: c.phone, mobile: c.mobile, otherPhone: c.otherPhone,
      notes: c.notes, referrerId: c.referrerId,
    });
    setMode("view");
  };

  const handleNew = () => {
    setSelected(null);
    setForm(BLANK);
    setMode("new");
  };

  const handleEdit = () => { if (selected) setMode("edit"); };

  const handleSave = () => {
    if (!form.name.trim()) { alert("고객성명을 입력하세요."); return; }
    if (!form.category) { alert("고객분류를 선택하세요."); return; }
    if (mode === "new") {
      const created = saveCustomer(form);
      load();
      setSelected(created);
      setMode("view");
    } else if (mode === "edit" && selected) {
      updateCustomer(selected.id, form);
      load();
      setMode("view");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`"${selected.name}" 고객을 삭제할까요?`)) return;
    deleteCustomer(selected.id);
    load();
    handleNew();
  };

  const handleCancel = () => {
    if (selected) {
      selectCustomer(selected);
      setMode("view");
    } else {
      setForm(BLANK);
      setMode("new");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  // 검색 필터
  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    return String(c[searchField]).toLowerCase().includes(search.toLowerCase());
  });

  // 선택 고객의 운행 이력
  const customerRides = rides.filter((r) => (r as any).customerId === selected?.id);

  // 마일리지 계산
  const totalFare = customerRides.reduce((s, r) => s + r.total, 0);
  const referrals = selected ? customers.filter((c) => c.referrerId === selected.id) : [];
  const referrer = selected?.referrerId ? customers.find((c) => c.id === selected?.referrerId) : null;

  const FIELD = "w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400";
  const RO = "bg-gray-50 " + FIELD;
  const isRO = mode === "view";

  const catFiltered = CUSTOMER_CATEGORIES.filter((c) =>
    !catSearch || c.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="p-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">고객자료관리</h1>
          <p className="text-xs text-gray-500">
            {customers.length}/{customers.length} &nbsp;·&nbsp; LastNo {lastNo} &nbsp;·&nbsp; 고객번호 {selected ? String(selected.no).padStart(4, "0") : "—"}
          </p>
        </div>
        <div className="flex gap-1.5 text-xs">
          {["메모장", "그림참조", "과거내역", "문자메세지"].map((b) => (
            <button key={b} className="px-2.5 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600">{b}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {/* ─── LEFT: 입력 폼 ─── */}
        <div className="w-[420px] flex-shrink-0">
          <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-2.5">
            <div className="text-xs font-semibold text-gray-500 bg-gray-50 -mx-4 -mt-4 px-4 py-2 rounded-t-lg border-b border-gray-200 mb-3">
              입력
              <label className="ml-4 inline-flex items-center gap-1">
                <input type="checkbox" name="dmSend" checked={form.dmSend} onChange={handleChange} disabled={isRO} className="accent-blue-600" />
                D.M 발송
              </label>
              <label className="ml-3 inline-flex items-center gap-1">
                <input type="checkbox" name="smsSend" checked={form.smsSend} onChange={handleChange} disabled={isRO} className="accent-blue-600" />
                문자발송
              </label>
            </div>

            {/* 등록일자 + 고객분류 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-red-500 font-medium mb-1">* 등록일자</label>
                <input type="date" name="registeredAt" value={form.registeredAt} onChange={handleChange}
                  disabled={isRO} className={isRO ? RO : FIELD} />
              </div>
              <div>
                <label className="block text-xs text-red-500 font-medium mb-1">* 고객분류</label>
                <div className="relative">
                  <input
                    name="category" value={form.category}
                    onChange={handleChange}
                    readOnly={isRO}
                    placeholder="클릭하여 선택"
                    className={(isRO ? RO : FIELD) + " pr-8 cursor-pointer"}
                    onClick={() => !isRO && setShowCatModal(true)}
                  />
                  {!isRO && (
                    <button onClick={() => setShowCatModal(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">▼</button>
                  )}
                </div>
              </div>
            </div>

            {/* 고객성명 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">고객성명</label>
              <input name="name" value={form.name} onChange={handleChange} disabled={isRO} placeholder="성명 입력" className={isRO ? RO : FIELD} />
            </div>

            {/* 고객정보 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">고객정보</label>
              <input name="info" value={form.info} onChange={handleChange} disabled={isRO} placeholder="직위, 특이사항 등" className={isRO ? RO : FIELD} />
            </div>

            {/* 회원번호 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">회원번호</label>
              <input name="memberNo" value={form.memberNo} onChange={handleChange} disabled={isRO} className={isRO ? RO : FIELD} />
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">주소</label>
              <div className="flex gap-1">
                <input name="address" value={form.address} onChange={handleChange} disabled={isRO} placeholder="시/도 구/군" className={(isRO ? RO : FIELD) + " flex-1"} />
                <input name="addressDetail" value={form.addressDetail} onChange={handleChange} disabled={isRO} placeholder="상세주소" className={(isRO ? RO : FIELD) + " w-32"} />
              </div>
            </div>

            {/* 전화번호 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">전화번호</label>
                <input name="phone" value={form.phone} onChange={handleChange} disabled={isRO} placeholder="02-0000-0000" className={isRO ? RO : FIELD} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">휴대폰</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} disabled={isRO} placeholder="010-0000-0000" className={isRO ? RO : FIELD} />
              </div>
            </div>

            {/* 기타전화 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">기타전화</label>
              <input name="otherPhone" value={form.otherPhone} onChange={handleChange} disabled={isRO} className={isRO ? RO : FIELD} />
            </div>

            {/* 기타사항 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">기타사항</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} disabled={isRO}
                rows={2} className={(isRO ? RO : FIELD) + " resize-none"} />
            </div>

            {/* ─ 추천인 정보 ─ */}
            <div className="border-t border-gray-200 pt-3 mt-1">
              <p className="text-xs font-semibold text-gray-500 mb-2">당신을 추천한 고객정보</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-red-500 mb-1">* 고객성명</label>
                  <input
                    value={referrer?.name ?? ""}
                    readOnly
                    placeholder="추천인 없음"
                    className={RO}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">고객번호</label>
                  <input value={referrer ? String(referrer.no).padStart(4, "0") : ""} readOnly className={RO} />
                </div>
              </div>
              {!isRO && (
                <div className="mt-1.5">
                  <label className="block text-xs text-gray-500 mb-1">추천인 ID (직접 입력)</label>
                  <input name="referrerId" value={form.referrerId} onChange={handleChange}
                    placeholder="추천인 고객 ID" className={FIELD} />
                </div>
              )}

              {/* 마일리지 */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                {[
                  ["이용실적", totalFare.toLocaleString()],
                  ["추천실적", referrals.length + "건"],
                  ["전체실적", (totalFare + referrals.length * 1000).toLocaleString()],
                  ["최근거래", customerRides.at(-1)?.date ?? "—"],
                  ["누적금액", totalFare.toLocaleString() + "원"],
                  ["거래횟수", customerRides.length + "회"],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded p-1.5 border border-gray-200">
                    <p className="text-gray-500">{label}</p>
                    <p className="font-bold text-blue-700">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─ 하단 버튼 ─ */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <BtnAction label="신규" shortcut="F2" color="blue" onClick={handleNew} />
            <BtnAction label="수정" shortcut="F3" color="gray" onClick={handleEdit} disabled={!selected} />
            <BtnAction label="삭제" shortcut="F4" color="red" onClick={handleDelete} disabled={!selected} />
            <BtnAction label="검색" shortcut="F5" color="gray" onClick={() => {}} />
            <BtnAction label="전체" shortcut="F7" color="gray" onClick={() => { setSearch(""); }} />
            <BtnAction label="저장" shortcut="F12" color="green" onClick={handleSave} disabled={isRO} />
            <BtnAction label="취소" shortcut="Esc" color="orange" onClick={handleCancel} />
            {saved && <span className="text-green-600 text-xs font-medium self-center ml-1">✓ 저장됨</span>}
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* 검색 */}
          <div className="bg-white border border-gray-300 rounded-lg p-3">
            <div className="flex gap-2">
              <select value={searchField} onChange={(e) => setSearchField(e.target.value as any)}
                className="px-2 py-1.5 border border-gray-300 rounded text-xs">
                <option value="name">고객성명</option>
                <option value="phone">전화번호</option>
                <option value="mobile">휴대폰</option>
                <option value="category">고객분류</option>
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="검색어 입력" className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <button onClick={() => setSearch("")}
                className="px-3 py-1.5 bg-gray-100 text-xs rounded border border-gray-300 hover:bg-gray-200">전체</button>
            </div>
          </div>

          {/* 당신이 추천한 고객명단 */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-600">
              당신이 추천한 고객명단 ({referrals.length}명)
            </div>
            <div className="overflow-x-auto max-h-36">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["고객번호","고객성명","고객정보","이용실적","최근거래일"].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left border-b border-gray-200 text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {referrals.length === 0 ? (
                    <tr><td colSpan={5} className="px-2 py-3 text-gray-300 text-center">없음</td></tr>
                  ) : referrals.map((r) => {
                    const rRides = rides.filter((rd) => (rd as any).customerId === r.id);
                    return (
                      <tr key={r.id} onClick={() => selectCustomer(r)} className="hover:bg-blue-50 cursor-pointer">
                        <td className="px-2 py-1.5 text-gray-500">{String(r.no).padStart(4,"0")}</td>
                        <td className="px-2 py-1.5 font-medium">{r.name}</td>
                        <td className="px-2 py-1.5 text-gray-500">{r.info}</td>
                        <td className="px-2 py-1.5 text-right">{rRides.reduce((s,rd)=>s+rd.total,0).toLocaleString()}</td>
                        <td className="px-2 py-1.5 text-gray-500">{rRides.at(-1)?.date ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 운행 이력 */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-600">
              운행 이력 ({customerRides.length}건)
            </div>
            <div className="overflow-x-auto max-h-40">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["출발일자","접수시간","기사","운행요금","출발지","도착지","비고"].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left border-b border-gray-200 text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customerRides.length === 0 ? (
                    <tr><td colSpan={7} className="px-2 py-3 text-gray-300 text-center">없음</td></tr>
                  ) : customerRides.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50">
                      <td className="px-2 py-1.5 text-gray-500">{r.date}</td>
                      <td className="px-2 py-1.5 text-gray-500">{r.time}</td>
                      <td className="px-2 py-1.5">{r.driverName}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-blue-600">{r.total.toLocaleString()}</td>
                      <td className="px-2 py-1.5">{r.pickup}</td>
                      <td className="px-2 py-1.5">{r.dropoff}</td>
                      <td className="px-2 py-1.5 text-gray-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 고객 목록 */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-600">
              고객 목록 ({filtered.length}명)
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["번호","분류","성명","연락처","주소","등록일"].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left border-b border-gray-200 text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-2 py-4 text-center text-gray-300">고객 없음</td></tr>
                  ) : filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className={`cursor-pointer hover:bg-blue-50 transition ${selected?.id === c.id ? "bg-blue-100" : ""}`}
                    >
                      <td className="px-2 py-1.5 text-gray-500">{String(c.no).padStart(4,"0")}</td>
                      <td className="px-2 py-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{c.category}</span>
                      </td>
                      <td className="px-2 py-1.5 font-medium">{c.name}</td>
                      <td className="px-2 py-1.5 text-gray-500">{c.mobile || c.phone}</td>
                      <td className="px-2 py-1.5 text-gray-500 truncate max-w-28">{c.address}</td>
                      <td className="px-2 py-1.5 text-gray-400">{c.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 고객분류 선택 모달 ─── */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-gray-400 rounded-lg w-72 shadow-2xl">
            <div className="bg-gray-200 px-4 py-2.5 flex items-center justify-between rounded-t-lg">
              <span className="font-bold text-sm">분류</span>
              <button onClick={() => setShowCatModal(false)} className="text-gray-500 hover:text-red-500 font-bold">✕</button>
            </div>
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">자료찾기</label>
                <input
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  autoFocus
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">단어를 입력하거나 번호를 치면 해당 자료로 이동합니다.</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {catFiltered.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => { setForm((p) => ({ ...p, category: cat })); setShowCatModal(false); setCatSearch(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-600 hover:text-white transition text-left"
                >
                  <span className="text-gray-400 w-5 text-xs">{i + 1}</span>
                  <span className="bg-blue-500 text-white px-1 w-5 text-center text-xs rounded">{i + 1}</span>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2 p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">자료관리</button>
              <button className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700" onClick={() => { setShowCatModal(false); setCatSearch(""); }}>자료선택</button>
              <button className="flex-1 py-1.5 text-xs bg-gray-400 text-white rounded hover:bg-gray-500" onClick={() => { setShowCatModal(false); setCatSearch(""); setForm((p) => ({...p, category:""})); }}>선택취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 하단 버튼 컴포넌트 ────────────────────────────────────────────
function BtnAction({ label, shortcut, color, onClick, disabled = false }: {
  label: string; shortcut: string; color: string; onClick: () => void; disabled?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${colors[color]} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {label}<span className="ml-1 opacity-70 text-[10px]">[{shortcut}]</span>
    </button>
  );
}
