"use client";

import { hasAdminWebSession } from "@/lib/auth";
import {
  adminCredentialsInit,
  getAdminApiFailureMessage,
  readAdminResponseBody,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCallback, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type AppUserRow = {
  id: string;
  name: string;
  phone: string;
  mileageBalance: number;
  no?: number | null;
};

type AppUserDetail = AppUserRow & {
  email?: string;
  rideCount?: number;
};

export default function MileageManagePage() {
  const { getAccessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AppUserRow[]>([]);
  const [selected, setSelected] = useState<AppUserDetail | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [mode, setMode] = useState<"earn" | "deduct">("earn");
  const [amountInput, setAmountInput] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(
    async (userId: string) => {
      setError(null);
      setMessage(null);
      if (!API_BASE || !hasAdminWebSession()) {
        setError("API 또는 로그인 세션을 확인하세요.");
        return;
      }
      setLoadingUser(true);
      try {
        const res = await fetch(
          `${API_BASE}/admin/users/${encodeURIComponent(userId)}`,
          adminCredentialsInit(getAccessToken, { method: "GET" }),
        );
        const { json, rawText } = await readAdminResponseBody(res);
        if (!res.ok) {
          setSelected(null);
          setError(getAdminApiFailureMessage(res, json, rawText));
          return;
        }
        const data = (json as { data?: AppUserDetail }).data;
        if (!data?.id) {
          setSelected(null);
          setError("회원 정보를 불러오지 못했습니다.");
          return;
        }
        setSelected(data);
      } catch {
        setSelected(null);
        setError("네트워크 오류");
      } finally {
        setLoadingUser(false);
      }
    },
    [getAccessToken],
  );

  const runSearch = async () => {
    setError(null);
    setMessage(null);
    const q = search.trim();
    if (!q) {
      setResults([]);
      return;
    }
    if (!API_BASE || !hasAdminWebSession()) {
      setError("API 또는 로그인 세션을 확인하세요.");
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ search: q, limit: "20", page: "1" });
      const res = await fetch(`${API_BASE}/admin/users?${params}`, adminCredentialsInit(getAccessToken));
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setResults([]);
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const items = (json as { data?: { items?: AppUserRow[] } }).data?.items ?? [];
      setResults(items);
      if (items.length === 0) {
        setMessage("검색 결과가 없습니다. 이름·전화·이메일 또는 회원 ID 일부를 입력해 보세요.");
      }
    } catch {
      setResults([]);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const submitAdjust = async () => {
    setError(null);
    setMessage(null);
    if (!selected) {
      setError("먼저 회원을 선택하세요.");
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
            reason: reason.trim() || undefined,
          }),
        }),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const d = (json as { data?: { balance?: number; amount?: number } }).data;
      const bal = d?.balance;
      setMessage(
        bal != null
          ? `처리 완료. 변동 ${(d?.amount ?? amount).toLocaleString()}P · 잔액 ${bal.toLocaleString()}P`
          : "처리 완료.",
      );
      setAmountInput("");
      setReason("");
      await loadUser(selected.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">마일리지 관리</h1>
        <p className="text-gray-500 text-sm mt-1">
          앱 회원을 검색한 뒤 적립 또는 차감합니다. 이력은{" "}
          <Link href="/mileage/history" className="text-blue-600 hover:underline">
            마일리지 적립현황
          </Link>
          에서 확인할 수 있습니다.
        </p>
      </div>

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
          <h2 className="font-semibold">회원 검색</h2>
        </div>
        <div className="p-5 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="이름, 전화번호, 이메일, 회원 ID…"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <Button type="button" variant="secondary" onClick={runSearch} disabled={searching}>
            {searching ? "검색 중…" : "검색"}
          </Button>
        </div>
        {results.length > 0 ? (
          <div className="px-5 pb-5 max-h-56 overflow-y-auto border-t border-gray-100">
            <ul className="divide-y divide-gray-100 text-sm">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="w-full text-left py-3 px-1 hover:bg-gray-50 flex justify-between gap-2"
                    onClick={() => {
                      void loadUser(u.id);
                      setResults([]);
                      setSearch("");
                    }}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-gray-600">
                      {u.phone || u.id.slice(0, 8)}… · 잔액 {(u.mileageBalance ?? 0).toLocaleString()}P
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {loadingUser ? (
        <p className="text-gray-500 text-sm mb-4">회원 정보를 불러오는 중…</p>
      ) : null}

      {selected ? (
        <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
            <h2 className="font-semibold">선택한 회원</h2>
          </div>
          <div className="p-5 grid gap-2 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="text-gray-500">이름</span>{" "}
                <span className="font-medium">{selected.name}</span>
              </span>
              <span>
                <span className="text-gray-500">전화</span>{" "}
                <span className="font-mono">{selected.phone || "—"}</span>
              </span>
              {selected.no != null ? (
                <span>
                  <span className="text-gray-500">고객번호</span> {selected.no}
                </span>
              ) : null}
            </div>
            <div>
              <span className="text-gray-500">회원 ID</span>{" "}
              <span className="font-mono text-xs break-all">{selected.id}</span>
            </div>
            <div className="text-lg font-semibold text-indigo-700 pt-2">
              현재 잔액 {(selected.mileageBalance ?? 0).toLocaleString()}P
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
            <h2 className="font-semibold">적립 / 차감</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "earn"}
                  onChange={() => setMode("earn")}
                />
                적립
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "deduct"}
                  onChange={() => setMode("deduct")}
                />
                차감
              </label>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">금액 (원, 정수)</label>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="예: 10000"
                className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">사유 (선택)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 이벤트 보상, 클레임 조정"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={submitAdjust} disabled={submitting}>
                {submitting ? "처리 중…" : mode === "earn" ? "적립 실행" : "차감 실행"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelected(null);
                  setAmountInput("");
                  setReason("");
                  setMessage(null);
                  setError(null);
                }}
              >
                선택 해제
              </Button>
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              차감 시 잔액이 0 미만이 되면 요청이 거절됩니다. 대량 반영은{" "}
              <Link href="/rides/bulk-import" className="underline">
                엑셀자료등록
              </Link>
              의 마일리지 탭을 사용할 수 있습니다.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 text-sm text-red-600 whitespace-pre-wrap" role="alert">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-4 text-sm text-green-700" role="status">
          {message}
        </div>
      ) : null}
    </div>
  );
}
