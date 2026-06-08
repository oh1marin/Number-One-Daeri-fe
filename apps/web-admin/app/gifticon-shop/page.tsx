"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gift, Plus, RefreshCw, Search, ShoppingBag, Sparkles, X } from "lucide-react";
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
import { GifticonAppPreview } from "@/components/gifticon/GifticonAppPreview";
import { GifticonShopImageUpload } from "@/components/gifticon/GifticonShopImageUpload";
import { GifticonShopProductCard } from "@/components/gifticon/GifticonShopProductCard";

type Draft = {
  id: string;
  name: string;
  mileagePrice: string;
  imageUrl: string;
};

type EditMode = "none" | "create" | "edit";

function toDraft(p?: GifticonProduct): Draft {
  return {
    id: p?.id ?? "",
    name: p?.name ?? "",
    mileagePrice: String(p?.mileagePrice ?? ""),
    imageUrl: p?.imageUrl ?? "",
  };
}

function normalizeMoneyString(v: string): string {
  return v.trim().replace(/[^\d]/g, "");
}

function draftToPayload(d: Draft): GifticonProduct {
  const id = d.id.trim();
  const name = d.name.trim();
  const price = Number(normalizeMoneyString(d.mileagePrice));
  if (!id) throw new Error("상품 ID를 입력하세요.");
  if (!name) throw new Error("상품명을 입력하세요.");
  if (!Number.isFinite(price) || price <= 0) throw new Error("마일리지 가격은 1 이상이어야 합니다.");
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [products, setProducts] = useState<GifticonProduct[]>([]);
  const [q, setQ] = useState("");

  const [mode, setMode] = useState<EditMode>("none");
  const [draft, setDraft] = useState<Draft>(() => toDraft());
  const [selectedId, setSelectedId] = useState("");

  const showToast = (type: "ok" | "err", msg: string) => {
    if (type === "ok") {
      setSuccess(msg);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(msg);
      setSuccess("");
    }
  };

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const list = await fetchGifticonProducts(getAccessToken);
      setProducts(list);
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
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

  const stats = useMemo(() => {
    const withImage = products.filter((p) => p.imageUrl?.trim()).length;
    return { total: products.length, withImage };
  }, [products]);

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
    if (busyId) return;
    setMode("none");
    setSelectedId("");
    setDraft(toDraft());
  };

  const save = async () => {
    setError("");
    let payload: GifticonProduct;
    try {
      payload = draftToPayload({ ...draft, mileagePrice: normalizeMoneyString(draft.mileagePrice) });
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "입력값을 확인하세요.");
      return;
    }

    setBusyId(payload.id);
    try {
      if (mode === "create") {
        await createGifticonProduct(getAccessToken, payload);
        showToast("ok", "상품이 등록되었습니다.");
      } else if (mode === "edit") {
        await updateGifticonProduct(getAccessToken, selectedId || payload.id, payload);
        showToast("ok", "상품이 수정되었습니다.");
      }
      await refresh();
      closePanel();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(`「${products.find((p) => p.id === id)?.name ?? id}」 상품을 삭제할까요?`)) return;
    setBusyId(id);
    try {
      await deleteGifticonProduct(getAccessToken, id);
      showToast("ok", "삭제되었습니다.");
      await refresh();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f5f9]">
      {/* 상점 헤더 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="relative px-6 py-8 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                앱 기프티콘 상점 연동
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-8 h-8" />
                기프티콘 상점
              </h1>
              <p className="text-indigo-100 text-sm mt-2 max-w-xl">
                등록한 상품·이미지가 사용자 앱 마일리지 상점에 카드로 표시됩니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="bg-white/15 text-white border-0 hover:bg-white/25"
                onClick={() => void refresh()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                새로고침
              </Button>
              <Button onClick={openCreate} className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
                <Plus className="w-4 h-4 mr-1.5" />
                상품 등록
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
              <p className="text-xs text-indigo-100">전체 상품</p>
              <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
              <p className="text-xs text-indigo-100">이미지 등록</p>
              <p className="text-2xl font-bold tabular-nums">{stats.withImage}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-indigo-100">검색 결과</p>
              <p className="text-2xl font-bold tabular-nums">{filtered.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto space-y-5">
        {(error || success) && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              error ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-800 border border-emerald-100"
            }`}
          >
            {error || success}
          </div>
        )}

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="상품명 또는 ID로 검색…"
            className="h-11 pl-10 bg-white border-gray-200 rounded-xl shadow-sm"
          />
        </div>

        {/* 상품 그리드 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">등록된 상품이 없습니다</h2>
            <p className="text-sm text-gray-500 mt-2 mb-6">첫 기프티콘 상품을 등록해 보세요.</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              상품 등록하기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => (
              <GifticonShopProductCard
                key={p.id}
                product={p}
                busy={busyId === p.id}
                onEdit={() => openEdit(p)}
                onDelete={() => void remove(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 등록/수정 패널 */}
      {mode !== "none" ? (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="닫기"
            onClick={closePanel}
          />
          <div className="relative w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {mode === "create" ? "새 상품 등록" : "상품 수정"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">왼쪽 미리보기 · 오른쪽에서 정보 입력</p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                disabled={Boolean(busyId)}
                className="p-2 rounded-lg hover:bg-white/80 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 p-5 md:p-6">
                {/* 미리보기 */}
                <div className="md:sticky md:top-0 md:self-start pb-6 md:pb-0 border-b md:border-b-0 border-gray-100">
                  <GifticonAppPreview
                    name={draft.name}
                    mileagePrice={draft.mileagePrice}
                    imageUrl={draft.imageUrl}
                    productId={draft.id}
                  />
                </div>

                {/* 입력 폼 */}
                <div className="space-y-5 pt-5 md:pt-0">
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">① 상품 이미지</h3>
                    <GifticonShopImageUpload
                      value={draft.imageUrl}
                      onChange={(imageUrl) => setDraft((s) => ({ ...s, imageUrl }))}
                      getAccessToken={getAccessToken}
                      disabled={Boolean(busyId)}
                    />
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">② 상품 정보</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">상품명 *</label>
                      <Input
                        value={draft.name}
                        onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                        placeholder="예: 스타벅스 아이스 아메리카노"
                        disabled={Boolean(busyId)}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">마일리지 가격 *</label>
                      <div className="relative">
                        <Input
                          value={draft.mileagePrice}
                          onChange={(e) => setDraft((s) => ({ ...s, mileagePrice: e.target.value }))}
                          placeholder="2000"
                          disabled={Boolean(busyId)}
                          inputMode="numeric"
                          className="h-11 pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">마일</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">상품 ID *</label>
                      <Input
                        value={draft.id}
                        onChange={(e) => setDraft((s) => ({ ...s, id: e.target.value }))}
                        placeholder="mega_americano_ice"
                        disabled={mode === "edit" || Boolean(busyId)}
                        className="h-11 font-mono text-sm"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        앱·API 식별용 코드. 등록 후 변경하지 않는 것을 권장합니다.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <Button variant="outline" onClick={closePanel} disabled={Boolean(busyId)}>
                취소
              </Button>
              <Button
                onClick={() => void save()}
                disabled={Boolean(busyId) || !draft.name.trim() || !draft.id.trim()}
                className="min-w-[100px] bg-indigo-600 hover:bg-indigo-700"
              >
                {busyId ? "저장 중…" : mode === "create" ? "등록하기" : "저장하기"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
