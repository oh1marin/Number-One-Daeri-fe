/**
 * POST {API_BASE}/admin/uploads/presign
 * 인증: 기존 관리자와 동일 (쿠키 + Bearer)
 *
 * 요청 본문: contentType, filename (필수), presignPath (선택, S3 키 접두 — notices, ads 등)
 * 응답: success + 최상위 putUrl/publicUrl 및 data 래핑 둘 다 지원
 */
export type PresignResult = { putUrl: string; publicUrl: string };

const PRESIGN_ENDPOINT = "/admin/uploads/presign";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForType(ct: string): string {
  if (ct === "image/jpeg") return ".jpg";
  if (ct === "image/png") return ".png";
  if (ct === "image/webp") return ".webp";
  if (ct === "image/gif") return ".gif";
  return ".bin";
}

function guessTypeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return null;
}

/** 백엔드 허용 타입으로 맞춤 (image/jpg → image/jpeg) */
export function normalizeImageContentType(file: File): string {
  let t = (file.type || "").trim().toLowerCase();
  if (t === "image/jpg") t = "image/jpeg";
  if (ALLOWED_TYPES.has(t)) return t;
  const fromName = guessTypeFromName(file.name);
  if (fromName) return fromName;
  return "";
}

function ensureFilename(file: File, contentType: string): string {
  const raw = (file.name || "").trim();
  if (raw) return raw;
  return `upload${extForType(contentType)}`;
}

function pickPresignPayload(json: Record<string, unknown>): PresignResult | null {
  const d = (json.data ?? json) as Record<string, unknown>;
  const putUrl = String(
    d.putUrl ?? d.uploadUrl ?? d.url ?? d.signedUrl ?? ""
  ).trim();
  const publicUrl = String(d.publicUrl ?? d.readUrl ?? d.cdnUrl ?? "").trim();
  if (!putUrl || !publicUrl) return null;
  return { putUrl, publicUrl };
}

export type PresignUploadOptions = {
  /**
   * S3 키 접두(백엔드 presignPath). 예: notices, ads
   * 슬래시로 시작하거나 .. 등은 백엔드에서 400
   */
  keyPrefix?: string;
};

export async function presignAndUploadImage(
  apiBase: string,
  getAccessToken: () => string | null,
  file: File,
  options?: PresignUploadOptions
): Promise<string> {
  const contentType = normalizeImageContentType(file);
  if (!contentType) {
    throw new Error("지원하는 이미지 형식만 업로드할 수 있습니다. (JPEG, PNG, WebP, GIF)");
  }

  const filename = ensureFilename(file, contentType);
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const body: Record<string, string> = {
    contentType,
    filename,
  };
  const prefix = options?.keyPrefix?.trim();
  if (prefix) {
    body.presignPath = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  const presignRes = await fetch(`${apiBase.replace(/\/$/, "")}${PRESIGN_ENDPOINT}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });

  const presignJson = (await presignRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (!presignRes.ok) {
    const piece = presignJson.message ?? presignJson.error ?? presignRes.statusText ?? "";
    const msg = String(piece).trim() || "Presign 요청 실패";
    throw new Error(`${presignRes.status}: ${msg}`);
  }

  const parsed = pickPresignPayload(presignJson);
  if (!parsed) {
    throw new Error(
      "Presign 응답에 putUrl·publicUrl이 없습니다. success·data 형식을 확인하세요."
    );
  }

  const putRes = await fetch(parsed.putUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!putRes.ok) {
    throw new Error(`S3 업로드 실패 (${putRes.status}). CORS·Presigned 헤더·버킷 정책을 확인하세요.`);
  }

  return parsed.publicUrl;
}
