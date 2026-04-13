"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getAdminApiFailureMessage, readAdminResponseBody } from "@/lib/api";
import {
  normalizeAdsFromResponse,
  putAdminAdsBulkWithFallback,
  isAdsSaveResponseOk,
  type AdminAdItem,
  toBulkWireItem,
} from "@/lib/adsAdminApi";
import { AdminImageUpload } from "@/components/AdminImageUpload";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const emptyForm = () => ({
  imageUrl: "",
  content: "",
  linkUrl: "",
  shareText: "",
});

export default function AdSettingsPage() {
  const { getAccessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<null | { type: "ok" | "err"; msg: string }>(null);

  const [items, setItems] = useState<AdminAdItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAdItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canUseApi = useMemo(() => !!API_BASE && hasAdminWebSession(), [getAccessToken]);

  const showToast = (type: "ok" | "err", msg: string) => setToast({ type, msg });

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/ads`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        const msg = getAdminApiFailureMessage(res, json, rawText);
        showToast("err", msg || "광고 로딩 실패");
        setItems([]);
        return;
      }
      setItems(normalizeAdsFromResponse(json));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const api = (path: string, opts: RequestInit = {}) => {
    const token = getAccessToken();
    return fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...opts,
      headers: {
        ...(opts.headers as Record<string, string> | undefined),
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setEditOpen(true);
  };

  const openEdit = (ad: AdminAdItem) => {
    setEditing(ad);
    setForm({
      imageUrl: ad.imageUrl ?? "",
      content: ad.content ?? "",
      linkUrl: ad.linkUrl ?? "",
      shareText: ad.shareText ?? "",
    });
    setEditOpen(true);
  };

  const adLabel = (ad: AdminAdItem) => {
    const s = (ad.shareText ?? "").trim();
    if (s) return s.length > 40 ? `${s.slice(0, 40)}…` : s;
    const c = (ad.content ?? "").trim();
    if (c) return c.length > 60 ? `${c.slice(0, 60)}…` : c;
    const img = (ad.imageUrl ?? "").trim();
    return img ? (img.length > 40 ? `${img.slice(0, 40)}…` : img) : "(제목 없음)";
  };

  const handleSave = async () => {
    const nextForm = {
      imageUrl: form.imageUrl.trim(),
      content: form.content,
      linkUrl: form.linkUrl.trim(),
      shareText: form.shareText.trim(),
    };

    if (!nextForm.imageUrl && !nextForm.content.trim() && !nextForm.shareText.trim()) {
      showToast("err", "이미지 URL 또는 내용/공유문구 중 하나를 입력하세요.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editing;
      const baseList = items.slice();

      // 신규 등록이면 임시 id를 만들어 payload에 포함(백엔드가 id를 무시해도 안전)
      const newId = isEdit ? editing!.id : crypto.randomUUID();
      const draft: AdminAdItem = {
        id: newId,
        title: undefined,
        imageUrl: nextForm.imageUrl,
        content: nextForm.content,
        linkUrl: nextForm.linkUrl,
        shareText: nextForm.shareText,
        updatedAt: null,
      };

      const list = isEdit
        ? baseList.map((x) => (x.id === editing!.id ? draft : x))
        : [...baseList, draft];

      // 1) 우선 bulk PUT /admin/ads 일괄 저장 시도
      const bulk = await putAdminAdsBulkWithFallback(api, list);
      if (isAdsSaveResponseOk(bulk.res, bulk.json)) {
        showToast("ok", isEdit ? "수정되었습니다." : "등록되었습니다.");
        setEditOpen(false);
        await load();
        return;
      }

      // 2) bulk가 실패하면 단일(legacy/단건) 저장도 시도
      const wire = toBulkWireItem(draft);
      const res2 = await api("/admin/ads", { method: "PUT", body: JSON.stringify(wire) });
      const { json: json2, rawText: rawText2 } = await readAdminResponseBody(res2);
      if (res2.ok && json2 && (json2 as any).success !== false) {
        showToast("ok", isEdit ? "수정되었습니다." : "등록되었습니다.");
        setEditOpen(false);
        await load();
        return;
      }

      const msg = getAdminApiFailureMessage(bulk.res, bulk.json, bulk.rawText);
      showToast("err", msg || "저장 실패");
    } catch {
      showToast("err", "네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ad: AdminAdItem) => {
    if (!confirm("이 광고를 삭제할까요?")) return;
    setSaving(true);
    try {
      const nextList = items.filter((x) => x.id !== ad.id);
      const bulk = await putAdminAdsBulkWithFallback(api, nextList);
      if (isAdsSaveResponseOk(bulk.res, bulk.json)) {
        showToast("ok", "삭제되었습니다.");
        setEditOpen(false);
        await load();
        return;
      }
      const msg = getAdminApiFailureMessage(bulk.res, bulk.json, bulk.rawText);
      showToast("err", msg || "삭제 실패");
    } catch {
      showToast("err", "네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium max-w-md ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-none">광고 설정</h1>
          <p className="text-gray-500 text-sm mt-1">여러 개의 광고를 등록·수정·삭제할 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreate}
            disabled={!canUseApi}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            + 광고 등록
          </button>
          <Link href="/" className="text-xs text-blue-700 hover:underline">
            대시보드
          </Link>
        </div>
      </div>

      <div className="sheet-wrap overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-sm">
            <thead>
              <tr>
                <th>광고문구</th>
                <th className="max-w-[240px]">이미지 URL</th>
                <th className="w-32">수정일</th>
                <th className="w-32">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    등록된 광고가 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((ad) => (
                  <tr key={ad.id}>
                    <td className="font-medium truncate max-w-[320px]">{adLabel(ad)}</td>
                    <td className="text-gray-600 truncate max-w-[240px]" title={ad.imageUrl}>
                      {ad.imageUrl || "—"}
                    </td>
                    <td className="text-gray-600 text-xs whitespace-nowrap">
                      {ad.updatedAt ? ad.updatedAt.slice(0, 10) : "—"}
                    </td>
                    <td>
                      <button type="button" onClick={() => openEdit(ad)} className="text-blue-600 hover:underline text-xs mr-2">
                        수정
                      </button>
                      <button type="button" onClick={() => handleDelete(ad)} className="text-red-600 hover:underline text-xs">
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
              <h3 className="font-semibold text-lg">{editing ? "광고 수정" : "광고 등록"}</h3>

              <div className="space-y-2">
                <AdminImageUpload
                  label="광고 이미지"
                  value={form.imageUrl}
                  onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
                  getAccessToken={getAccessToken}
                  disabled={saving}
                  storagePrefix="ads"
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">이미지 URL (직접 입력)</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://... (업로드 없이 외부 URL)"
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border rounded text-sm"
                  placeholder="광고 본문 내용"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">링크 (옵션)</label>
                <input
                  value={form.linkUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">광고문구(공유문구)</label>
                <input
                  value={form.shareText}
                  onChange={(e) => setForm((f) => ({ ...f, shareText: e.target.value }))}
                  placeholder="카카오톡/문자 공유 문구"
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 border rounded text-sm">
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saving ||
                    (!form.imageUrl.trim() && !form.content.trim() && !form.shareText.trim())
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                >
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
