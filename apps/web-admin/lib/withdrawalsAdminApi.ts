import { adminFetch, readAdminResponseBody, getAdminApiFailureMessage } from "./api";

export type WithdrawalStatus = "pending" | "processing" | "completed" | "rejected";

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "신청",
  processing: "처리중",
  completed: "완료",
  rejected: "거절",
};

export type WithdrawalUserSummary = {
  id?: string;
  phone?: string;
  name?: string;
};

export type WithdrawalItem = {
  id: string;
  status: WithdrawalStatus;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  requestedAt: string;
  processedAt: string;
  userId?: string;
  user?: WithdrawalUserSummary;
};

export type WithdrawalsListResult = {
  items: WithdrawalItem[];
  total: number;
  page: number;
  limit: number;
};

function normalizeStatus(v: unknown): WithdrawalStatus {
  const s = String(v ?? "").toLowerCase();
  if (s === "pending" || s === "processing" || s === "completed" || s === "rejected") return s;
  return "pending";
}

function parseUser(raw: unknown): WithdrawalUserSummary | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const id = u.id != null ? String(u.id) : undefined;
  const phone =
    u.phone != null ? String(u.phone) : u.phoneNumber != null ? String(u.phoneNumber) : undefined;
  const name = u.name != null ? String(u.name) : undefined;
  if (!id && !phone && !name) return undefined;
  return { id, phone, name };
}

function parseItem(o: Record<string, unknown>): WithdrawalItem {
  return {
    id: String(o.id ?? ""),
    status: normalizeStatus(o.status),
    amount: Number(o.amount ?? 0) || 0,
    bankName: String(o.bankName ?? o.bank_name ?? o.bank ?? ""),
    accountNumber: String(o.accountNumber ?? o.account_number ?? o.account ?? ""),
    accountHolder: String(o.accountHolder ?? o.account_holder ?? o.holderName ?? ""),
    requestedAt: String(o.requestedAt ?? o.requested_at ?? o.createdAt ?? o.created_at ?? ""),
    processedAt: String(o.processedAt ?? o.processed_at ?? ""),
    userId: o.userId != null ? String(o.userId) : o.user_id != null ? String(o.user_id) : undefined,
    user: parseUser(o.user),
  };
}

export async function fetchWithdrawalsList(
  getAccessToken: () => string | null,
  params: { page: number; limit: number; status?: WithdrawalStatus | "" }
): Promise<{ ok: true; data: WithdrawalsListResult } | { ok: false; message: string }> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(1, params.page)));
  const lim = Math.min(100, Math.max(1, params.limit));
  q.set("limit", String(lim));
  if (params.status) q.set("status", params.status);

  const res = await adminFetch(`/admin/withdrawals?${q}`, { method: "GET", getAccessToken });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const itemsRaw = data.items ?? data.withdrawals ?? data.list;
  const items = Array.isArray(itemsRaw)
    ? (itemsRaw as Record<string, unknown>[]).map((row) => parseItem(row))
    : [];
  return {
    ok: true,
    data: {
      items,
      total: Number(data.total ?? items.length) || 0,
      page: Number(data.page ?? params.page) || params.page,
      limit: Number(data.limit ?? lim) || lim,
    },
  };
}

export async function approveWithdrawal(
  getAccessToken: () => string | null,
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await adminFetch(`/admin/withdrawals/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
    getAccessToken,
    body: JSON.stringify({}),
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  return { ok: true };
}

export async function completeWithdrawal(
  getAccessToken: () => string | null,
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await adminFetch(`/admin/withdrawals/${encodeURIComponent(id)}/complete`, {
    method: "PATCH",
    getAccessToken,
    body: JSON.stringify({}),
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  return { ok: true };
}

export async function rejectWithdrawal(
  getAccessToken: () => string | null,
  id: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await adminFetch(`/admin/withdrawals/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    getAccessToken,
    body: JSON.stringify({}),
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  return { ok: true };
}
