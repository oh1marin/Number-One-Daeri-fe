"use client";

import { Coins, Gift } from "lucide-react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Props = {
  name: string;
  mileagePrice: string;
  imageUrl: string;
  productId: string;
};

export function GifticonAppPreview({ name, mileagePrice, imageUrl, productId }: Props) {
  const price = Number(String(mileagePrice).replace(/[^\d]/g, "") || "0");
  const preview = resolveMediaUrl(imageUrl, API_BASE) || imageUrl;
  const displayName = name.trim() || "상품명 미입력";

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <p className="text-xs font-medium text-gray-500 mb-3 text-center">앱에서 이렇게 보입니다</p>
      <div className="rounded-[2rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="bg-white min-h-[420px] flex flex-col">
          <div className="relative px-4 pt-5 pb-2 border-b border-gray-100 flex items-center gap-2">
            <div className="absolute left-1/2 top-2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300" />
            <Gift className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm font-bold text-gray-900">기프티콘 상점</span>
          </div>

          <div className="p-4 flex-1">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-indigo-50 to-violet-100 relative">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="w-12 h-12 text-indigo-300" />
                  </div>
                )}
                {price > 0 ? (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900/80 text-white text-xs font-bold">
                    <Coins className="w-3 h-3" />
                    {price.toLocaleString()}
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{displayName}</p>
                <p className="text-[10px] text-gray-400 mt-1 truncate">{productId.trim() || "상품 ID"}</p>
                <button
                  type="button"
                  className="mt-3 w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold pointer-events-none"
                >
                  교환하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
