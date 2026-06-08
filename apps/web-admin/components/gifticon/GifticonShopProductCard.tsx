"use client";

import { Coins, Gift, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GifticonProduct } from "@/lib/gifticonAdminApi";
import { resolveMediaUrl } from "@/lib/mediaUrl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Props = {
  product: GifticonProduct;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function GifticonShopProductCard({ product, busy, onEdit, onDelete }: Props) {
  const img = resolveMediaUrl(product.imageUrl, API_BASE) || product.imageUrl;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-200 overflow-hidden">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 via-indigo-50/80 to-violet-50">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-indigo-300">
            <Gift className="w-12 h-12 mb-2" />
            <span className="text-xs text-gray-400">이미지 없음</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900/85 text-white text-xs font-bold shadow">
            <Coins className="w-3 h-3 text-amber-300" />
            {product.mileagePrice.toLocaleString()}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center gap-2 pb-4">
          <Button size="sm" variant="secondary" disabled={busy} onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5 mr-1" />
            수정
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            삭제
          </Button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <p className="text-[11px] text-gray-400 mt-1 truncate" title={product.id}>
          {product.id}
        </p>
        <p className="mt-auto pt-3 text-xs text-indigo-600 font-medium">
          {product.mileagePrice.toLocaleString()} 마일리지
        </p>
      </div>
    </article>
  );
}
