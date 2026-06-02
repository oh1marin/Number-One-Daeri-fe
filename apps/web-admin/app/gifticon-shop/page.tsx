"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  type GifticonProduct,
  createGifticonProduct,
  deleteGifticonProduct,
  fetchGifticonProducts,
  updateGifticonProduct,
} from "@/lib/gifticonAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AdminImageUpload } from "@/components/AdminImageUpload";

type Draft = {
  id: string;
  name: string;
  mileagePrice: string;
  imageUrl: string;
};

function toDraft(p?: GifticonProduct): Draft {
  return {
    id: p?.id ?? "",
    name: p?.name ?? "",
    mileagePrice: String(p?.mileagePrice ?? ""),
    imageUrl: p?.imageUrl ?? "",
  };
}

function normalizeMoneyString(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/[^\d]/g, "");
  return cleaned;
}

function draftToPayload(d: Draft): GifticonProduct {
  const id = d.id.trim();
  const name = d.name.trim();
  const price = Number(normalizeMoneyString(d.mileagePrice));
  if (!id) throw new Error("상품 ID가 필요합니다.");
  if (!name) throw new Error("상품명이 필요합니다.");
  if (!Number.isFinite(price) || price <= 0) throw new Error("마일리지 가격은 1 이상 숫자여야 합니다.");
  return {
    id,
    name,
    mileagePrice: price,
    ...(d.imageUrl.trim() ? { imageUrl: d.imageUrl.trim() } : {}),
  };
}

export default function GifticonShopPage() {
  const { getAccessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const [products, setProducts] = useState<GifticonProduct[]>([]);
  const [q, setQ] = useState("");

  const [mode, setMode] = useState<"none" | "create" | "edit">("none");
  const [draft, setDraft] = useState<Draft>(() => toDraft());
  const [selectedId, setSelectedId] = useState<string>("");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const list = await fetchGifticonProducts(getAccessToken);
      setProducts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.id.toLowerCase().includes(term) || p.name.toLowerCase().includes(term));
  }, [products, q]);

  const openCreate = () => {
    setMode("create");
    setSelectedId("");
    setDraft(toDraft());
    setError("");
  };

  const openEdit = (p: GifticonProduct) => {
    setMode("edit");
    setSelectedId(p.id);
    setDraft(toDraft(p));
    setError("");
  };

  const closePanel = () => {
    setMode("none");
    setSelectedId("");
    setDraft(toDraft());
  };

  const save = async () => {
    setError("");
    const payload = draftToPayload({
      ...draft,
      mileagePrice: normalizeMoneyString(draft.mileagePrice),
    });
    setBusyId(payload.id);
    try {
      if (mode === "create") {
        await createGifticonProduct(getAccessToken, payload);
      } else if (mode === "edit") {
        await updateGifticonProduct(getAccessToken, selectedId || payload.id, payload);
      }
      await refresh();
      closePanel();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "저장에 실패했습니다.";
      setError(
        `${msg}\n\n백엔드가 아래 엔드포인트를 지원해야 합니다:\n- POST /api/v1/admin/gifticon/products\n- PATCH /api/v1/admin/gifticon/products/:id\n(목록은 GET /api/v1/gifticon/products)`
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(`정말 삭제할까요?\n\n- id: ${id}`)) return;
    setError("");
    setBusyId(id);
    try {
      await deleteGifticonProduct(getAccessToken, id);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "삭제에 실패했습니다.";
      setError(`${msg}\n\n백엔드가 DELETE /api/v1/admin/gifticon/products/:id 를 지원해야 합니다.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">기프티콘 상점</h1>
          <p className="text-sm text-gray-500 mt-1">
            여기서 등록한 상품/이미지는 앱의 <span className="font-medium">기프티콘 상점</span>에서{" "}
            <span className="font-medium">GET /gifticon/products</span> 응답의 <span className="font-medium">imageUrl</span>
            로 노출됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            새로고침
          </Button>
          <Button onClick={openCreate}>상품 추가</Button>
        </div>
      </div>

      {error ? (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="상품 ID 또는 상품명 검색"
            className="h-10 max-w-sm"
          />
          <p className="text-xs text-gray-500">
            총 <span className="font-medium text-gray-700">{filtered.length}</span>개
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <Card className="p-6">
            <p className="text-sm text-gray-500">로딩 중…</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-gray-500">상품이 없습니다.</p>
          </Card>
        ) : (
          filtered.map((p) => (
            <Card key={p.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-400">NO IMG</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 break-all">{p.id}</p>
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {p.mileagePrice.toLocaleString()} <span className="text-xs text-gray-500">마일리지</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)} disabled={busyId === p.id}>
                  수정
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(p.id)} disabled={busyId === p.id}>
                  삭제
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {mode !== "none" ? (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-end md:items-center justify-center p-3">
          <Card className="w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {mode === "create" ? "상품 추가" : "상품 수정"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  앱에서 쓰는 필드: <span className="font-medium">id, name, mileagePrice, imageUrl</span>
                </p>
              </div>
              <Button variant="ghost" onClick={closePanel} disabled={Boolean(busyId)}>
                닫기
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs text-gray-600 font-medium">상품 ID</p>
                <Input
                  value={draft.id}
                  onChange={(e) => setDraft((s) => ({ ...s, id: e.target.value }))}
                  placeholder="예: mega_americano_ice"
                  disabled={mode === "edit" || Boolean(busyId)}
                />
                <p className="text-[11px] text-gray-400">앱에서 식별자로 사용됩니다. 생성 후 변경 불가 권장.</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-600 font-medium">마일리지 가격</p>
                <Input
                  value={draft.mileagePrice}
                  onChange={(e) => setDraft((s) => ({ ...s, mileagePrice: e.target.value }))}
                  placeholder="예: 2000"
                  disabled={Boolean(busyId)}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-xs text-gray-600 font-medium">상품명</p>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                  placeholder="예: 아이스 아메리카노"
                  disabled={Boolean(busyId)}
                />
              </div>
              <div className="md:col-span-2">
                <AdminImageUpload
                  label="상품 이미지"
                  value={draft.imageUrl}
                  onChange={(url) => setDraft((s) => ({ ...s, imageUrl: url }))}
                  getAccessToken={getAccessToken}
                  disabled={Boolean(busyId)}
                  storagePrefix="gifticon"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closePanel} disabled={Boolean(busyId)}>
                취소
              </Button>
              <Button onClick={() => void save()} disabled={Boolean(busyId)}>
                {busyId ? "저장 중…" : "저장"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

