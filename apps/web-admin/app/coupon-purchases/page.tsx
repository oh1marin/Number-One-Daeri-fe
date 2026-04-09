"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const MAX_CHARGE_AMOUNT = 1_000_000;

function formatNumber(n: unknown) {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  if (Number.isNaN(v)) return "0";
  return v.toLocaleString();
}

function formatDate(s: string): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const sec = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}:${sec}`;
  } catch {
    return s;
  }
}

type SearchField = "all" | "receiptNo" | "phone";

export default function CouponPurchasesPage() {
  const { getAccessToken } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 30;

  const [budgetLoading, setBudgetLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [budgetUpdatedAt, setBudgetUpdatedAt] = useState<string | null>(null);

  const [field, setField] = useState<SearchField>("all");
  const [query, setQuery] = useState("");
  const [appliedField, setAppliedField] = useState<SearchField>("all");
  const [appliedQuery, setAppliedQuery] = useState("");

  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeAmountText, setChargeAmountText] = useState("");
  const [chargeMemo, setChargeMemo] = useState("");
  const [chargeSubmitting, setChargeSubmitting] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  const loadBudget = async () => {
    setBudgetLoading(true);
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setBalance(null);
      setBudgetUpdatedAt(null);
      setBudgetLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/coupons/budget`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setBalance(null);
        setBudgetUpdatedAt(null);
        setBudgetLoading(false);
        return;
      }
      const data = await res.json();
      const root = data?.data ?? data;
      const b = root?.balance;
      const u = root?.updatedAt;
      const v = Number(b);
      setBalance(Number.isNaN(v) ? null : v);
      setBudgetUpdatedAt(u ? String(u) : null);
    } catch {
      setBalance(null);
      setBudgetUpdatedAt(null);
    }
    setBudgetLoading(false);
  };

  const loadBudgetHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setHistoryItems([]);
      setHistoryLoading(false);
      return;
    }
    const params = new URLSearchParams({ page: "1", limit: "20" });
    const endpoints = [
      `${API_BASE}/admin/coupons/budget/history?${params}`,
      `${API_BASE}/admin/coupons/budget/histories?${params}`,
      `${API_BASE}/admin/coupons/budget/logs?${params}`,
    ];
    try {
      let res: Response | null = null;
      let lastStatus: { status: number; statusText: string } | null = null;
      for (const url of endpoints) {
        // eslint-disable-next-line no-await-in-loop
        const r = await fetch(url, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.ok) {
          res = r;
          break;
        }
        lastStatus = { status: r.status, statusText: r.statusText };
      }
      if (!res) {
        setHistoryItems([]);
        if (lastStatus) {
          setHistoryError(`${lastStatus.status} ${lastStatus.statusText || ""}`.trim());
        } else {
          setHistoryError("로그 API 응답 없음");
        }
        setHistoryLoading(false);
        return;
      }
      const data = await res.json();
      const root = data?.data ?? data;
      const list = root?.items ?? root?.list ?? root?.history ?? (Array.isArray(root) ? root : []);
      setHistoryItems(Array.isArray(list) ? list : []);
    } catch {
      setHistoryError("로그 조회 실패");
      setHistoryItems([]);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    loadBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken]);

  useEffect(() => {
    if (!chargeOpen) return;
    loadBudgetHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargeOpen]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setItems([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (appliedQuery.trim()) {
        params.set("q", appliedQuery.trim());
        params.set("field", appliedField);
      }

      const endpoints = [
        `${API_BASE}/admin/coupons/purchases?${params}`,
        `${API_BASE}/admin/coupons/history?${params}`,
      ];

      try {
        let res: Response | null = null;
        for (const url of endpoints) {
          // eslint-disable-next-line no-await-in-loop
          const r = await fetch(url, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
          if (r.ok) {
            res = r;
            break;
          }
        }

        if (!res) {
          setItems([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const root = data?.data ?? data;
        const list =
          root?.items ??
          root?.list ??
          root?.history ??
          root?.purchases ??
          (Array.isArray(root) ? root : []);
        const total = root?.total ?? root?.count ?? (Array.isArray(list) ? list.length : 0);

        setItems(Array.isArray(list) ? list : []);
        setTotalCount(typeof total === "number" ? total : Number(total ?? 0) || 0);
      } catch {
        setItems([]);
        setTotalCount(0);
      }

      setLoading(false);
    }
    load();
  }, [getAccessToken, page, appliedField, appliedQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handleSearch = () => {
    setAppliedField(field);
    setAppliedQuery(query);
    setPage(1);
  };

  const chargeAmount = Number(chargeAmountText.replace(/,/g, "").trim());
  const chargeAmountValid =
    Number.isInteger(chargeAmount) &&
    chargeAmount >= 1 &&
    chargeAmount <= MAX_CHARGE_AMOUNT;

  const submitCharge = async () => {
    if (!chargeAmountValid || chargeSubmitting) return;
    setChargeSubmitting(true);
    setChargeError(null);
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setChargeError("로그인이 필요합니다.");
      setChargeSubmitting(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/coupons/budget/charge`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: chargeAmount,
          memo: chargeMemo.trim() ? chargeMemo.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.success !== false || data?.data || data?.balance != null);
      if (!ok) {
        const msg = data?.message ? String(data.message) : "충전에 실패했습니다.";
        setChargeError(`${res.status} ${res.statusText || ""}`.trim() + `: ${msg}`);
        setChargeSubmitting(false);
        return;
      }
      setChargeOpen(false);
      setChargeAmountText("");
      setChargeMemo("");
      await loadBudget();
      await loadBudgetHistory();
    } catch {
      setChargeError("네트워크 오류");
    }
    setChargeSubmitting(false);
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold leading-none">쿠폰구매 현황</h1>
          <div className="text-sm text-gray-700 leading-none">
            잔액 :{" "}
            <span className="font-semibold text-red-700">
              {budgetLoading ? "…" : balance == null ? "-" : `${formatNumber(balance)}원`}
            </span>
            <span className="text-gray-500 text-xs"> (금액충전 버튼을 눌러 확인 후 충전하세요.)</span>
          </div>
        </div>
      </div>

      <div className="sheet-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <select
              className="h-7 px-1.5 text-xs border border-[var(--sheet-border)] bg-white md:h-8 md:px-2 md:text-sm"
              value={field}
              onChange={(e) => setField(e.target.value as SearchField)}
              aria-label="검색 범위"
            >
              <option value="all">전체</option>
              <option value="receiptNo">접수번호</option>
              <option value="phone">전화번호</option>
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어"
              className="h-7 w-36 px-1.5 text-xs border border-[var(--sheet-border)] bg-white md:h-8 md:w-56 md:px-2 md:text-sm"
            />
            <button
              onClick={handleSearch}
              className="h-7 px-2 text-[11px] sheet-btn sheet-btn-primary md:h-8 md:px-4 md:text-sm"
            >
              검색
            </button>
            <button
              onClick={() => {
                setChargeError(null);
                setChargeOpen(true);
              }}
              className="h-7 px-2 text-[11px] font-semibold border border-yellow-400 bg-yellow-300 text-gray-900 hover:bg-yellow-400 active:bg-yellow-500 md:h-8 md:px-4 md:text-sm"
            >
              금액충전
            </button>
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">
            쿠폰 거래 내역을 관리합니다.{" "}
            <span className="font-semibold text-gray-700">[취소가능합니다]</span>. 반드시 콜번호·접수번호를
            비교하세요.
            <br />
            접수번호를 클릭하시면 취소 가능합니다.
          </div>
        </div>
      </div>

      <div className="sheet-wrap">
        <div className="overflow-x-auto">
          <table className="sheet-table">
            <thead className="sticky">
              <tr>
                <th className="w-[210px]">접수번호</th>
                <th className="w-[140px]">전화번호</th>
                <th className="w-[90px] text-right">금액</th>
                <th className="w-[90px] text-right">잔액</th>
                <th className="w-[140px]">이벤트명</th>
                <th className="w-[70px]">상태</th>
                <th className="w-[190px]">발생시간</th>
                <th className="w-[90px]">사용만료월</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-left text-gray-600">
                    데이터가 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                items.map((r, i) => {
                  const receiptNo = r.receiptNo ?? r.orderNo ?? r.id ?? r.key ?? "—";
                  const phone = r.phone ?? r.mobile ?? r.userPhone ?? "—";
                  const amount = r.amount ?? r.price ?? r.value ?? 0;
                  const remain = r.balance ?? r.remain ?? r.remaining ?? r.afterBalance ?? r.after ?? 0;
                  const event = r.event ?? r.eventName ?? r.reason ?? "—";
                  const status = r.status ?? r.state ?? (Number(amount) < 0 ? "사용" : "적립");
                  const createdAt = r.createdAt ?? r.occurredAt ?? r.date ?? r.time ?? "—";
                  const ym = r.ym ?? r.month ?? r.useMonth ?? r.usedYm ?? r.usedMonth ?? "—";

                  return (
                    <tr key={r.id ?? receiptNo ?? i} className={i === 0 ? "sheet-selected" : ""}>
                      <td className="font-mono text-[11px] text-gray-700">{String(receiptNo)}</td>
                      <td className="font-mono text-gray-700">{String(phone)}</td>
                      <td className="text-right text-gray-700">{formatNumber(amount)}</td>
                      <td className="text-right text-gray-700">{formatNumber(remain)}</td>
                      <td className="text-gray-700">{String(event)}</td>
                      <td className="text-gray-700">{String(status)}</td>
                      <td className="text-gray-600">{formatDate(String(createdAt))}</td>
                      <td className="text-gray-700">{String(ym)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-700">
                      총 건수: {loading ? "…" : totalCount.toLocaleString()}
                    </div>
                    {!loading && items.length > 0 && totalPages > 1 && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="h-8"
                        >
                          이전
                        </Button>
                        <span className="text-xs text-gray-700">
                          {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="h-8"
                        >
                          다음
                        </Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {chargeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setChargeOpen(false);
          }}
        >
          <div className="w-full max-w-md sheet-wrap bg-white">
            <div className="px-4 py-3 border-b border-[var(--sheet-border)] bg-[var(--sheet-header-bg)] flex items-center justify-between">
              <div className="font-semibold text-sm text-gray-800">금액충전</div>
              <button className="h-7 px-2 text-sm sheet-btn" onClick={() => setChargeOpen(false)}>
                닫기
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[80vh] overflow-auto">
              <div className="text-xs text-gray-600">
                - 1원 이상 정수만 가능
                <br />- 100만원 초과는 충전 불가
                {budgetUpdatedAt ? (
                  <>
                    <br />- 잔액 업데이트: {formatDate(String(budgetUpdatedAt))}
                  </>
                ) : null}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-700">충전금액</div>
                <input
                  value={chargeAmountText}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    const formatted = digits ? Number(digits).toLocaleString() : "";
                    setChargeAmountText(formatted);
                    setChargeError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCharge();
                  }}
                  placeholder="예: 10000"
                  className="h-9 w-full px-2 text-sm border border-[var(--sheet-border)] bg-white"
                  inputMode="numeric"
                />
                {!chargeAmountText.trim() ? (
                  <div className="text-xs text-gray-500">
                    최대 {MAX_CHARGE_AMOUNT.toLocaleString()}원까지 입력 가능합니다.
                  </div>
                ) : !chargeAmountValid ? (
                  <div className="text-xs text-red-600">
                    1원~{MAX_CHARGE_AMOUNT.toLocaleString()}원 사이의 정수만 입력할 수 있습니다.
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">
                    입력 금액: <span className="font-semibold">{formatNumber(chargeAmount)}원</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-700">메모 (선택)</div>
                <input
                  value={chargeMemo}
                  onChange={(e) => setChargeMemo(e.target.value)}
                  placeholder="예: 3월 프로모션 충전"
                  className="h-9 w-full px-2 text-sm border border-[var(--sheet-border)] bg-white"
                />
              </div>

              {chargeError ? <div className="text-xs text-red-600">{chargeError}</div> : null}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button className="h-9 px-4 text-sm sheet-btn" onClick={() => setChargeOpen(false)}>
                  취소
                </button>
                <button
                  className="h-9 px-4 text-sm sheet-btn sheet-btn-primary disabled:opacity-50"
                  disabled={!chargeAmountValid || chargeSubmitting}
                  onClick={submitCharge}
                >
                  {chargeSubmitting ? "처리 중…" : "충전"}
                </button>
              </div>

              <div className="pt-3 border-t border-[var(--sheet-border)]">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700">충전/차감 로그 (최근 20건)</div>
                  <button
                    className="h-7 px-2 text-xs sheet-btn"
                    onClick={() => loadBudgetHistory()}
                    disabled={historyLoading}
                  >
                    {historyLoading ? "로딩..." : "새로고침"}
                  </button>
                </div>
                {historyError ? (
                  <div className="mt-2 text-xs text-red-600">
                    로그 조회 실패: {historyError}
                    <div className="text-[11px] text-gray-600 mt-1">
                      (백엔드에 로그 조회 API가 아직 없으면 `GET /admin/coupons/budget/history`를 추가해야 합니다.)
                    </div>
                  </div>
                ) : null}
                <div className="mt-2 max-h-56 overflow-auto border border-[var(--sheet-border)]">
                  <table className="sheet-table text-[11px]">
                    <thead className="sticky">
                      <tr>
                        <th className="w-[70px]">유형</th>
                        <th className="w-[90px] text-right">금액</th>
                        <th className="w-[90px] text-right">반영일</th>
                        <th>메모</th>
                        <th className="w-[150px]">시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-500">
                            로딩 중...
                          </td>
                        </tr>
                      ) : historyItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-left text-gray-600">
                            로그가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        historyItems.map((h, i) => {
                          const type = h.type ?? h.action ?? "—";
                          const amount = h.amount ?? h.delta ?? 0;
                          const after = h.balance ?? h.afterBalance ?? h.after ?? 0;
                          const memo = h.memo ?? h.note ?? h.reason ?? "";
                          const createdAt = h.createdAt ?? h.occurredAt ?? h.time ?? h.date ?? "—";
                          return (
                            <tr key={h.id ?? i}>
                              <td className="text-gray-700">{String(type)}</td>
                              <td className="text-right text-gray-700">{formatNumber(amount)}</td>
                              <td className="text-right text-gray-700">{formatNumber(after)}</td>
                              <td className="text-gray-700">{String(memo)}</td>
                              <td className="text-gray-600">{formatDate(String(createdAt))}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

