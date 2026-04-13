"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizeImageContentType, presignAndUploadImage } from "@/lib/uploadAsset";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  getAccessToken: () => string | null;
  disabled?: boolean;
  /** S3 키 접두(백엔드 presignPath). 예: notices, ads */
  storagePrefix?: string;
};

export function AdminImageUpload({
  label = "이미지",
  value,
  onChange,
  getAccessToken,
  disabled,
  storagePrefix,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (file: File | null) => {
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
        keyPrefix: storagePrefix,
      });
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-gray-600 font-medium">{label}</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => void pick(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "업로드 중…" : "파일 선택"}
        </Button>
        {value ? (
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange("")}>
            제거
          </Button>
        ) : null}
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      {value ? (
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-32 object-cover" />
          <p className="text-[10px] text-gray-500 p-1.5 break-all">{value}</p>
        </div>
      ) : (
        <p className="text-[10px] text-gray-400">
          POST /admin/uploads/presign (관리자 인증 동일). CORS에 관리자 Origin·PUT·Content-Type 필요.
        </p>
      )}
    </div>
  );
}
