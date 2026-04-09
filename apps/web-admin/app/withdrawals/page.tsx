"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  fetchWithdrawalsList,
  approveWithdrawal,
  completeWithdrawal,
  rejectWithdrawal,
  type WithdrawalItem,
  type WithdrawalStatus,
  WITHDRAWAL_STATUS_LABEL,
} from "@/lib/withdrawalsAdminApi";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatDateTime(s: string): string {
  if (!s) return "-";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return s;
  }
}

function formatAmount(n: number): string {
  return n.toLocaleString("ko-KR") + "\uC6D0";
}

function statusBadgeVariant(status: WithdrawalStatus): "warning" | "default" | "success" | "destructive" {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
      return "default";
    case "completed":
      return "success";
    case "rejected":
      return "destructive";
  }
}

type ActionState = { loading: boolean; error: string | null };

export default function WithdrawalsPage() {
  const { getAccessToken } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "">("");
  const [result, setResult] = useState<{
    items: WithdrawalItem[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionState, setActionState] = useState<Record<string, ActionState>>({});

  const load = useCallback(async () => {
    if (!API_BASE || !hasAdminWebSession()) {
      setResult({ items: [], total: 0, page: 1, limit });
      setLoading(false);
      setError(!API_BASE ? "API \uC8FC\uC18C\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." : "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchWithdrawalsList(getAccessToken, { page, limit, status: statusFilter });
    if (!res.ok) {
      setResult(null);
      setError(res.message);
    } else {
      setResult(res.data);
    }
    setLoading(false);
  }, [getAccessToken, page, limit, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const setItemAction = (id: string, state: ActionState) =>
    setActionState((prev) => ({ ...prev, [id]: state }));

  const handleApprove = async (item: WithdrawalItem) => {
    if (
      !confirm(
        `[${item.user?.name ?? item.userId ?? item.id}] \uCD9C\uAE08 \uC2E0\uCCAD\uC744 \uC2B9\uC778(\uCC98\uB9AC\uC911)\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`,
      )
    )
      return;
    setItemAction(item.id, { loading: true, error: null });
    const res = await approveWithdrawal(getAccessToken, item.id);
    if (!res.ok) {
      setItemAction(item.id, { loading: false, error: res.message });
    } else {
      setItemAction(item.id, { loading: false, error: null });
      load();
    }
  };

  const handleComplete = async (item: WithdrawalItem) => {
    if (!confirm(`[${item.user?.name ?? item.userId ?? item.id}] \uCD9C\uAE08\uC744 \uC644\uB8CC \uCC98\uB9AC\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
    setItemAction(item.id, { loading: true, error: null });
    const res = await completeWithdrawal(getAccessToken, item.id);
    if (!res.ok) {
      setItemAction(item.id, { loading: false, error: res.message });
    } else {
      setItemAction(item.id, { loading: false, error: null });
      load();
    }
  };

  const handleReject = async (item: WithdrawalItem) => {
    if (
      !confirm(
        `[${item.user?.name ?? item.userId ?? item.id}] ??? ?????????\n?? ??? ??? ? ????.`,
      )
    )
      return;
    setItemAction(item.id, { loading: true, error: null });
    const res = await rejectWithdrawal(getAccessToken, item.id);
    if (!res.ok) {
      setItemAction(item.id, { loading: false, error: res.message });
    } else {
      setItemAction(item.id, { loading: false, error: null });
      load();
    }
  };

  const total = result?.total ?? 0;
  const currentLimit = result?.limit ?? limit;
  const totalPages = Math.max(1, Math.ceil(total / currentLimit) || 1);
  const items = result?.items ?? [];

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">?? ??</h1>
          <p className="text-gray-500 text-sm mt-1">?? ?? ?? ?? ? ??</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
        <span className="font-medium text-gray-700">?? ??:</span>
        <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-medium">??</span>
        <span>?</span>
        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">???</span>
        <span>?</span>
        <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium">??</span>
        <span className="ml-3 text-gray-400">|</span>
        <span className="ml-3">??</span>
        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-medium">??</span>
        <span className="ml-1">(?????? ???? ??)</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter((e.target.value || "") as WithdrawalStatus | "");
          }}
        >
          <option value="">?? ??</option>
          <option value="pending">{WITHDRAWAL_STATUS_LABEL.pending}</option>
          <option value="processing">{WITHDRAWAL_STATUS_LABEL.processing}</option>
          <option value="completed">{WITHDRAWAL_STATUS_LABEL.completed}</option>
          <option value="rejected">{WITHDRAWAL_STATUS_LABEL.rejected}</option>
        </Select>
        <Select
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(Number(e.target.value));
          }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}??
            </option>
          ))}
        </Select>
        <Button type="button" onClick={() => load()} disabled={loading}>
          ????
        </Button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-800 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-[var(--sheet-header-bg)] flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">?? ?? ??</h2>
          {!loading && result != null && (
            <span className="text-xs text-gray-500">
              ? {total.toLocaleString()}? ? {result.page}/{totalPages}???
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3.5 text-left w-40">????</th>
                <th className="px-4 py-3.5 text-left w-24">??</th>
                <th className="px-4 py-3.5 text-left w-32">??</th>
                <th className="px-4 py-3.5 text-right w-28">??</th>
                <th className="px-4 py-3.5 text-left w-24">??</th>
                <th className="px-4 py-3.5 text-left w-36">????</th>
                <th className="px-4 py-3.5 text-left w-24">???</th>
                <th className="px-4 py-3.5 text-left w-36">????</th>
                <th className="px-4 py-3.5 text-right w-52">??</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    ???? ??
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    ?? ??? ????.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const act = actionState[row.id];
                  const busy = !!act?.loading;
                  return (
                    <tr key={row.id} className="align-middle">
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap text-xs">
                        {formatDateTime(row.requestedAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusBadgeVariant(row.status)}>{WITHDRAWAL_STATUS_LABEL[row.status]}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-gray-800 text-xs">
                        <div>{row.user?.name ?? "-"}</div>
                        <div className="text-gray-400">{row.user?.phone ?? ""}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                        {formatAmount(row.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 text-xs">{row.bankName || "-"}</td>
                      <td className="px-4 py-3.5 text-gray-700 text-xs font-mono">
                        {row.accountNumber || "-"}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 text-xs">{row.accountHolder || "-"}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                        {formatDateTime(row.processedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {act?.error && (
                            <span className="text-red-600 text-xs mr-1">{act.error}</span>
                          )}
                          {row.status === "pending" && (
                            <>
                              <Button size="sm" disabled={busy} onClick={() => handleApprove(row)}>
                                ??
                              </Button>
                              <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleReject(row)}>
                                ??
                              </Button>
                            </>
                          )}
                          {row.status === "processing" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={busy}
                                onClick={() => handleComplete(row)}
                              >
                                ?? ??
                              </Button>
                              <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleReject(row)}>
                                ??
                              </Button>
                            </>
                          )}
                          {(row.status === "completed" || row.status === "rejected") && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                          {busy && <span className="text-xs text-gray-400 ml-1">?? ?</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && result && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            ??
          </button>
          <span className="text-sm text-gray-600 px-2">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            ??
          </button>
        </div>
      )}
    </div>
  );
}
