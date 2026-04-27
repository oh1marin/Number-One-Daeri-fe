"use client";

import { hasAdminWebSession } from "@/lib/auth";
import {
  adminCredentialsInit,
  getAdminApiFailureMessage,
  readAdminResponseBody,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const PAGE_SIZE = 40;

type AppUserRow = {
  id: string;
  name: string;
  phone: string;
  mileageBalance: number;
  no?: number | null;
  email?: string;
};

export default function MileageManagePage() {
  const { getAccessToken } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<AppUserRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected] = useState<AppUserRow | null>(null);
  const [mode, setMode] = useState<"earn" | "deduct">("earn");
  const [amountInput, setAmountInput] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setError(null);
    if (!API_BASE || !hasAdminWebSession()) {
      setList([]);
      setTotal(0);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
      const res = await fetch(`${API_BASE}/admin/users?${params}`, adminCredentialsInit(getAccessToken));
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setList([]);
        setTotal(0);
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const data = json as { data?: { items?: AppUserRow[]; total?: number } };
      setList(data.data?.items ?? []);
      setTotal(data.data?.total ?? 0);
    } catch {
      setList([]);
      setTotal(0);
      setError("목록을 불러오지 못했습니다.");
    } finally {
      setListLoading(false);
    }
  }, [getAccessToken, page, appliedSearch]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const applySearch = () => {
    setMessage(null);
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const selectRow = (u: AppUserRow) => {
    setSelected(u);
    setMessage(null);
    setError(null);
  };

  const submitAdjust = async () => {
    setError(null);
    setMessage(null);
    if (!selected) {
      setError("표에서 회원 한 명을 선택하세요.");
      return;
    }
    const n = Number(String(amountInput).replace(/,/g, "").trim());
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      setError("금액은 1원 이상의 정수로 입력하세요.");
      return;
    }
    const amount = mode === "earn" ? n : -n;
    if (!API_BASE || !hasAdminWebSession()) {
      setError("API 또는 로그인 세션을 확인하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/mileage/adjust`,
        adminCredentialsInit(getAccessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selected.id,
            amount,
            reason: memo.trim() || undefined,
          }),
        }),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const d = (json as { data?: { balance?: number; amount?: number } }).data;
      const newBal = d?.balance;
      setMessage(
        newBal != null
          ? `처리 완료. 변동 ${(d?.amount ?? amount).toLocaleString()}P · 잔액 ${newBal.toLocaleString()}P`
          : "처리 완료.",
      );
      setAmountInput("");
      setMemo("");
      if (newBal != null) {
        setSelected((s) => (s && s.id === selected.id ? { ...s, mileageBalance: newBal } : s));
        setList((rows) =>
          rows.map((r) => (r.id === selected.id ? { ...r, mileageBalance: newBal } : r)),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inputClass =
    "h-9 w-full px-2 text-sm border border-[var(--sheet-border)] bg-white text-[var(--sheet-text)]";

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold leading-none">마일리지 관리</h1>
          <p className="text-xs text-gray-500 mt-1">
            앱 회원 목록에서 선택 후 적립·차감 · 적요는 이력 비고로 저장
          </p>
        </div>
        <Link href="/mileage/history" className="text-xs text-blue-700 hover:underline shrink-0">
          적립현황
        </Link>
      </div>

      <div className="sheet-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 max-w-md">
              <label className="block text-[11px] text-[var(--sheet-text-muted)] mb-1.5">검색</label>
              <input
                type="text"
                className={`${inputClass} min-w-0`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                placeholder="전화번호, 이름, 이메일, 회원 ID…"
              />
            </div>
            <button
              type="button"
              onClick={applySearch}
              disabled={listLoading}
              className="h-9 px-4 text-sm sheet-btn sheet-btn-primary disabled:opacity-50"
            >
              조회
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setAppliedSearch("");
                setPage(1);
                setMessage(null);
              }}
              className="h-9 px-4 text-sm sheet-btn"
            >
              전체
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-[11px] text-[var(--sheet-text-muted)] mr-1 pb-2">처리 유형</span>
            <button
              type="button"
              onClick={() => setMode("earn")}
              className={`h-9 px-4 text-sm sheet-btn ${mode === "earn" ? "sheet-btn-primary" : ""}`}
            >
              적립
            </button>
            <button
              type="button"
              onClick={() => setMode("deduct")}
              className={`h-9 px-4 text-sm sheet-btn ${mode === "deduct" ? "sheet-btn-danger" : ""}`}
            >
              차감
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_min(100%,380px)] gap-4 items-stretch">
        <div className="sheet-wrap min-w-0 flex flex-col min-h-[min(72vh,820px)] xl:min-h-[calc(100vh-11rem)]">
          <div className="px-3 py-2 border-b border-[var(--sheet-header-border)] bg-[var(--sheet-header-bg)] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-semibold text-[var(--sheet-text)]">앱 회원 목록</span>
            <span className="text-[11px] text-[var(--sheet-text-muted)]">
              {total.toLocaleString()}명 · {page}/{totalPages}페이지
            </span>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[280px] min-w-0">
            <table className="sheet-table text-[11px]">
              <thead className="sticky">
                <tr>
                  <th className="w-10 text-center"> </th>
                  <th className="w-12 text-center">No</th>
                  <th className="w-[72px]">고객번호</th>
                  <th className="min-w-[100px]">이름</th>
                  <th className="min-w-[120px]">전화번호</th>
                  <th className="w-[100px] text-right">잔액(P)</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--sheet-text-muted)]">
                      로딩 중…
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--sheet-text-muted)]">
                      {appliedSearch ? "검색 결과가 없습니다." : "회원이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  list.map((u, idx) => {
                    const isSel = selected?.id === u.id;
                    const no = (page - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr
                        key={u.id}
                        onClick={() => selectRow(u)}
                        className={`cursor-pointer ${isSel ? "sheet-selected" : ""}`}
                      >
                        <td className="text-center text-indigo-600 font-semibold">{isSel ? "●" : ""}</td>
                        <td className="text-center tabular-nums text-[var(--sheet-text-muted)]">{no}</td>
                        <td className="tabular-nums">{u.no ?? "—"}</td>
                        <td className="font-medium">{u.name}</td>
                        <td className="font-mono">{u.phone || "—"}</td>
                        <td className="text-right font-semibold tabular-nums">
                          {(u.mileageBalance ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t-2 border-[var(--sheet-header-border)] bg-[var(--sheet-footer-bg)] shrink-0 mt-auto">
            <button
              type="button"
              className="h-9 px-3 text-sm sheet-btn"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <span className="text-[11px] text-[var(--sheet-text-muted)]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="h-9 px-3 text-sm sheet-btn"
              disabled={page >= totalPages || listLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="sheet-wrap">
            <div className="px-3 py-2 border-b border-[var(--sheet-header-border)] bg-[var(--sheet-header-bg)]">
              <span className="text-xs font-semibold text-[var(--sheet-text)]">선택 회원</span>
            </div>
            <div className="p-3 text-sm min-h-[128px] border-t border-transparent">
              {!selected ? (
                <p className="text-[11px] text-[var(--sheet-text-muted)] py-4 text-center">
                  왼쪽 표에서 행을 클릭하세요.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="font-semibold text-[var(--sheet-text)]">{selected.name}</div>
                  <div className="font-mono text-[11px] text-[var(--sheet-text-muted)]">
                    {selected.phone || "—"}
                  </div>
                  <div className="text-[10px] text-[var(--sheet-text-muted)] break-all leading-snug">
                    {selected.id}
                  </div>
                  <div className="pt-1 text-base font-bold tabular-nums text-indigo-700">
                    {(selected.mileageBalance ?? 0).toLocaleString()} P
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sheet-wrap">
            <div className="px-3 py-2 border-b border-[var(--sheet-header-border)] bg-[var(--sheet-header-bg)]">
              <span className="text-xs font-semibold text-[var(--sheet-text)]">
                {mode === "earn" ? "적립" : "차감"} 반영
              </span>
            </div>
            <div className="p-3 space-y-3 border-t border-transparent">
              <div>
                <label className="block text-[11px] text-[var(--sheet-text-muted)] mb-1.5">
                  금액 (원, 정수)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${inputClass} ${!selected ? "opacity-50" : ""}`}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="예: 10000"
                  disabled={!selected}
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--sheet-text-muted)] mb-1.5">
                  적요 · 메모
                </label>
                <textarea
                  className={`w-full min-h-[100px] px-2 py-2 text-sm border border-[var(--sheet-border)] bg-[var(--sheet-input-bg)] text-[var(--sheet-text)] resize-y placeholder:text-gray-400 ${!selected ? "opacity-50" : ""}`}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="이벤트 보상, 정정 사유 등"
                  rows={4}
                  disabled={!selected}
                />
              </div>
              <button
                type="button"
                onClick={submitAdjust}
                disabled={submitting || !selected}
                className={`w-full h-10 text-sm font-medium sheet-btn disabled:opacity-50 ${
                  mode === "deduct" ? "sheet-btn-danger" : "sheet-btn-primary"
                }`}
              >
                {submitting ? "처리 중…" : mode === "earn" ? "적립 반영" : "차감 반영"}
              </button>
              <p className="text-[10px] text-[var(--sheet-btn-danger-text)] leading-snug bg-[var(--sheet-btn-danger-bg)] border border-[var(--sheet-border)] px-2 py-2">
                차감 시 잔액이 음수면 거절됩니다. 대량 반영은{" "}
                <Link href="/rides/bulk-import" className="underline text-blue-800">
                  엑셀자료등록
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div
          className="mt-4 text-sm text-red-800 whitespace-pre-wrap px-3 py-2 border border-red-200 bg-red-50 rounded-[10px]"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {message ? (
        <div
          className="mt-4 text-sm text-emerald-900 px-3 py-2 border border-emerald-200 bg-emerald-50 rounded-[10px]"
          role="status"
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
