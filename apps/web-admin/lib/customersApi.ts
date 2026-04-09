/** 고객 API — Customer + 앱 회원 통합 */

import type { CustomerListItem } from "./types";
import { hasAdminWebSession } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type { CustomerListItem };

/** API 응답 항목을 CustomerListItem 형식으로 정규화 */
function normalizeListItem(it: Record<string, unknown>, forceSource?: "customer" | "app_user"): CustomerListItem {
  const source = forceSource ?? (it.source === "app_user" ? "app_user" : "customer");
  return {
    id: String(it.id ?? ""),
    source: source as "customer" | "app_user",
    no: it.no != null ? Number(it.no) : null,
    registeredAt: String(it.registeredAt ?? it.createdAt ?? ""),
    category: String(it.category ?? (source === "app_user" ? "앱회원" : "")),
    name: String(it.name ?? it.nickname ?? ""),
    phone: it.phone != null ? String(it.phone) : undefined,
    mobile: it.mobile != null ? String(it.mobile) : (it.phone ? String(it.phone) : undefined),
    address: it.address != null ? String(it.address) : undefined,
    addressDetail: it.addressDetail != null ? String(it.addressDetail) : undefined,
    info: it.info != null ? String(it.info) : undefined,
    dmSend: it.dmSend === true ? true : it.dmSend === false ? false : undefined,
    smsSend: it.smsSend === true ? true : it.smsSend === false ? false : undefined,
    otherPhone: it.otherPhone != null ? String(it.otherPhone) : undefined,
    email: it.email != null ? String(it.email) : undefined,
    mileageBalance: it.mileageBalance != null ? Number(it.mileageBalance) : undefined,
    rideCount: it.rideCount != null ? Number(it.rideCount) : undefined,
    referrer1Count:
      it.referrer1Count != null
        ? Number(it.referrer1Count)
        : it.referrerCount != null
          ? Number(it.referrerCount)
          : it.recommendCount != null
            ? Number(it.recommendCount)
            : undefined,
    referrer2Count: it.referrer2Count != null ? Number(it.referrer2Count) : undefined,
  };
}

/** 앱 회원 목록 조회 (플루터 가입 유저) - GET /admin/users, 응답 data.items */
async function fetchAppUsers(getAccessToken: () => string | null): Promise<CustomerListItem[]> {
  if (!API_BASE || !hasAdminWebSession()) return [];
  try {
    const tok = getAccessToken();
    const res = await fetch(`${API_BASE}/admin/users`, {
      credentials: "include",
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.data?.items ?? data.data ?? data.items ?? data.users ?? data;
    const arr = Array.isArray(raw) ? raw : [];
    return arr.map((it: Record<string, unknown>) => normalizeListItem(it, "app_user"));
  } catch {
    return [];
  }
}

export async function fetchCustomersWithAppUsers(
  getAccessToken: () => string | null,
  opts?: { year?: number; month?: number }
): Promise<CustomerListItem[] | null> {
  if (!API_BASE || !hasAdminWebSession()) return null;
  let list: CustomerListItem[] = [];

  try {
    // 1) 통합 API 시도: GET /admin/customers?includeAppUsers=1
    const params = new URLSearchParams({ includeAppUsers: "1" });
    if (opts?.year != null) params.set("year", String(opts.year));
    if (opts?.month != null) params.set("month", String(opts.month));

    const tok = getAccessToken();
    const res = await fetch(`${API_BASE}/admin/customers?${params}`, {
      credentials: "include",
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      let items: Record<string, unknown>[] = [];
      const d = data.data ?? data;
      if (Array.isArray(d?.items)) items = d.items;
      else if (Array.isArray(d?.customers) || Array.isArray(d?.appUsers) || Array.isArray(d?.users)) {
        const cust = (d.customers ?? []).map((c: Record<string, unknown>) => ({ ...c, source: "customer" }));
        const appU = (d.appUsers ?? d.users ?? []).map((u: Record<string, unknown>) => ({ ...u, source: "app_user" }));
        items = [...cust, ...appU];
      } else if (Array.isArray(d)) items = d;
      else if (Array.isArray(data.items)) items = data.items;
      list = items.map((it) => normalizeListItem(it));
    }
  } catch {
    // 통합 API 실패 시 아래에서 앱 회원만이라도 조회
  }

  // 2) 앱 회원이 없으면 /admin/users 별도 조회 후 병합 (플루터 가입 유저)
  const hasAppUsers = list.some((c) => c.source === "app_user");
  if (!hasAppUsers) {
    const appUsers = await fetchAppUsers(getAccessToken);
    if (appUsers.length > 0) {
      const custIds = new Set(list.map((c) => c.id));
      const extra = appUsers.filter((u) => !custIds.has(u.id));
      list = [...list, ...extra];
    }
  }

  return list;
}

export async function fetchCustomerById(
  id: string,
  getAccessToken: () => string | null
): Promise<CustomerListItem | null> {
  if (!API_BASE || !hasAdminWebSession()) return null;
  try {
    const tok = getAccessToken();
    const res = await fetch(`${API_BASE}/admin/customers/${id}`, {
      credentials: "include",
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? data;
  } catch {
    return null;
  }
}

export async function fetchCustomerRides(
  id: string,
  getAccessToken: () => string | null
): Promise<any[] | null> {
  if (!API_BASE || !hasAdminWebSession()) return null;
  try {
    const tok = getAccessToken();
    const res = await fetch(`${API_BASE}/admin/customers/${id}/rides`, {
      credentials: "include",
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.data?.items ?? data.data ?? data.items ?? data;
    return Array.isArray(items) ? items : [];
  } catch {
    return null;
  }
}

export function isAppUser(item: CustomerListItem): boolean {
  return item.source === "app_user";
}
