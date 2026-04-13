"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { AdminImageUpload } from "@/components/AdminImageUpload";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export interface NoticeEvent {
  title: string;
  date: string;
  desc: string;
  /** S3 등 공개 URL — 백엔드가 공지 저장 시 함께 저장해야 함 */
  imageUrl?: string;
}

export interface Notice {
  id: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  date: string;
  views?: number;
  content: string;
  /** 상단 히어로·목록 썸네일 등 (선택) */
  coverImageUrl?: string;
  events?: NoticeEvent[];
}

export default function NoticesPage() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({
    badge: "공지",
    badgeColor: "bg-red-100 text-red-600",
    title: "",
    date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    content: "",
    coverImageUrl: "",
    events: [] as NoticeEvent[],
  });
  const [saving, setSaving] = useState(false);

  const updateEventAt = (idx: number, patch: Partial<NoticeEvent>) => {
    setForm((f) => ({
      ...f,
      events: f.events.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    }));
  };

  const removeEventAt = (idx: number) => {
    setForm((f) => ({
      ...f,
      events: f.events.filter((_e, i) => i !== idx),
    }));
  };

  const addEvent = () => {
    setForm((f) => ({
      ...f,
      events: [...f.events, { title: "", date: "", desc: "", imageUrl: "" }],
    }));
  };

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/admin/notices`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.data?.items ?? data?.data ?? data?.items ?? data;
        const list = Array.isArray(raw) ? raw : [];
        setItems(list);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [getAccessToken]);

  const api = (path: string, opts: RequestInit = {}) => {
    const token = getAccessToken();
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...opts.headers,
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      badge: "공지",
      badgeColor: "bg-red-100 text-red-600",
      title: "",
      date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
      content: "",
      coverImageUrl: "",
      events: [],
    });
    setEditOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({
      badge: n.badge ?? "공지",
      badgeColor: n.badgeColor ?? "bg-red-100 text-red-600",
      title: n.title,
      date: (n.date ?? "").replace(/-/g, ".") || new Date().toISOString().slice(0, 10).replace(/-/g, "."),
      content: n.content ?? "",
      coverImageUrl: n.coverImageUrl ?? "",
      events: n.events ?? [],
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast("err", "제목을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        badge: form.badge || "공지",
        badgeColor: form.badgeColor || "bg-red-100 text-red-600",
        title: form.title.trim(),
        date: form.date.replace(/\./g, "-"),
        content: form.content || "",
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        events: form.events.map((e) => ({
          title: e.title,
          date: e.date,
          desc: e.desc,
          ...(e.imageUrl?.trim() ? { imageUrl: e.imageUrl.trim() } : {}),
        })),
      };
      let res: Response;
      if (editing?.id) {
        res = await api(`/admin/notices/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        res = await api("/admin/notices", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data.success !== false || data.data != null);
      if (ok) {
        showToast("ok", editing ? "수정되었습니다." : "등록되었습니다.");
        setEditOpen(false);
        load();
      } else {
        const msg =
          data?.message ??
          data?.error ??
          (res.status === 404
            ? "API가 없습니다. 백엔드에 POST /admin/notices 추가 필요"
            : "저장 실패");
        showToast("err", `${res.status} ${res.statusText || ""}: ${msg}`.trim());
      }
    } catch {
      showToast("err", "네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    try {
      const res = await api(`/admin/notices/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showToast("ok", "삭제되었습니다.");
        if (editing?.id === id) setEditOpen(false);
        load();
      } else {
        showToast("err", data?.message ?? "삭제 실패");
      }
    } catch {
      showToast("err", "네트워크 오류");
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공지사항 관리</h1>
          <p className="text-gray-500 text-sm mt-1">
            공지 등록·수정 후 앱·웹·Flutter 등에 반영됩니다.
          </p>
        </div>
        <div>
          <Button onClick={openCreate}>+ 공지 등록</Button>
        </div>
      </div>

      <div className="sheet-wrap overflow-hidden">
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-sm">
            <thead>
              <tr>
                <th className="w-16">순서</th>
                <th>제목</th>
                <th className="w-28">날짜</th>
                <th className="w-20 text-right">조회</th>
                <th className="w-32">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    등록된 공지가 없습니다.
                    <br />
                    <span className="text-xs block mt-2 text-gray-400">
                      공지 등록이 안 되면: 백엔드에 POST /api/v1/admin/notices API 추가 필요. 오류가 나면 응답 메시지 확인.
                    </span>
                  </td>
                </tr>
              ) : (
                items.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${n.badgeColor ?? "bg-gray-100"}`}>
                        {n.badge ?? "공지"}
                      </span>
                    </td>
                    <td className="font-medium truncate max-w-[300px]">{n.title}</td>
                    <td className="text-gray-600">{n.date}</td>
                    <td className="text-right text-gray-600">{(n.views ?? 0).toLocaleString()}</td>
                    <td>
                      <button onClick={() => openEdit(n)} className="text-blue-600 hover:underline text-xs mr-2">
                        수정
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="text-red-600 hover:underline text-xs">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !saving && setEditOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">{editing ? "공지 수정" : "공지 등록"}</h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">배지</label>
                <input
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className="w-24 px-2 py-1.5 border rounded text-sm"
                  placeholder="공지"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">배지 색상 (Tailwind)</label>
                <input
                  value={form.badgeColor}
                  onChange={(e) => setForm((f) => ({ ...f, badgeColor: e.target.value }))}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                  placeholder="bg-red-100 text-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">제목 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="공지 제목"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">날짜 (YYYY.MM.DD)</label>
                <input
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-36 px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <AdminImageUpload
                label="대표 이미지 (선택, 웹 상단 등)"
                value={form.coverImageUrl}
                onChange={(coverImageUrl) => setForm((f) => ({ ...f, coverImageUrl }))}
                getAccessToken={getAccessToken}
                disabled={saving}
                storagePrefix="notices"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">본문</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="공지 내용"
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs font-medium text-gray-600">이벤트 카드 (선택)</label>
                  <Button type="button" onClick={addEvent} size="sm">
                    + 이벤트 추가
                  </Button>
                </div>

                {form.events.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-2">
                    이벤트를 추가하면 Flutter <span className="font-semibold">/events</span>에서 카드로 노출됩니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {form.events.map((evt, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-800">이벤트 #{idx + 1}</p>
                          <button
                            type="button"
                            onClick={() => removeEventAt(idx)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">제목</label>
                            <input
                              value={evt.title}
                              onChange={(e) => updateEventAt(idx, { title: e.target.value })}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                              placeholder="이벤트 제목"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1">기간</label>
                            <input
                              value={evt.date}
                              onChange={(e) => updateEventAt(idx, { date: e.target.value })}
                              className="w-full px-2 py-1.5 border rounded text-sm"
                              placeholder="2026.12.01 ~ 12.31"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-600 mb-1">설명(desc)</label>
                          <textarea
                            value={evt.desc}
                            onChange={(e) => updateEventAt(idx, { desc: e.target.value })}
                            rows={3}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                            placeholder="이벤트 설명"
                          />
                        </div>
                        <AdminImageUpload
                          label="이벤트 카드 이미지 (선택)"
                          value={evt.imageUrl ?? ""}
                          onChange={(imageUrl) => updateEventAt(idx, { imageUrl })}
                          getAccessToken={getAccessToken}
                          disabled={saving}
                          storagePrefix="notices"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button onClick={() => setEditOpen(false)} className="px-4 py-2 border rounded text-sm">
                  취소
                </button>
                <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                  {saving ? "저장 중…" : "저장"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
