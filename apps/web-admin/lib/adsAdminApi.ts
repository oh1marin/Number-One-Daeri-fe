import { readAdminResponseBody } from "./api";

/** GET 단일 객체( id 없음 )와의 호환 */
export const LEGACY_SINGLE_ID = "__legacy__";

export type AdminAdItem = {
  id: string;
  title?: string;
  imageUrl: string;
  content: string;
  linkUrl: string;
  shareText: string;
  updatedAt?: string | null;
};

function mapRawToAd(raw: Record<string, unknown>, fallbackId: string): AdminAdItem {
  return {
    id: String(raw.id ?? raw._id ?? fallbackId),
    title: raw.title != null ? String(raw.title) : undefined,
    imageUrl: String(raw.imageUrl ?? ""),
    content: String(raw.content ?? ""),
    linkUrl: String(raw.linkUrl ?? ""),
    shareText: String(raw.shareText ?? ""),
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  };
}

export function normalizeAdsFromResponse(json: unknown): AdminAdItem[] {
  const root = json as Record<string, unknown> | null | undefined;
  const data =
    (root?.data as Record<string, unknown> | undefined)?.items ??
    (root?.data as Record<string, unknown> | undefined)?.ads ??
    root?.data ??
    root?.items ??
    root?.ads ??
    json;

  if (Array.isArray(data)) {
    return data.map((item, i) => mapRawToAd(item as Record<string, unknown>, String(i)));
  }

  if (data && typeof data === "object" && ("imageUrl" in data || "content" in data)) {
    const d = data as Record<string, unknown>;
    const id = d.id != null || d._id != null ? String(d.id ?? d._id) : LEGACY_SINGLE_ID;
    return [mapRawToAd(d, id)];
  }

  return [];
}

/** POST/DELETE/:id 가 없을 때 등 — 전체 목록 PUT 으로 우회 시도 */
export function shouldAttemptAdsBulkFallback(res: Response): boolean {
  return res.status === 404 || res.status === 405 || res.status === 501;
}

export function isAdsSaveResponseOk(res: Response, json: unknown): boolean {
  if (!res.ok) return false;
  if (res.status === 204) return true;
  if (json && typeof json === "object" && "success" in json) {
    return (json as { success?: boolean }).success !== false;
  }
  return true;
}

function shouldSendId(id: string): boolean {
  if (id === LEGACY_SINGLE_ID) return false;
  if (/^\d+$/.test(id)) return false;
  return id.length >= 4;
}

export function toBulkWireItem(ad: AdminAdItem): Record<string, unknown> {
  const o: Record<string, unknown> = {
    imageUrl: ad.imageUrl,
    content: ad.content ?? "",
    linkUrl: ad.linkUrl ?? "",
    shareText: ad.shareText ?? "",
  };
  const title = ad.title?.trim();
  if (title) o.title = title;
  if (shouldSendId(ad.id)) o.id = ad.id;
  return o;
}

type ApiFn = (path: string, opts?: RequestInit) => Promise<Response>;

/**
 * 다건 저장 폴백: PUT /admin/ads
 * 1) { items: [...] } — 권장
 * 2) { ads: [...] } — 스키마에 따라
 * 3) 레거시 단일 1건이면 평탄 객체 한 번 더 시도
 */
export async function putAdminAdsBulkWithFallback(
  api: ApiFn,
  list: AdminAdItem[]
): Promise<{ res: Response; json: unknown; rawText: string }> {
  const wires = list.map(toBulkWireItem);

  const attempts: Array<() => Promise<{ res: Response; json: unknown; rawText: string }>> = [
    async () => {
      const res = await api("/admin/ads", {
        method: "PUT",
        body: JSON.stringify({ items: wires }),
      });
      const { json, rawText } = await readAdminResponseBody(res);
      return { res, json, rawText };
    },
    async () => {
      const res = await api("/admin/ads", {
        method: "PUT",
        body: JSON.stringify({ ads: wires }),
      });
      const { json, rawText } = await readAdminResponseBody(res);
      return { res, json, rawText };
    },
  ];

  if (list.length === 1) {
    attempts.push(async () => {
      const res = await api("/admin/ads", {
        method: "PUT",
        body: JSON.stringify(wires[0]),
      });
      const { json, rawText } = await readAdminResponseBody(res);
      return { res, json, rawText };
    });
  }

  let last: { res: Response; json: unknown; rawText: string } | null = null;
  for (const run of attempts) {
    const one = await run();
    last = one;
    if (isAdsSaveResponseOk(one.res, one.json)) return one;
    if (one.res.status === 401 || one.res.status === 403) return one;
  }
  return last!;
}
