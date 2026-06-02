import { adminFetch, getAdminApiFailureMessage, readAdminResponseBody } from "@/lib/api";

export type GifticonProduct = {
  id: string;
  name: string;
  mileagePrice: number;
  imageUrl?: string;
};

function coerceNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function pickString(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function productFromApi(item: unknown): GifticonProduct | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const id = pickString(o, "id", "productId", "code");
  const name = pickString(o, "name", "title");
  if (!id || !name) return null;
  const imageUrl = pickString(o, "imageUrl", "coverImageUrl", "thumbnailUrl", "thumbUrl");
  return {
    id,
    name,
    mileagePrice: coerceNumber(o.mileagePrice ?? o.price ?? o.pointPrice ?? 0, 0),
    ...(imageUrl ? { imageUrl } : {}),
  };
}

export function listFromApi(json: unknown): GifticonProduct[] {
  if (!json || typeof json !== "object") return [];
  const root = json as Record<string, unknown>;
  const data = root.data ?? root.items ?? root.list ?? root;
  const arr = Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];
  const out: GifticonProduct[] = [];
  for (const it of arr) {
    const p = productFromApi(it);
    if (p) out.push(p);
  }
  return out;
}

export async function fetchGifticonProducts(getAccessToken: () => string | null): Promise<GifticonProduct[]> {
  const res = await adminFetch("/gifticon/products", { method: "GET", getAccessToken });
  const { json } = await readAdminResponseBody(res);
  if (!res.ok) {
    const { rawText } = await readAdminResponseBody(res);
    throw new Error(getAdminApiFailureMessage(res, json, rawText));
  }
  return listFromApi(json);
}

async function assertOk(res: Response): Promise<void> {
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    throw new Error(getAdminApiFailureMessage(res, json, rawText));
  }
}

export async function createGifticonProduct(
  getAccessToken: () => string | null,
  payload: GifticonProduct
): Promise<void> {
  const res = await adminFetch("/admin/gifticon/products", {
    method: "POST",
    getAccessToken,
    body: JSON.stringify(payload),
  });
  await assertOk(res);
}

export async function updateGifticonProduct(
  getAccessToken: () => string | null,
  id: string,
  patch: Partial<GifticonProduct>
): Promise<void> {
  const res = await adminFetch(`/admin/gifticon/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    getAccessToken,
    body: JSON.stringify(patch),
  });
  await assertOk(res);
}

export async function deleteGifticonProduct(getAccessToken: () => string | null, id: string): Promise<void> {
  const res = await adminFetch(`/admin/gifticon/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    getAccessToken,
  });
  await assertOk(res);
}

