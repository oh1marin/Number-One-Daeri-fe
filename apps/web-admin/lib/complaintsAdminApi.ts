import { adminFetch, readAdminResponseBody, getAdminApiFailureMessage } from "./api";

export type ComplaintStatus = "pending" | "reviewed" | "resolved";

export type ComplaintUserSummary = {
  id?: string;
  phone?: string;
  name?: string;
  email?: string;
};

export type ComplaintListItem = {
  id: string;
  content: string;
  status: ComplaintStatus;
  createdAt: string;
  userId?: string;
  attachments: string[];
  user?: ComplaintUserSummary;
  /** 관리자 답변·처리 메모 (백엔드 필드명 여러 형태 수용) */
  reply: string;
  repliedAt: string;
};

export type ComplaintsListResult = {
  items: ComplaintListItem[];
  total: number;
  page: number;
  limit: number;
};

export type ComplaintDetail = ComplaintListItem & {
  user?: ComplaintUserSummary;
};

function normalizeStatus(v: unknown): ComplaintStatus {
  const s = String(v ?? "").toLowerCase();
  if (s === "reviewed" || s === "resolved" || s === "pending") return s;
  return "pending";
}

function parseAttachments(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x)).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map((x) => String(x)).filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  return [];
}

function parseUser(raw: unknown): ComplaintUserSummary | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const id = u.id != null ? String(u.id) : undefined;
  const phone =
    u.phone != null
      ? String(u.phone)
      : u.phoneNumber != null
        ? String(u.phoneNumber)
        : undefined;
  const name = u.name != null ? String(u.name) : undefined;
  const email = u.email != null ? String(u.email) : undefined;
  if (!id && !phone && !name && !email) return undefined;
  return { id, phone, name, email };
}

function pickReplyText(o: Record<string, unknown>): string {
  const keys = [
    "adminReply",
    "reply",
    "replyText",
    "replyContent",
    "adminReplyContent",
    "answer",
    "response",
    "responseMessage",
    "answerContent",
    "resolution",
    "resolutionNote",
    "memo",
    "messageToUser",
    "sentMessage",
    "smsMessage",
    "lastSmsMessage",
  ] as const;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim() !== "") return v;
    if (v && typeof v === "object") {
      const obj = v as Record<string, unknown>;
      const nested =
        (typeof obj.content === "string" && obj.content) ||
        (typeof obj.message === "string" && obj.message) ||
        (typeof obj.text === "string" && obj.text) ||
        (typeof obj.body === "string" && obj.body) ||
        "";
      if (nested.trim() !== "") return nested;
    }
  }

  const replies = o.replies;
  if (Array.isArray(replies) && replies.length > 0) {
    const last = replies[replies.length - 1];
    if (last && typeof last === "object") {
      const r = last as Record<string, unknown>;
      const text =
        (typeof r.content === "string" && r.content) ||
        (typeof r.message === "string" && r.message) ||
        (typeof r.text === "string" && r.text) ||
        "";
      if (text.trim() !== "") return text;
    }
  }
  return "";
}

function pickRepliedAt(o: Record<string, unknown>): string {
  const keys = [
    "repliedAt",
    "replyAt",
    "respondedAt",
    "adminRepliedAt",
    "replied_at",
    "responseAt",
    "answerAt",
    "lastSmsSentAt",
  ] as const;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }

  const replyObj = o.reply;
  if (replyObj && typeof replyObj === "object") {
    const rr = replyObj as Record<string, unknown>;
    const nested =
      (typeof rr.repliedAt === "string" && rr.repliedAt) ||
      (typeof rr.createdAt === "string" && rr.createdAt) ||
      (typeof rr.sentAt === "string" && rr.sentAt) ||
      "";
    if (nested.trim() !== "") return nested;
  }

  const replies = o.replies;
  if (Array.isArray(replies) && replies.length > 0) {
    const last = replies[replies.length - 1];
    if (last && typeof last === "object") {
      const r = last as Record<string, unknown>;
      const nested =
        (typeof r.repliedAt === "string" && r.repliedAt) ||
        (typeof r.createdAt === "string" && r.createdAt) ||
        (typeof r.sentAt === "string" && r.sentAt) ||
        "";
      if (nested.trim() !== "") return nested;
    }
  }
  return "";
}

function parseListItem(o: Record<string, unknown>): ComplaintListItem {
  const reply = pickReplyText(o);
  const rawStatus = normalizeStatus(o.status);
  const displayStatus: ComplaintStatus =
    rawStatus === "resolved" || reply.trim() !== "" ? "resolved" : "pending";

  return {
    id: String(o.id ?? ""),
    content: String(o.content ?? ""),
    status: displayStatus,
    createdAt: String(o.createdAt ?? o.created_at ?? ""),
    userId: o.userId != null ? String(o.userId) : o.user_id != null ? String(o.user_id) : undefined,
    attachments: parseAttachments(o.attachments),
    user: parseUser(o.user),
    reply,
    repliedAt: pickRepliedAt(o),
  };
}

