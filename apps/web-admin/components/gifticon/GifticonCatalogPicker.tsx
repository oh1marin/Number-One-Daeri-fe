"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import {
  type GiftishowBrand,
  type GiftishowCatalogItem,
  fetchGiftishowBrands,
  fetchGiftishowCatalog,
  importGifticonFromCatalog,
} from "@/lib/gifticonAdminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onClose: () => void;
  getAccessToken: () => string | null;
  onSelect: (item: GiftishowCatalogItem) => void;
  onImported?: () => void;
};

export function GifticonCatalogPicker({ open, onClose, getAccessToken, onSelect, onImported }: Props) {
  const [brands, setBrands] = useState<GiftishowBrand[]>([]);
  const [brandCode, setBrandCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<GiftishowCatalogItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | undefined>();
  const [mode, setMode] = useState<"page" | "search">("page");
  const [hint, setHint] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchGiftishowCatalog(getAccessToken, {
        page,
        size: 20,
        q: appliedQ || undefined,
        brandCode: brandCode || undefined,
      });
      setItems(result.items);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setMode(result.mode);
      setHint(result.hint);
    } catch (e) {
      setError(e instanceof Error ? e.message : "기프티쇼 상품을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [appliedQ, brandCode, getAccessToken, page]);

  useEffect(() => {
    if (!open) return;
    void fetchGiftishowBrands(getAccessToken)
      .then(setBrands)
      .catch(() => setBrands([]));
  }, [open, getAccessToken]);

  useEffect(() => {
    if (!open) return;
    void loadCatalog();
  }, [open, loadCatalog]);

  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setAppliedQ("");
      setBrandCode("");
      setPage(1);
      setError("");
    }
  }, [open]);

  const runSearch = () => {
    const q = searchInput.trim();
    const isGoodsCode = /^G\d{5,}$/i.test(q);
    if (q && q.length < 2 && !isGoodsCode) {
      setError("검색어는 2글자 이상 입력해 주세요. (상품코드 G000… 는 바로 조회)");
      return;
    }
    setError("");
    setAppliedQ(q);
    setPage(1);
  };

  const quickImport = async (item: GiftishowCatalogItem) => {
    if (item.alreadyRegistered) return;
    setImportingId(item.goodsCode);
    setError("");
    try {
      await importGifticonFromCatalog(getAccessToken, item.goodsCode, item.price);
      onImported?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setImportingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-indigo-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">기프티쇼 상품 불러오기</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              검색·브랜드는 전체 목록에서 찾습니다 (최초 1회 준비 후 캐시). 코드(G000…)는 즉시 조회
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/80 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="상품명·브랜드·코드 검색 (2글자 이상)"
                className="h-10 pl-9"
              />
            </div>
            <Button type="button" onClick={runSearch} disabled={loading}>
              검색
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setAppliedQ("");
                setBrandCode("");
                setPage(1);
              }}
              disabled={loading}
            >
              초기화
            </Button>
          </div>

          <select
            value={brandCode}
            onChange={(e) => {
              setBrandCode(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="">전체 브랜드</option>
            {brands.map((b) => (
              <option key={b.brandCode} value={b.brandCode}>
                {b.brandName}
                {b.categoryName ? ` · ${b.categoryName}` : ""}
              </option>
            ))}
          </select>

          {hint ? <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{hint}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {appliedQ || brandCode ? "목록 준비·검색 중… (최초 1회 10~20초)" : "불러오는 중…"}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              {appliedQ || brandCode
                ? "조건에 맞는 상품이 없습니다. 검색어를 바꿔 보세요."
                : "상품이 없습니다. 검색하거나 다음 페이지를 확인해 주세요."}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.goodsCode}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.brandName ? `${item.brandName} ` : ""}
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{item.goodsCode}</p>
                    <p className="text-xs text-indigo-600 mt-1 tabular-nums">
                      기프티쇼 {item.price.toLocaleString()}원
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {item.alreadyRegistered ? (
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-center">
                        등록됨
                      </span>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                        >
                          폼에 채우기
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                          disabled={importingId === item.goodsCode}
                          onClick={() => void quickImport(item)}
                        >
                          {importingId === item.goodsCode ? "등록 중…" : "바로 등록"}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <span className="text-xs text-gray-500 tabular-nums">
            {mode === "search" && total != null ? `${total}건 · ` : ""}
            {page}페이지
            {total != null && mode === "page" ? ` / 약 ${Math.ceil(total / 20)}페이지` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || !hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
