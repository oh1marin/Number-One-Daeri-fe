"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** 엑셀 파일에서 변경전/변경후 번호 행을 배열로 파싱. 첫 행은 헤더로 간주. */
function parseExcelToNumberRows(file: File): Promise<{ phoneBefore: string; phoneAfter: string }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }
        const wb = XLSX.read(data, { type: "binary" });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        if (!firstSheet) {
          resolve([]);
          return;
        }
        const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: "" }) as string[][];
        if (rows.length < 2) {
          resolve([]);
          return;
        }
        const headers = rows[0].map((h) => String(h ?? "").trim().toLowerCase());
        const colBefore = headers.findIndex((h) =>
          /변경전|before|phonebefore/.test(h)
        );
        const colAfter = headers.findIndex((h) =>
          /변경후|after|phoneafter/.test(h)
        );
        const idxBefore = colBefore >= 0 ? colBefore : 0;
        const idxAfter = colAfter >= 0 ? colAfter : Math.max(1, colBefore >= 0 ? colBefore + 1 : 1);
        const out: { phoneBefore: string; phoneAfter: string }[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] || [];
          const before = String(row[idxBefore] ?? "").trim();
          const after = String(row[idxAfter] ?? "").trim();
          if (before || after) out.push({ phoneBefore: before, phoneAfter: after });
        }
        resolve(out);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