export async function fetchComplaintsList(
  getAccessToken: () => string | null,
  params: { page: number; limit: number; status?: ComplaintStatus | "" }
): Promise<{ ok: true; data: ComplaintsListResult } | { ok: false; message: string }> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(1, params.page)));
  const lim = Math.min(100, Math.max(1, params.limit));
  q.set("limit", String(lim));
  if (params.status) q.set("status", params.status);
  const res = await adminFetch(`/admin/complaints?${q}`, { method: "GET", getAccessToken });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const itemsRaw = data.items;
  const items = Array.isArray(itemsRaw)
    ? (itemsRaw as Record<string, unknown>[]).map((row) => parseListItem(row))
    : [];
  return {
    ok: true,
    data: {
      items,
      total: Number(data.total ?? items.length) || 0,
      page: Number(data.page ?? params.page) || params.page,
      limit: Number(data.limit ?? lim) || lim,
    },
  };
}

export async function fetchComplaintDetail(
  getAccessToken: () => string | null,
  id: string
): Promise<{ ok: true; data: ComplaintDetail } | { ok: false; message: string }> {
  const res = await adminFetch(`/admin/complaints/${encodeURIComponent(id)}`, {
    method: "GET",
    getAccessToken,
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const detail = parseListItem(data);
  return { ok: true, data: { ...detail, user: parseUser(data.user) ?? detail.user } };
}

export async function patchComplaintStatus(
  getAccessToken: () => string | null,
  id: string,
  status: ComplaintStatus
): Promise<{ ok: true; data: ComplaintDetail } | { ok: false; message: string }> {
  const res = await adminFetch(`/admin/complaints/${encodeURIComponent(id)}`, {
    method: "PATCH",
    getAccessToken,
    body: JSON.stringify({ status }),
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const detail = parseListItem(data);
  return { ok: true, data: { ...detail, user: parseUser(data.user) ?? detail.user } };
}

/**
 * 답변 텍스트 저장(백엔드 필드명 차이를 고려해 여러 payload로 시도)
 */
export async function patchComplaintReply(
  getAccessToken: () => string | null,
  id: string,
  params: { reply: string; status?: ComplaintStatus }
): Promise<{ ok: true; data: ComplaintDetail } | { ok: false; message: string }> {
  const reply = params.reply.trim();
  if (!reply) return { ok: false, message: "답변 내용이 비어 있습니다." };

  const payloads: Record<string, unknown>[] = [];
  if (params.status) {
    payloads.push({ status: params.status, reply });
    payloads.push({ status: params.status, adminReply: reply });
    payloads.push({ status: params.status, replyText: reply });
    payloads.push({ status: params.status, replyContent: reply });
    payloads.push({ status: params.status, answer: reply });
    payloads.push({ status: params.status, response: reply });
  }
  payloads.push({ adminReply: reply });
  payloads.push({ reply });
  payloads.push({ replyText: reply });
  payloads.push({ replyContent: reply });
  payloads.push({ answer: reply });
  payloads.push({ response: reply });

  let lastError = "답변 저장에 실패했습니다.";
  for (const body of payloads) {
    const res = await adminFetch(`/admin/complaints/${encodeURIComponent(id)}`, {
      method: "PATCH",
      getAccessToken,
      body: JSON.stringify(body),
    });
    const { json, rawText } = await readAdminResponseBody(res);
    if (!res.ok) {
      lastError = getAdminApiFailureMessage(res, json, rawText);
      continue;
    }
    const root = json as Record<string, unknown>;
    const data = (root.data ?? root) as Record<string, unknown>;
    const detail = parseListItem(data);
    return { ok: true, data: { ...detail, user: parseUser(data.user) ?? detail.user } };
  }
  return { ok: false, message: lastError };
}

/**
 * 불편사항 답장 SMS — 앱설치현황과 동일하게 POST /admin/sms/send 사용.
 * - 회원 ID가 있으면 body: { ids: [userId], message }
 * - ID 없이 전화만 있으면 body: { phone, message } (백엔드가 단건 번호를 지원할 때)
 */
export async function sendComplaintReplySms(
  getAccessToken: () => string | null,
  params: { message: string; userId?: string; phone?: string }
): Promise<{ ok: true; sent: number } | { ok: false; message: string }> {
  const message = params.message.trim();
  if (!message) return { ok: false, message: "답장 내용을 입력하세요." };
  const uid = (params.userId ?? "").trim();
  const phoneDigits = (params.phone ?? "").replace(/\D/g, "");
  if (!uid && phoneDigits.length < 10) {
    return { ok: false, message: "회원 ID 또는 전화번호(10~11자리)가 필요합니다." };
  }

  const body = uid
    ? { ids: [uid], message }
    : { message, phone: phoneDigits };

  const res = await adminFetch(`/admin/sms/send`, {
    method: "POST",
    getAccessToken,
    body: JSON.stringify(body),
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) {
    return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };
  }
  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const sent = Number(data.sent ?? data.total ?? 1);
  return { ok: true, sent: Number.isFinite(sent) ? sent : 1 };
}

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: "접수",
  reviewed: "접수",
  resolved: "답변완료",
};
