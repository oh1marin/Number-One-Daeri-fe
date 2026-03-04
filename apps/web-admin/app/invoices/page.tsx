"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getInvoices, saveInvoice, updateInvoice, deleteInvoice,
  getInvoiceSettings, saveInvoiceSettings, generateId,
} from "@/lib/store";
import {
  Invoice, InvoiceItem, InvoiceSettings, DEFAULT_INVOICE_SETTINGS,
} from "@/lib/types";

// ─── 빈 품목 행 ────────────────────────────────────────────────────
const BLANK_ITEM = (): InvoiceItem => ({
  id: generateId(), name: "", spec: "", unitPrice: 0, quantity: 1,
  supplyAmt: 0, vatRate: 10, vatAmt: 0,
});

// ─── 빈 인보이스 ───────────────────────────────────────────────────
const BLANK_INV = (): Omit<Invoice, "id" | "docNo"> => ({
  tradeDate: new Date().toISOString().slice(0, 10),
  items: [BLANK_ITEM()],
  totalSupply: 0, totalVat: 0, totalAmt: 0,
  vatIncluded: false, memo: "", type: "tax",
});

type Mode = "new" | "edit" | "view";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<Omit<Invoice, "id" | "docNo">>(BLANK_INV());
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [mode, setMode] = useState<Mode>("new");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [printPreview, setPrintPreview] = useState(false);

  const load = useCallback(() => {
    setInvoices(getInvoices());
    setSettings(getInvoiceSettings());
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── 합계 자동 계산 ─────────────────────────────────────────────
  const recalcItems = (items: InvoiceItem[]): InvoiceItem[] =>
    items.map((item) => {
      const supply = item.vatIncluded
        ? Math.round(item.unitPrice * item.quantity / (1 + item.vatRate / 100))
        : item.unitPrice * item.quantity;
      const supplyAmt = item.unitPrice && item.quantity ? supply : item.supplyAmt;
      const vatAmt = Math.round(supplyAmt * item.vatRate / 100);
      return { ...item, supplyAmt, vatAmt };
    });

  const calcTotals = (items: InvoiceItem[]) => ({
    totalSupply: items.reduce((s, i) => s + i.supplyAmt, 0),
    totalVat: items.reduce((s, i) => s + i.vatAmt, 0),
    totalAmt: items.reduce((s, i) => s + i.supplyAmt + i.vatAmt, 0),
  });

  const updateFormItems = (items: InvoiceItem[]) => {
    const recalc = recalcItems(items);
    setForm((p) => ({ ...p, items: recalc, ...calcTotals(recalc) }));
  };

  // ─── 품목 행 수정 ───────────────────────────────────────────────
  const handleItemChange = (
    idx: number, field: keyof InvoiceItem, raw: string
  ) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item;
      const numFields = ["unitPrice", "quantity", "supplyAmt", "vatRate", "vatAmt"];
      return { ...item, [field]: numFields.includes(field) ? Number(raw) : raw };
    });
    updateFormItems(items);
  };

  const addItem = () => updateFormItems([...form.items, BLANK_ITEM()]);

  const removeItem = (idx: number) =>
    updateFormItems(form.items.filter((_, i) => i !== idx));

  // ─── CRUD ───────────────────────────────────────────────────────
  const selectInvoice = (inv: Invoice) => {
    setSelected(inv);
    setForm({
      tradeDate: inv.tradeDate, items: inv.items,
      totalSupply: inv.totalSupply, totalVat: inv.totalVat, totalAmt: inv.totalAmt,
      vatIncluded: inv.vatIncluded, memo: inv.memo, type: inv.type,
    });
    setMode("view");
  };

  const handleNew = () => { setSelected(null); setForm(BLANK_INV()); setMode("new"); };

  const handleSave = () => {
    if (form.items.every((i) => !i.name)) { alert("품목을 하나 이상 입력하세요."); return; }
    if (mode === "new") {
      const created = saveInvoice(form);
      load();
      setSelected(created);
      setMode("view");
    } else if (mode === "edit" && selected) {
      updateInvoice(selected.id, form);
      load();
      setMode("view");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`문서번호 ${selected.docNo} 을(를) 삭제할까요?`)) return;
    deleteInvoice(selected.id);
    load();
    handleNew();
  };

  const handleSaveSettings = () => {
    saveInvoiceSettings(settings);
    setShowSettings(false);
  };

  const FIELD = "w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400";
  const RO = "bg-gray-50 " + FIELD;
  const isRO = mode === "view";

  const lastDocNo = invoices.at(-1)?.docNo ?? "—";

  return (
    <div className="p-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">세금계산서 / 거래명세서</h1>
          <p className="text-xs text-gray-500">마지막 문서번호: <span className="font-mono font-semibold">{lastDocNo}</span></p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-500">공급자: {settings.companyName || "미설정"}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {/* ─── LEFT: 문서 목록 ─── */}
        <div className="w-[260px] flex-shrink-0">
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-xs font-semibold text-gray-600 flex justify-between">
              <span>문서목록 ({invoices.length}건)</span>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-240px)]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {["문서번호","거래일자","합계금액"].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left border-b border-gray-200 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.length === 0 ? (
                    <tr><td colSpan={3} className="px-2 py-4 text-center text-gray-300">없음</td></tr>
                  ) : [...invoices].reverse().map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => selectInvoice(inv)}
                      className={`cursor-pointer hover:bg-blue-50 transition ${selected?.id === inv.id ? "bg-blue-100" : ""}`}
                    >
                      <td className="px-2 py-1.5 font-mono text-blue-600">{inv.docNo}</td>
                      <td className="px-2 py-1.5 text-gray-500">{inv.tradeDate}</td>
                      <td className="px-2 py-1.5 text-right font-semibold">{inv.totalAmt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <BtnAction label="신규" shortcut="F2" color="blue" onClick={handleNew} />
            <BtnAction label="수정" shortcut="F3" color="gray" onClick={() => selected && setMode("edit")} disabled={!selected} />
            <BtnAction label="삭제" shortcut="F4" color="red" onClick={handleDelete} disabled={!selected} />
            <BtnAction label="환경설정" shortcut="F9" color="gray" onClick={() => setShowSettings(true)} />
            <BtnAction label="세금계산서 인쇄" shortcut="F7" color="green" onClick={() => { if (selected) { selectInvoice(selected); setPrintPreview(true); } }} disabled={!selected} />
            <BtnAction label="거래명세서 인쇄" shortcut="F8" color="teal" onClick={() => { if (selected) { selectInvoice(selected); setPrintPreview(true); } }} disabled={!selected} />
          </div>
        </div>

        {/* ─── RIGHT: 입력 폼 ─── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-500 bg-gray-50 -mx-4 -mt-4 px-4 py-2 rounded-t-lg border-b border-gray-200 mb-4 flex items-center gap-4">
              <span>자료조회</span>
              {selected && <span className="font-mono text-blue-600">문서번호: {selected.docNo}</span>}
              <div className="ml-auto flex gap-3 items-center">
                <label className="inline-flex items-center gap-1 text-gray-600">
                  <input type="radio" name="type" value="tax" checked={form.type === "tax"}
                    onChange={() => !isRO && setForm((p) => ({ ...p, type: "tax" }))} disabled={isRO} />
                  세금계산서
                </label>
                <label className="inline-flex items-center gap-1 text-gray-600">
                  <input type="radio" name="type" value="trade" checked={form.type === "trade"}
                    onChange={() => !isRO && setForm((p) => ({ ...p, type: "trade" }))} disabled={isRO} />
                  거래명세서
                </label>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">거래일자</label>
                <input type="date" value={form.tradeDate}
                  onChange={(e) => !isRO && setForm((p) => ({ ...p, tradeDate: e.target.value }))}
                  disabled={isRO} className={isRO ? RO : FIELD} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">메모</label>
                <input value={form.memo} disabled={isRO}
                  onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
                  placeholder="비고" className={isRO ? RO : FIELD} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">부가세 포함 여부</label>
                <label className="inline-flex items-center gap-2 mt-1.5">
                  <input type="checkbox" checked={form.vatIncluded} disabled={isRO}
                    onChange={(e) => setForm((p) => ({ ...p, vatIncluded: e.target.checked }))}
                    className="accent-blue-600" />
                  <span className="text-xs text-gray-600">단가/공급가액에 부가세 포함</span>
                </label>
              </div>
            </div>

            {/* 품목 테이블 */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    {["품목","규격","단가","수량","공급가액","부가세율(%)","부가세액",""].map((h,i) => (
                      <th key={i} className="border border-gray-300 px-2 py-2 text-left text-gray-700 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-0">
                        <input value={item.name} disabled={isRO} onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                          placeholder="품목명" className="w-full px-2 py-1.5 text-xs focus:outline-none focus:bg-blue-50 min-w-28" />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input value={item.spec} disabled={isRO} onChange={(e) => handleItemChange(idx, "spec", e.target.value)}
                          placeholder="규격" className="w-20 px-2 py-1.5 text-xs focus:outline-none focus:bg-blue-50" />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input type="number" value={item.unitPrice || ""} disabled={isRO} onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          placeholder="0" className="w-24 px-2 py-1.5 text-xs text-right focus:outline-none focus:bg-blue-50" />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input type="number" value={item.quantity || ""} disabled={isRO} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          placeholder="1" className="w-14 px-2 py-1.5 text-xs text-right focus:outline-none focus:bg-blue-50" />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input type="number" value={item.supplyAmt || ""} disabled={isRO} onChange={(e) => handleItemChange(idx, "supplyAmt", e.target.value)}
                          placeholder="0" className="w-28 px-2 py-1.5 text-xs text-right focus:outline-none focus:bg-blue-50 bg-yellow-50" />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input type="number" value={item.vatRate} disabled={isRO} onChange={(e) => handleItemChange(idx, "vatRate", e.target.value)}
                          className="w-16 px-2 py-1.5 text-xs text-right focus:outline-none focus:bg-blue-50" />
                      </td>
                      <td className="border border-gray-200 p-0">
                        <input type="number" value={item.vatAmt || ""} disabled={isRO} onChange={(e) => handleItemChange(idx, "vatAmt", e.target.value)}
                          placeholder="0" className="w-24 px-2 py-1.5 text-xs text-right focus:outline-none focus:bg-blue-50 bg-yellow-50" />
                      </td>
                      <td className="border border-gray-200 px-1 text-center">
                        {!isRO && form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isRO && (
              <button onClick={addItem} className="text-xs px-3 py-1.5 border border-dashed border-blue-400 text-blue-600 rounded hover:bg-blue-50 mb-4">
                + 품목 추가
              </button>
            )}

            {/* 합계 */}
            <div className="flex justify-end">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-xs space-y-1.5 min-w-56">
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">공급가액 합계</span>
                  <span className="font-semibold">{form.totalSupply.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">부가세 합계</span>
                  <span className="font-semibold">{form.totalVat.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between gap-8 border-t border-gray-300 pt-1.5">
                  <span className="font-bold text-gray-700">합계금액</span>
                  <span className="font-bold text-blue-600 text-sm">{form.totalAmt.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 저장/취소 버튼 */}
            {!isRO && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button onClick={handleSave}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition">
                  자료저장 [F12]
                </button>
                <button onClick={() => selected ? selectInvoice(selected) : handleNew()}
                  className="px-5 py-2 bg-gray-400 text-white text-xs font-semibold rounded hover:bg-gray-500 transition">
                  저장취소 [Esc]
                </button>
                {saved && <span className="text-green-600 text-xs font-medium self-center">✓ 저장됐습니다</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 환경설정 모달 ─── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-100 px-5 py-3 border-b border-gray-300 flex items-center justify-between rounded-t-xl">
              <h2 className="font-bold text-sm">세금계산서/거래명세서 (업체정보)</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-6">
              {/* 공급자 정보 */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-3 pb-1 border-b border-gray-200">세금계산서에 인쇄할 공급자정보를 입력하세요</h3>
                <div className="space-y-2.5 border border-red-300 rounded-lg p-3 bg-red-50/30">
                  {([
                    ["bizNo", "등록번호", "000-00-00000"],
                    ["companyName", "업체명", "홍은회사(주)"],
                    ["ceoName", "대표자명", "홍길동"],
                    ["address", "사업장", "서울시 도봉구 창 667-7"],
                    ["businessType", "업태", "서비스"],
                    ["businessCategory", "종목", "소프트웨어개발"],
                    ["phone", "전화번호", "02-998-5303"],
                  ] as [keyof InvoiceSettings, string, string][]).map(([key, label, ph]) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 w-16 flex-shrink-0">{label}</label>
                      <input
                        value={settings[key] as string}
                        onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={ph}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 인쇄 옵션 */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-3 pb-1 border-b border-gray-200">세금계산서/거래명세서 관련하여 다음과 같이 설정합니다</h3>
                <div className="space-y-2">
                  {([
                    ["itemKorean", "1. 품목입력을 한글로 합니다."],
                    ["specKorean", "2. 규격입력을 한글로 합니다."],
                    ["blankZeroQty", "3. 세금계산서 출력시에 단가, 수량이 0이면 공백으로 합니다."],
                    ["blankZeroSupply", "4. 세금계산서 출력시에 공급가액, 세액이 0이면 공백으로 합니다."],
                    ["printSpecAsUnit", "5. 세금계산서 출력시에 단위칸에 규격을 인쇄합니다."],
                    ["printTradeDate", "6. 거래명세표 인쇄시에 거래일자를 추가로 인쇄합니다."],
                    ["noDocNo", "7. 세금계산서 인쇄시에 문서번호를 인쇄하지 않습니다."],
                  ] as [keyof InvoiceSettings, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings[key] as boolean}
                        onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.checked }))}
                        className="mt-0.5 accent-blue-600" />
                      <span className="text-xs text-gray-600">{label}</span>
                    </label>
                  ))}
                </div>

                <h3 className="text-xs font-bold text-gray-700 mt-4 mb-2 pb-1 border-b border-gray-200">세금계산서/거래명세서 하단 여백</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={settings.printFooter1}
                      onChange={(e) => setSettings((p) => ({ ...p, printFooter1: e.target.checked }))}
                      className="accent-blue-600" />
                    <span className="text-xs text-gray-600">1. 세금계산서 하단 여백에 다음과 같이 인쇄합니다.</span>
                  </label>
                  {settings.printFooter1 && (
                    <input value={settings.printFooter1Text}
                      onChange={(e) => setSettings((p) => ({ ...p, printFooter1Text: e.target.value }))}
                      placeholder="하단 여백 문구" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs ml-6" />
                  )}
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={settings.printFooter2}
                      onChange={(e) => setSettings((p) => ({ ...p, printFooter2: e.target.checked }))}
                      className="accent-blue-600" />
                    <span className="text-xs text-gray-600">2. 거래명세서 하단 여백에 다음과 같이 인쇄합니다.</span>
                  </label>
                  {settings.printFooter2 && (
                    <input value={settings.printFooter2Text}
                      onChange={(e) => setSettings((p) => ({ ...p, printFooter2Text: e.target.value }))}
                      placeholder="하단 여백 문구" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs ml-6" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 pb-4">
              <button onClick={handleSaveSettings}
                className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700">
                저장 [F12]
              </button>
              <button onClick={() => setShowSettings(false)}
                className="px-5 py-2 bg-gray-400 text-white text-xs font-semibold rounded hover:bg-gray-500">
                취소 [Esc]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 인쇄 미리보기 모달 ─── */}
      {printPreview && selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h2 className="font-bold">
                {form.type === "tax" ? "세금계산서" : "거래명세서"} — {selected.docNo}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">🖨 인쇄</button>
                <button onClick={() => setPrintPreview(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              </div>
            </div>

            <div className="p-6" id="print-area">
              {/* 문서 헤더 */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold border-b-2 border-black pb-2 inline-block px-8">
                  {form.type === "tax" ? "세금계산서" : "거래명세서"}
                </h1>
              </div>
              <div className="flex justify-between text-xs mb-4">
                <div>
                  {!settings.noDocNo && <p>문서번호: <strong>{selected.docNo}</strong></p>}
                  <p>거래일자: <strong>{selected.tradeDate}</strong></p>
                </div>
                <div className="text-right">
                  <p>공급자: <strong>{settings.companyName}</strong></p>
                  <p>대표자: {settings.ceoName}</p>
                  <p>등록번호: {settings.bizNo}</p>
                  <p>{settings.address}</p>
                  <p>TEL: {settings.phone}</p>
                </div>
              </div>

              {/* 품목 테이블 */}
              <table className="w-full border-collapse text-xs mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-1.5">품목</th>
                    {!settings.printSpecAsUnit && <th className="border border-gray-400 px-2 py-1.5">규격</th>}
                    {settings.printSpecAsUnit && <th className="border border-gray-400 px-2 py-1.5">단위(규격)</th>}
                    <th className="border border-gray-400 px-2 py-1.5">단가</th>
                    <th className="border border-gray-400 px-2 py-1.5">수량</th>
                    <th className="border border-gray-400 px-2 py-1.5">공급가액</th>
                    <th className="border border-gray-400 px-2 py-1.5">부가세</th>
                    <th className="border border-gray-400 px-2 py-1.5">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.filter((i) => i.name).map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-2 py-1.5">{item.name}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-center">{item.spec}</td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {(settings.blankZeroQty && !item.unitPrice) ? "" : item.unitPrice.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {(settings.blankZeroQty && !item.quantity) ? "" : item.quantity}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {(settings.blankZeroSupply && !item.supplyAmt) ? "" : item.supplyAmt.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right">
                        {(settings.blankZeroSupply && !item.vatAmt) ? "" : item.vatAmt.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold">
                        {(item.supplyAmt + item.vatAmt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-center">합 계</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right">{selected.totalSupply.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right">{selected.totalVat.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right text-blue-600">{selected.totalAmt.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              {/* 하단 여백 */}
              {settings.printFooter1 && settings.printFooter1Text && (
                <p className="text-xs text-gray-500 border-t border-gray-200 pt-2">{settings.printFooter1Text}</p>
              )}
              {selected.memo && <p className="text-xs text-gray-400 mt-1">비고: {selected.memo}</p>}
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
      className={`px-2 py-1.5 rounded text-xs font-medium transition leading-tight ${colors[color]} disabled:opacity-40 disabled:cursor-not-allowed`}>
      {label}<span className="block opacity-70 text-[9px]">[{shortcut}]</span>
    </button>
  );
}
