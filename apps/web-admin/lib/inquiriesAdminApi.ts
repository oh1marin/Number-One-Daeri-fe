import { adminFetch, readAdminResponseBody, getAdminApiFailureMessage } from "./api";

export type InquiryStatus = "pending" | "active" | "closed";

export type InquiryUserSummary = {
  id?: string;
  phone?: string;
  name?: string;
  email?: string;
};

export type InquiryMessage = {
  id: string;
  content: string;
  sender: "user" | "admin";
  senderName: string;
  createdAt: string;
};

export type InquiryListItem = {
  id: string;
  status: InquiryStatus;
  createdAt: string;
  user?: InquiryUserSummary;
  content: string;
  lastAdminReply?: string;
  /** 마지막 메시지가 고객이면 미답변(관리자 답장 필요) */
  needsReply: boolean;
  /** 고객이 '상담사 호출'을 요청한 경우 */
  handoffRequested: boolean;
};

export type InquiryDetail = {
  id: string;
  status: InquiryStatus;
  createdAt: string;
  user?: InquiryUserSummary;
  messages: InquiryMessage[];
};

function normalizeStatus(v: unknown): InquiryStatus {
  const s = String(v ?? "").toLowerCase();
  if (s === "active" || s === "closed" || s === "pending") return s;
  return "pending";
}

function parseUser(raw: unknown): InquiryUserSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const id = u.id != null ? String(u.id) : undefined;
  const phone = u.phone != null ? String(u.phone) : u.phoneNumber != null ? String(u.phoneNumber) : undefined;
  const name = u.name != null ? String(u.name) : undefined;
  const email = u.email != null ? String(u.email) : undefined;
  if (!id && !phone && !name && !email) return undefined;
  return { id, phone, name, email };
}

function parseMessages(rawMessages: unknown, userName?: string): InquiryMessage[] {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const o = m as Record<string, unknown>;
      const id = o.id != null ? String(o.id) : "";
      const content = o.content != null ? String(o.content) : "";
      const createdAt = String(o.createdAt ?? "");
      const role = String(o.role ?? "");
      const isAdmin = role === "admin";
      return {
        id,
        content,
        sender: isAdmin ? "admin" : "user",
        senderName: isAdmin ? "상담원" : userName ?? "고객",
        createdAt,
      } satisfies InquiryMessage;
    })
    .filter((x): x is InquiryMessage => !!x && !!x.id);
}

function parseListItem(row: Record<string, unknown>): InquiryListItem {
  const user = parseUser(row.user);
  const status = normalizeStatus(row.status);
  const createdAt = String(row.createdAt ?? row.created_at ?? "");
  const messages = Array.isArray(row.messages) ? row.messages : [];

  const userMessages = messages.filter((m) => m && typeof m === "object" && (m as any).role !== "admin");
  const firstUserMsg = userMessages[0] as any;
  const content = firstUserMsg?.content ? String(firstUserMsg.content) : "—";

  const adminReplies = messages.filter((m) => m && typeof m === "object" && (m as any).role === "admin");
  const lastAdmin = adminReplies.length > 0 ? (adminReplies[adminReplies.length - 1] as any) : null;
  const lastAdminReply = lastAdmin?.content ? String(lastAdmin.content) : undefined;

  const lastMsg = messages.length > 0 ? (messages[messages.length - 1] as any) : null;
  const lastRole = String(lastMsg?.role ?? "");
  const needsReply = messages.length > 0 ? lastRole !== "admin" : false;
  const lastUserContent =
    needsReply && typeof lastMsg?.content === "string" ? String(lastMsg.content) : "";
  const handoffRequested =
    needsReply && /\[상담사\s*호출\s*요청\]|상담사\s*호출/.test(lastUserContent);

  return {
    id: String(row.id ?? ""),
    status,
    createdAt,
    user,
    content,
    lastAdminReply,
    needsReply,
    handoffRequested,
  };
}

export async function fetchInquiriesList(
  getAccessToken: () => string | null,
  params: { page: number; limit: number; status?: InquiryStatus | "" }
): Promise<{ ok: true; data: { items: InquiryListItem[]; total: number; page: number; limit: number } } | { ok: false; message: string }> {
  const q = new URLSearchParams();
  q.set("page", String(Math.max(1, params.page)));
  q.set("limit", String(Math.min(100, Math.max(1, params.limit))));
  if (params.status) q.set("status", params.status);

  try {
    const res = await adminFetch(`/admin/inquiries?${q.toString()}`, {
      method: "GET",
      getAccessToken,
    });
    const { json, rawText } = await readAdminResponseBody(res);
    if (!res.ok) return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };

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
        limit: Number(data.limit ?? params.limit) || params.limit,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isNetwork =
      msg === "Failed to fetch" ||
      e instanceof TypeError ||
      /network|load failed|fetch/i.test(msg);
    return {
      ok: false,
      message: isNetwork
        ? "백엔드에 연결할 수 없습니다. API 서버 실행 여부, NEXT_PUBLIC_API_BASE_URL, CORS(관리자 도메인 허용)를 확인하세요."
        : msg || "문의 목록을 불러오지 못했습니다.",
    };
  }
}

export async function fetchInquiryDetail(
  getAccessToken: () => string | null,
  id: string
): Promise<{ ok: true; data: InquiryDetail } | { ok: false; message: string }> {
  const res = await adminFetch(`/admin/inquiries/${encodeURIComponent(id)}`, {
    method: "GET",
    getAccessToken,
  });
  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };

  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const user = parseUser(data.user);
  return {
    ok: true,
    data: {
      id: String(data.id ?? ""),
      status: normalizeStatus(data.status),
      createdAt: String(data.createdAt ?? data.created_at ?? ""),
      user,
      messages: parseMessages(data.messages, user?.name),
    },
  };
}

export async function sendAdminInquiryMessage(
  getAccessToken: () => string | null,
  id: string,
  content: string
): Promise<{ ok: true; data: InquiryMessage } | { ok: false; message: string }> {
  const text = content.trim();
  if (!text) return { ok: false, message: "답장 내용을 입력하세요." };

  const res = await adminFetch(`/admin/inquiries/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    getAccessToken,
    body: JSON.stringify({ content: text }),
  });

  const { json, rawText } = await readAdminResponseBody(res);
  if (!res.ok) return { ok: false, message: getAdminApiFailureMessage(res, json, rawText) };

  const root = json as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;

  // 백엔드가 senderName/sender 등을 내려주긴 하지만, 혹시 몰라도 normalize
  const sender = String(data.sender ?? "");
  const createdAt = String(data.createdAt ?? data.created_at ?? "");

  return {
    ok: true,
    data: {
      id: String(data.id ?? ""),
      content: String(data.content ?? ""),
      sender: sender === "admin" ? "admin" : "user",
      senderName: String(data.senderName ?? (sender === "admin" ? "상담원" : "고객")),
      createdAt,
    },
  };
}