/** 번호 정규화: 숫자만, 10자리 이상이면 유효 */
function normalizePhone(v: string): string {
  const digits = (v || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits : "";
}

/** 엑셀에서 전화번호 열만 파싱 (바뀐번호 조회용). 헤더에 전화번호/번호/phone 등이 있으면 해당 열, 없으면 첫 열 */
function parseExcelToPhones(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }
        const wb = XLSX.read(data, { type: "binary" });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        if (!firstSheet) {
          resolve([]);
          return;
        }
        const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: "" }) as string[][];
        if (rows.length < 2) {
          resolve([]);
          return;
        }
        const headers = (rows[0] || []).map((h) => String(h ?? "").trim().toLowerCase());
        const colIdx = headers.findIndex((h) =>
          /phone|tel|번호|전화|연락/i.test(h),
        );
        const idx = colIdx >= 0 ? colIdx : 0;
        const phones: string[] = [];
        for (let i = 1; i < rows.length; i++) {
          const cell = String((rows[i] || [])[idx] ?? "").trim();
          const normalized = normalizePhone(cell);
          if (normalized) phones.push(normalized);
        }
        resolve([...new Set(phones)]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

interface LookupResultItem {
  phoneBefore: string;
  phoneAfter: string | null;
  found: boolean;
}

interface NumberChangeItem {
  id?: string;
  phoneBefore: string;
  phoneAfter: string;
}

/** 현재 목록을 엑셀 파일로 다운로드 */
function downloadAsExcel(items: NumberChangeItem[]) {
  const rows = items.map((r) => ({
    기존번호: r.phoneBefore,
    바뀐번호: r.phoneAfter ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "번호변경리스트");
  const fileName = `번호변경리스트_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function downloadLookupResultAsExcel(items: LookupResultItem[]) {
  const rows = items.map((r) => ({
    기존번호: r.phoneBefore,
    바뀐번호: r.phoneAfter ?? "",
    매칭: r.found ? "O" : "X",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "바뀐번호조회");
  const fileName = `바뀐번호조회_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export default function NumberChangePage() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<NumberChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerRows, setRegisterRows] = useState<{ phoneBefore: string; phoneAfter: string }[]>([
    { phoneBefore: "", phoneAfter: "" },
  ]);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBefore, setEditBefore] = useState("");
  const [editAfter, setEditAfter] = useState("");
  const [saveSubmitting, setSaveSubmitting] = useState(false);

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupItems, setLookupItems] = useState<LookupResultItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/admin/number-change`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.data?.items ?? data.data ?? data.items ?? data;
        const list = Array.isArray(raw) ? raw : [];
        setItems(
          list.map((r: any) => ({
            id: r.id,
            phoneBefore: r.phoneBefore ?? r.phone_before ?? r.before ?? "",
            phoneAfter: r.phoneAfter ?? r.phone_after ?? r.after ?? "",
          }))
        );
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [getAccessToken]);

  const api = (path: string, opts: RequestInit = {}) => {
    const token = getAccessToken();
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...opts.headers,
      },
    });
  };

  const handleRegisterOpen = () => {
    setRegisterRows([{ phoneBefore: "", phoneAfter: "" }]);
    setRegisterOpen(true);
  };

  const addRegisterRow = () => {
    setRegisterRows((prev) => [...prev, { phoneBefore: "", phoneAfter: "" }]);
  };

  const handleExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setExcelLoading(true);
    try {
      const parsed = await parseExcelToNumberRows(file);
      if (parsed.length === 0) {
        showToast("err", "엑셀에서 읽을 수 있는 데이터가 없습니다. 첫 행은 헤더(변경전번호, 변경후번호 등)로 해 주세요.");
      } else {
        setRegisterRows(parsed);
        showToast("ok", `${parsed.length}건 불러왔습니다. 확인 후 등록하세요.`);
      }
    } catch {
      showToast("err", "엑셀 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setExcelLoading(false);
    }
  };

  const updateRegisterRow = (i: number, field: "phoneBefore" | "phoneAfter", value: string) => {
    setRegisterRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleRegisterSubmit = async () => {
    const valid = registerRows
      .map((r) => ({
        phoneBefore: normalizePhone(r.phoneBefore),
        phoneAfter: normalizePhone(r.phoneAfter),
      }))
      .filter((r) => r.phoneBefore && r.phoneAfter);
    if (valid.length === 0) {
      const total = registerRows.filter((r) => r.phoneBefore.trim() || r.phoneAfter.trim()).length;
      showToast(
        "err",
        total
          ? "모든 행에서 변경전·변경후 번호가 각각 숫자 10자리 이상이어야 합니다"
          : "변경전·변경후 번호를 각각 10자리 이상 입력하세요. (숫자 10자리 이상)"
      );
      return;
    }
    setRegisterSubmitting(true);
    try {
      const body =
        valid.length === 1
          ? { phoneBefore: valid[0].phoneBefore, phoneAfter: valid[0].phoneAfter }
          : { items: valid };
      const res = await api("/admin/number-change", { method: "POST", body: JSON.stringify(body) });
      let data: { success?: boolean; data?: unknown; message?: string; error?: string } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        // 응답이 JSON이 아닐 때
      }
      if (res.ok && data.success !== false) {
        showToast("ok", `${valid.length}건 등록되었습니다.`);
        setRegisterOpen(false);
        load();
      } else {
        let msg = data?.message ?? data?.error;
        if (!msg) {
          if (res.status === 401 || res.status === 403) msg = "로그인이 필요하거나 권한이 없습니다.";
          else if (res.status === 404) msg = "API 경로를 확인하세요 (GET/POST /admin/number-change)";
          else msg = res.status ? `${res.status} ${res.statusText}` : "등록 실패";
        }
        showToast("err", msg);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "네트워크 오류";
      showToast("err", msg);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const startEdit = (row: NumberChangeItem) => {
    if (row.id) {
      setEditingId(row.id);
      setEditBefore(row.phoneBefore || "");
      setEditAfter(row.phoneAfter || "");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBefore("");
    setEditAfter("");
  };

  const handleSave = async () => {
    if (!editingId) {
      showToast("err", "수정할 행에서 수정 버튼을 누른 뒤 저장하세요.");
      return;
    }
    const before = normalizePhone(editBefore);
    const after = normalizePhone(editAfter);
    if (!before || !after) {
      showToast("err", "변경전·변경후 번호를 각각 10자리 이상 입력하세요.");
      return;
    }
    setSaveSubmitting(true);
    try {
      const res = await api(`/admin/number-change/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ phoneBefore: before, phoneAfter: after }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        showToast("ok", "수정되었습니다.");
        cancelEdit();
        load();
      } else {
        showToast("err", data?.message ?? "저장 실패");
      }
    } catch {
      showToast("err", "네트워크 오류");
    } finally {
      setSaveSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await api(`/admin/number-change/${id}`, { method: "DELETE" });
      let data: any = {};
      try {
        if (res.headers.get("content-type")?.includes("application/json")) data = await res.json();
      } catch {}
      if (res.ok && (res.status === 204 || data.success !== false || data.data !== undefined)) {
        showToast("ok", "삭제되었습니다.");
        if (editingId === id) cancelEdit();
        load();
      } else {
        showToast("err", data?.message ?? "삭제 실패");
      }
    } catch {
      showToast("err", "네트워크 오류");
    }
  };

  const handleStartTask = () => {
    showToast("ok", "업무시작이 처리되었습니다.");
  };
  const handleEndTask = () => {
    showToast("ok", "업무종료가 처리되었습니다.");
  };
  const handleSpamSolver = () => {
    showToast("ok", "팩스연결이 처리되었습니다.");
  };
  const handleLookupOpen = () => {
    setLookupItems([]);
    setLookupOpen(true);
  };

  const handleLookupExcelSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLookupLoading(true);
    setLookupItems([]);
    try {
      const phones = await parseExcelToPhones(file);
      if (phones.length === 0) {
        showToast("err", "엑셀에서 10자리 이상 전화번호를 찾을 수 없습니다. 전화번호 열 제목을 확인하세요.");
        setLookupLoading(false);
        return;
      }
      const res = await api("/admin/number-change/lookup", {
        method: "POST",
        body: JSON.stringify({ phones }),
      });
      const data = await res.json().catch(() => ({}));
      const root = data?.data ?? data;
      const list = root?.items ?? root ?? [];
      if (Array.isArray(list)) {
        setLookupItems(list);
        const foundCount = list.filter((x: LookupResultItem) => x.found).length;
        showToast("ok", `조회 완료: ${list.length}건 중 ${foundCount}건 매칭`);
      } else {
        showToast("err", data?.message ?? "조회 결과 형식 오류");
      }
    } catch {
      showToast("err", "조회 중 오류가 발생했습니다.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold">번호 변경 관리</h1>
      </div>
      <p className="text-gray-600 mb-6">일괄등록 및 변경번호 찾기</p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRegisterOpen}>일괄등록</Button>
          <button
            onClick={() => downloadAsExcel(items)}
            disabled={items.length === 0}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            엑셀
          </button>
          <button
            onClick={handleStartTask}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            업무시작
          </button>
          <button
            onClick={handleEndTask}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
          >
            업무종료
          </button>
          <button
            onClick={handleSpamSolver}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
          >
            팩스연결
          </button>
          <Button variant="destructive" onClick={handleLookupOpen}>
            바뀐번호 조회
          </Button>
        </div>
        <p className="text-sm text-gray-500 font-medium">등록 건수: {items.length.toLocaleString()}</p>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="border border-gray-200 bg-[#f0f0f0] px-3 py-2 text-center font-semibold text-gray-800 min-w-[140px]">
                  변경전번호
                </th>
                <th className="border-l border-gray-200 bg-[#f0f0f0] w-px min-w-0" />
                <th className="border border-gray-200 bg-[#f0f0f0] px-3 py-2 text-center font-semibold text-gray-800 min-w-[140px]">
                  변경후번호
                </th>
                <th className="border border-gray-200 bg-[#f0f0f0] px-3 py-2 text-center font-semibold text-gray-800 w-24 min-w-[96px]">
                  업무
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="border border-gray-200 px-3 py-12 text-center text-gray-500 bg-white">
                    로딩 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-gray-200 px-3 py-12 text-center text-gray-500 bg-white">
                    데이터가 없습니다. 일괄등록 버튼으로 추가하세요.
                  </td>
                </tr>
              ) : (
                items.map((row, i) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id ?? i} className={i % 2 === 1 ? "bg-[#fafafa]" : "bg-white"}>
                      <td className="border border-gray-200 px-3 py-2 text-center font-mono text-gray-800 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editBefore}
                            onChange={(e) => setEditBefore(e.target.value)}
                            placeholder="01012345678"
                            className="w-full min-w-[120px] px-2 py-1 border border-gray-300 text-center font-mono text-sm box-border"
                          />
                        ) : (
                          row.phoneBefore || "—"
                        )}
                      </td>
                      <td className="border-l border-gray-200 w-px bg-gray-100" />
                      <td className="border border-gray-200 px-3 py-2 text-center font-mono text-gray-800 align-middle">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editAfter}
                            onChange={(e) => setEditAfter(e.target.value)}
                            placeholder="01087654321"
                            className="w-full min-w-[120px] px-2 py-1 border border-gray-300 text-center font-mono text-sm box-border"
                          />
                        ) : (
                          row.phoneAfter || "—"
                        )}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center align-middle">
                        {row.id && (
                          <>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSave}
                                  disabled={saveSubmitting}
                                  className="text-xs text-green-600 hover:underline mr-1"
                                >
                                  {saveSubmitting ? "저장 중…" : "저장"}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-xs text-gray-600 hover:underline mr-1"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEdit(row)}
                                className="text-xs text-blue-600 hover:underline mr-1"
                              >
                                수정
                              </button>
                            )}
                            <button
                              onClick={() => row.id && handleDelete(row.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 일괄등록 모달 */}
      {registerOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          onClick={() => !registerSubmitting && setRegisterOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4">일괄등록</h3>
            <div className="mb-4 flex items-center gap-2">
              <label className="px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                엑셀 파일 선택
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelSelect}
                  disabled={excelLoading}
                  className="hidden"
                />
              </label>
              {excelLoading && <span className="text-sm text-gray-500">불러오는 중…</span>}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              엑셀 첫 행은 헤더로 두고, 변경전번호 / 변경후번호(또는 변경전·변경후) 컬럼이 있으면 됩니다.
            </p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {registerRows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={r.phoneBefore}
                    onChange={(e) => updateRegisterRow(i, "phoneBefore", e.target.value)}
                    placeholder="변경전 010..."
                    className="flex-1 px-3 py-2 border rounded text-sm font-mono"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="text"
                    value={r.phoneAfter}
                    onChange={(e) => updateRegisterRow(i, "phoneAfter", e.target.value)}
                    placeholder="변경후 010..."
                    className="flex-1 px-3 py-2 border rounded text-sm font-mono"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRegisterRow}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              + 행 추가
            </button>
            <p className="mt-2 text-xs text-gray-500">번호는 숫자만 10자리 이상 입력 (미입력 행은 제외)</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => !registerSubmitting && setRegisterOpen(false)}
                className="px-3 py-1.5 border rounded text-sm"
              >
                취소
              </button>
              <Button onClick={handleRegisterSubmit} disabled={registerSubmitting} size="sm">
                {registerSubmitting ? "등록 중…" : "등록"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 바뀐번호 조회 모달 */}
      {lookupOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLookupOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">바뀐번호 조회</h3>
              <button
                onClick={() => setLookupOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 flex-1 overflow-auto">
              <div className="mb-4 flex items-center gap-2">
                <label className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700">
                  엑셀 선택
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleLookupExcelSelect}
                    disabled={lookupLoading}
                    className="hidden"
                  />
                </label>
                {lookupLoading && <span className="text-sm text-gray-500">조회 중…</span>}
                {lookupItems.length > 0 && (
                  <button
                    onClick={() => downloadLookupResultAsExcel(lookupItems)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                  >
                    결과 다운로드
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                엑셀 첫 행은 헤더로 두고, 전화번호 열(전화번호/번호/phone 등)이 있으면 해당 열, 없으면 첫 열에서 번호를
                추출합니다. 10자리 이상 숫자만 사용합니다.
              </p>
              {lookupItems.length > 0 ? (
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-semibold text-gray-800">기존번호</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-800">바뀐번호</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-800 w-20">매칭</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lookupItems.map((r, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-3 py-2 font-mono">{r.phoneBefore}</td>
                          <td className="px-3 py-2 font-mono">{r.phoneAfter ?? "—"}</td>
                          <td className="px-3 py-2 text-center">
                            {r.found ? (
                              <span className="text-green-600 font-medium">O</span>
                            ) : (
                              <span className="text-gray-400">X</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 text-sm">
                  엑셀을 선택하면 조회 결과가 여기에 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
