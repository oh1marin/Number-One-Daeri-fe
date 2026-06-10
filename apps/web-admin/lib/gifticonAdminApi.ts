import { adminFetch, getAdminApiFailureMessage, readAdminResponseBody } from "@/lib/api";

export type GifticonProduct = {
  id: string;
  name: string;
  mileagePrice: number;
  imageUrl?: string;
};

export type GiftishowBrand = {
  brandCode: string;
  brandName: string;
  categoryName?: string;
  imageUrl?: string;
};

export type GiftishowCatalogItem = {
  id: string;
  goodsCode: string;
  name: string;
  brandName?: string;
  brandCode?: string;
  price: number;
  mileagePrice?: number;
  imageUrl?: string;
  category?: string;
  available?: boolean;
  alreadyRegistered?: boolean;
};

export type GiftishowCatalogResult = {
  items: GiftishowCatalogItem[];
  page: number;
  size: number;
  total?: number;
  hasMore: boolean;
  mode: "page" | "search";
  hint?: string;
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
  // 앱 라우트(/gifticon/products)는 유저 인증(req.user)을 요구할 수 있어 관리자에서는 401이 날 수 있음.
  // 관리자 관리 화면은 admin 엔드포인트를 사용.
  const res = await adminFetch("/admin/gifticon/products", { method: "GET", getAccessToken });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
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

function catalogItemFromApi(item: unknown): GiftishowCatalogItem | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const goodsCode = pickString(o, "goodsCode", "id", "productId");
  const name = pickString(o, "name", "goodsName", "title");
  if (!goodsCode || !name) return null;
  const price = coerceNumber(o.price ?? o.realPrice ?? o.mileagePrice, 0);
  const imageUrl = pickString(o, "imageUrl", "goodsImgS", "mmsGoodsImg", "coverImageUrl");
  return {
    id: goodsCode,
    goodsCode,
    name,
    brandName: pickString(o, "brandName", "brandNm") || undefined,
    brandCode: pickString(o, "brandCode") || undefined,
    price,
    mileagePrice: coerceNumber(o.mileagePrice ?? o.price, price),
    ...(imageUrl ? { imageUrl } : {}),
    category: pickString(o, "category", "goodsTypeDtlNm") || undefined,
    available: o.available !== false,
    alreadyRegistered: o.alreadyRegistered === true,
  };
}

function catalogFromApi(json: unknown): GiftishowCatalogResult {
  const empty: GiftishowCatalogResult = {
    items: [],
    page: 1,
    size: 20,
    hasMore: false,
    mode: "page",
  };
  if (!json || typeof json !== "object") return empty;
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const arr = Array.isArray(data.items) ? data.items : [];
  const items: GiftishowCatalogItem[] = [];
  for (const it of arr) {
    const p = catalogItemFromApi(it);
    if (p) items.push(p);
  }
  return {
    items,
    page: coerceNumber(data.page, 1),
    size: coerceNumber(data.size, 20),
    total: typeof data.total === "number" ? data.total : undefined,
    hasMore: data.hasMore === true,
    mode: data.mode === "search" ? "search" : "page",
    hint: typeof data.hint === "string" ? data.hint : undefined,
  };
}

export async function fetchGiftishowBrands(
  getAccessToken: () => string | null
): Promise<GiftishowBrand[]> {
  const res = await adminFetch("/admin/gifticon/catalog/brands?size=200", {
    method: "GET",
    getAccessToken,
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    throw new Error(getAdminApiFailureMessage(res, json, rawText));
  }
  const data = (json as Record<string, unknown>)?.data ?? json;
  const arr = Array.isArray((data as Record<string, unknown>)?.items)
    ? ((data as Record<string, unknown>).items as unknown[])
    : [];
  const out: GiftishowBrand[] = [];
  for (const it of arr) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    const brandCode = pickString(o, "brandCode");
    const brandName = pickString(o, "brandName", "brandNm");
    if (!brandCode || !brandName) continue;
    const imageUrl = pickString(o, "imageUrl", "brandIConImg", "mmsThumImg");
    out.push({
      brandCode,
      brandName,
      categoryName: pickString(o, "categoryName", "category1Name") || undefined,
      ...(imageUrl ? { imageUrl } : {}),
    });
  }
  return out.sort((a, b) => a.brandName.localeCompare(b.brandName, "ko"));
}

export async function fetchGiftishowCatalog(
  getAccessToken: () => string | null,
  opts: { page?: number; size?: number; q?: string; brandCode?: string }
): Promise<GiftishowCatalogResult> {
  const params = new URLSearchParams();
  params.set("page", String(opts.page ?? 1));
  params.set("size", String(opts.size ?? 20));
  const q = String(opts.q ?? "").trim();
  if (q) params.set("q", q);
  if (opts.brandCode) params.set("brandCode", opts.brandCode);

  const res = await adminFetch(`/admin/gifticon/catalog/goods?${params.toString()}`, {
    method: "GET",
    getAccessToken,
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    throw new Error(getAdminApiFailureMessage(res, json, rawText));
  }
  return catalogFromApi(json);
}

export async function importGifticonFromCatalog(
  getAccessToken: () => string | null,
  goodsCode: string,
  mileagePrice?: number
): Promise<GifticonProduct> {
  const res = await adminFetch("/admin/gifticon/products/import", {
    method: "POST",
    getAccessToken,
    body: JSON.stringify({
      goodsCode,
      ...(mileagePrice && mileagePrice > 0 ? { mileagePrice } : {}),
    }),
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    throw new Error(getAdminApiFailureMessage(res, json, rawText));
  }
  const p = productFromApi((json as Record<string, unknown>)?.data ?? json);
  if (!p) throw new Error("등록 응답을 해석하지 못했습니다.");
  return p;
}

export function catalogItemToDraft(item: GiftishowCatalogItem): GifticonProduct {
  const label = item.brandName ? `${item.brandName} ${item.name}` : item.name;
  return {
    id: item.goodsCode,
    name: label,
    mileagePrice: item.mileagePrice ?? item.price,
    ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
  };
}

