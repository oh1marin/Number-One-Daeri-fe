"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeImageContentType, presignAndUploadImage } from "@/lib/uploadAsset";
import { resolveMediaUrl } from "@/lib/mediaUrl";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  value: string;
  onChange: (url: string) => void;
  getAccessToken: () => string | null;
  disabled?: boolean;
};

export function GifticonShopImageUpload({ value, onChange, getAccessToken, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = resolveMediaUrl(value, API_BASE) || value;

  const upload = async (file: File | null) => {
    setErr(null);
    if (!file) return;
    if (!normalizeImageContentType(file)) {
      setErr("JPEG, PNG, WebP, GIF만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("8MB 이하만 업로드할 수 있습니다.");
      return;
    }
    if (!API_BASE) {
      setErr("NEXT_PUBLIC_API_BASE_URL이 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const url = await presignAndUploadImage(API_BASE, getAccessToken, file, {
        keyPrefix: "gifticon",
      });
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || busy) return;
    void upload(e.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => void upload(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-indigo-100 bg-gray-50 aspect-[4/3] max-h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              변경
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={disabled || busy}
              onClick={() => onChange("")}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              제거
            </Button>
          </div>
          {busy ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`w-full rounded-2xl border-2 border-dashed aspect-[4/3] max-h-56 flex flex-col items-center justify-center gap-3 transition ${
            dragOver
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50"
          } ${disabled || busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {busy ? (
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                <ImagePlus className="w-7 h-7 text-indigo-500" />
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-gray-800">상품 이미지 업로드</p>
                <p className="text-xs text-gray-500 mt-1">클릭하거나 파일을 여기에 놓으세요</p>
                <p className="text-[10px] text-gray-400 mt-2">JPG · PNG · WebP · GIF · 최대 8MB</p>
              </div>
            </>
          )}
        </button>
      )}

      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
