"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCustomers } from "@/lib/store";
import { Customer } from "@/lib/types";
import Link from "next/link";

type SortKey = "no" | "registeredAt" | "name" | "category" | "phone" | "mobile" | "address";

function getPhone(c: Customer) {
  return c.mobile || c.phone || c.otherPhone || "";
}

function getAddress(c: Customer) {
  return [c.address, c.addressDetail].filter(Boolean).join(" ") || "";
}

export default function CustomersLedgerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SortKey>("name");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [multiSelect, setMultiSelect] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMode, setSmsMode] = useState<"individual" | "group">("individual");
  const [smsContent, setSmsContent] = useState("");
  const [smsSent, setSmsSent] = useState(false);

  const load = useCallback(() => setCustomers(getCustomers()), []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers
    .filter((c) => !search.trim() || String(c[searchField]).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === "no") return a.no - b.no;
      if (sortKey === "registeredAt") return a.registeredAt.localeCompare(b.registeredAt);
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });

  const selected = filtered[cursor] ?? null;

  const toggleCheck = (id: string) => {
    if (!multiSelect) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!multiSelect) return;
    setChecked(new Set(filtered.map((c) => c.id)));
  };

  const selectNone = () => setChecked(new Set());

  const navigate = (dir: "first" | "prev" | "next" | "last") => {
    if (filtered.length === 0) return;
    if (dir === "first") setCursor(0);
    else if (dir === "prev") setCursor(Math.max(0, cursor - 1));
    else if (dir === "next") setCursor(Math.min(filtered.length - 1, cursor + 1));
    else setCursor(filtered.length - 1);
  };

  const [recipientsForDisplay, setRecipientsForDisplay] = useState<Customer[]>([]);

  const openSmsModal = () => {
    if (smsMode === "individual" && !selected) {
      alert("개인발송: 행을 선택한 뒤 문자메시지를 클릭하세요.");
      return;
    }
    if (smsMode === "group" && checked.size === 0) {
      alert("단체발송: 다중선택 후 체크할 고객을 선택하고 문자메시지를 클릭하세요.");
      return;
    }
    const list = smsMode === "individual" && selected
      ? [selected]
      : filtered.filter((c) => checked.has(c.id));
    if (list.length === 0) {
      alert("발송할 수신자가 없습니다.");
      return;
    }
    setRecipientsForDisplay(list);
    setSmsContent("");
    setSmsSent(false);
    setShowSmsModal(true);
  };

  const handleSmsSend = () => {
    if (!smsContent.trim()) { alert("메시지 내용을 입력하세요."); return; }
    const phones = recipientsForDisplay.map((c) => getPhone(c)).filter(Boolean);
    const uniquePhones = [...new Set(phones)];
    if (uniquePhones.length === 0) { alert("수신자에게 연락처가 등록되어 있지 않습니다."); return; }
    // TODO: 실제 SMS API 연동
    console.log("SMS 발송 대상:", uniquePhones, "내용:", smsContent);
    setSmsSent(true);
    setTimeout(() => setShowSmsModal(false), 1500);
  };

  const charCount = smsContent.length;
  const smsCount = Math.ceil(charCount / 80) || 0;

  return (
    <div className="flex flex-col h-screen bg-gray-200 overflow-hidden text-xs">
      {/* ─── 헤더 ─── */}
      <div className="bg-gray-300 border-b border-gray-400 px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-sm">고객관리대장</h1>
          <span className="text-gray-600">
            {filtered.length} / {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[["<<", "first"], ["<", "prev"], [">", "next"], [">>", "last"]].map(([label, dir]) => (
            <button key={dir} onClick={() => navigate(dir as any)}
              className="px-2 py-1 border border-gray-400 rounded bg-white hover:bg-gray-50 font-mono text-xs">
              {label}
            </button>
          ))}
          <button onClick={load} className="px-2 py-1 border border-gray-400 rounded bg-white hover:bg-gray-50" title="새로고침">↺</button>
          <div className="flex items-center gap-2 ml-2">
            <select value={searchField} onChange={(e) => setSearchField(e.target.value as SortKey)}
              className="px-2 py-1 border border-gray-400 rounded bg-white text-xs">
              <option value="name">고객성명</option>
              <option value="no">고객번호</option>
              <option value="phone">연락처</option>
              <option value="mobile">휴대폰</option>
              <option value="category">고객분류</option>
              <option value="address">주소</option>
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="검색어"
              className="w-32 px-2 py-1 border border-gray-400 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {/* ─── 메인 그리드 ─── */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-xs border-collapse min-w-max">
          <thead className="sticky top-0 bg-gray-200 z-10">
            <tr>
              <th className="border border-gray-400 px-1 py-1.5 w-8 text-center font-medium text-gray-700">선택</th>
              <th className="border border-gray-400 px-1 py-1.5 w-6 text-center font-medium text-gray-700">우편</th>
              <th className="border border-gray-400 px-1 py-1.5 w-6 text-center font-medium text-gray-700">문자</th>
              <th className="border border-gray-400 px-2 py-1.5 w-16 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-300"
                onClick={() => setSortKey("no")}>고객번호</th>
              <th className="border border-gray-400 px-2 py-1.5 w-20 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-300"
                onClick={() => setSortKey("registeredAt")}>등록일자</th>
              <th className="border border-gray-400 px-2 py-1.5 w-20 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-300"
                onClick={() => setSortKey("name")}>고객성명</th>
              <th className="border border-gray-400 px-2 py-1.5 w-20 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-300"
                onClick={() => setSortKey("category")}>고객정보</th>
              <th className="border border-gray-400 px-2 py-1.5 w-24 text-left font-medium text-gray-700">연락처#1</th>
              <th className="border border-gray-400 px-2 py-1.5 w-24 text-left font-medium text-gray-700">연락처#2</th>
              <th className="border border-gray-400 px-2 py-1.5 w-24 text-left font-medium text-gray-700">휴대폰번호</th>
              <th className="border border-gray-400 px-2 py-1.5 w-16 text-left font-medium text-gray-700">우편번호</th>
              <th className="border border-gray-400 px-2 py-1.5 min-w-32 text-left font-medium text-gray-700">주소(시,구,동)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-10 text-center text-gray-400">
                  고객 데이터가 없습니다. <Link href="/customers" className="text-blue-600 underline">고객자료관리</Link>에서 등록하세요.
                </td>
              </tr>
            ) : filtered.map((c, i) => {
              const isRowSelected = selected?.id === c.id;
              const isChecked = checked.has(c.id);
              return (
                <tr
                  key={c.id}
                  onClick={() => setCursor(i)}
                  className={`cursor-pointer border-b border-gray-100 transition
                    ${isRowSelected ? "bg-blue-900 text-white" : i % 2 === 0 ? "bg-yellow-50 hover:bg-yellow-100" : "bg-white hover:bg-gray-50"}`}
                >
                  <td className="border-r border-gray-200 px-1 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                    {multiSelect && (
                      <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(c.id)}
                        className="accent-blue-600 w-4 h-4 cursor-pointer" />
                    )}
                  </td>
                  <td className="border-r border-gray-200 px-1 py-1 text-center">{c.dmSend ? "✓" : ""}</td>
                  <td className="border-r border-gray-200 px-1 py-1 text-center">{c.smsSend ? "✓" : ""}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5 font-mono">{c.no}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{c.registeredAt}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5 font-medium">{c.name}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{c.info}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{c.phone}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{c.otherPhone}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{c.mobile}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{/* 우편번호 - Customer에 없음 */}</td>
                  <td className="border-r border-gray-200 px-2 py-1.5">{getAddress(c)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── 하단 버튼 ─── */}
      <div className="bg-gray-300 border-t border-gray-400 px-3 py-2 flex flex-wrap gap-1.5 flex-shrink-0">
        <LedgerBtn label="고객번호변경" shortcut="F2" onClick={() => {}} />
        <LedgerBtn label="자료검색" shortcut="F5" onClick={() => {}} />
        <LedgerBtn label="신상카드" shortcut="F8" onClick={() => selected && window.open(`/customers?focus=${selected.id}`, "_blank")} />
        <LedgerBtn
          label="다중선택"
          shortcut="F11"
          color={multiSelect ? "green" : "gray"}
          onClick={() => { setMultiSelect(!multiSelect); if (!multiSelect) selectNone(); }}
        />
        {multiSelect && (
          <>
            <LedgerBtn label="전체선택" onClick={selectAll} />
            <LedgerBtn label="선택해제" onClick={selectNone} />
          </>
        )}
        <LedgerBtn label="엑셀로 저장" onClick={() => alert("엑셀 export (백엔드 연동 필요)")} />
        <LedgerBtn label="고객번호자동" shortcut="F3" onClick={() => {}} />
        <LedgerBtn label="정렬순서" shortcut="F6" onClick={() => setSortKey("name")} />
        <LedgerBtn label="보고서" shortcut="F9" onClick={() => window.print()} />
        <LedgerBtn label="전체자료" shortcut="F12" onClick={() => setSearch("")} />
        <LedgerBtn label="엑셀붙여넣기" onClick={() => alert("엑셀 import (백엔드 연동 필요)")} />
        <LedgerBtn label="자료삭제" shortcut="F4" color="red" onClick={() => {}} />
        <LedgerBtn label="고객정보" shortcut="F7" onClick={() => selected && (window.location.href = `/customers`)} />
        <LedgerBtn label="우편라벨(D.M)인쇄" onClick={() => alert("우편 인쇄 (백엔드 연동 필요)")} />
        <LedgerBtn
          label="문자메시지(SMS)"
          color="blue"
          onClick={openSmsModal}
        />
        <LedgerBtn label="완료" shortcut="Esc" color="orange" onClick={() => router.push("/customers")} />
      </div>

      {/* ─── 문자메시지 모달 ─── */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-sm">문자메시지 (SMS)</h2>
              <button onClick={() => setShowSmsModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-lg">✕</button>
            </div>

            <div className="p-5 flex flex-1 gap-5 min-h-0">
              {/* 좌측: 발송 설정 */}
              <div className="w-64 flex-shrink-0 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">발송 유형</p>
                  <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input type="radio" name="smsMode" checked={smsMode === "individual"}
                      onChange={() => setSmsMode("individual")} className="accent-blue-600" />
                    <span className="text-sm">개인발송</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="smsMode" checked={smsMode === "group"}
                      onChange={() => setSmsMode("group")} className="accent-blue-600" />
                    <span className="text-sm">단체발송</span>
                  </label>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                  <p className="text-gray-500 mb-1">현재잔액</p>
                  <p className="text-red-600 font-bold">28,425원</p>
                  <p className="text-gray-400 mt-1">건당금액: 25원</p>
                  <p className="text-gray-400">가능건수: 1,137건</p>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-blue-600" />
                    메시지전송 성공 후 창 자동 닫기
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-blue-600" />
                    문자내용 유지
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-blue-600" />
                    단체발송 시 중복 전화번호 제외
                  </label>
                </div>
              </div>

              {/* 우측: 수신자 + 메시지 */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">받을 사람</span>
                  <span className="text-blue-600 font-bold">
                    {smsMode === "individual" ? "개인발송" : "단체발송"} ({recipientsForDisplay.length}명)
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-28 mb-4">
                  {recipientsForDisplay.length === 0 ? (
                    <p className="p-3 text-center text-gray-400 text-xs">수신자 없음</p>
                  ) : recipientsForDisplay.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0 text-xs">
                      <span className="text-gray-400 w-6">{i + 1})</span>
                      <span>{getPhone(c) || "연락처 없음"}</span>
                      <span className="text-gray-500">{c.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-h-0">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">메시지 내용</label>
                  <textarea value={smsContent} onChange={(e) => setSmsContent(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{charCount} / 80 · 약 {smsCount}건</p>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                  <input placeholder="보낼 사람 (발신번호)" className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs"
                    defaultValue="029985303" />
                  <button onClick={handleSmsSend} disabled={smsSent}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-green-600 disabled:cursor-not-allowed transition">
                    {smsSent ? "✓ 전송 완료" : "전송"}
                  </button>
                  <button onClick={() => setShowSmsModal(false)}
                    className="px-5 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500">
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LedgerBtn({
  label, shortcut, color = "gray", onClick,
}: { label: string; shortcut?: string; color?: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
  };
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition ${colors[color]}`}>
      {label}{shortcut && <span className="ml-1 opacity-70">[{shortcut}]</span>}
    </button>
  );
}
