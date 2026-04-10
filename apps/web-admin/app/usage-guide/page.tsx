"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function UsageGuidePage() {
  const { getAccessToken } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setContent("");
        setLoading(false);
        return;
      }
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/admin/usage-guide`, {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setContent(data.data?.content ?? data.content ?? "");
        } else {
          setContent("");
        }
      } catch {
        setContent("");
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken]);

  const handleSave = async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) return;
    setSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/admin/usage-guide`, {
        credentials: "include",
        method: "PUT",
        headers,
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        alert("저장되었습니다.");
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">사용설명</h1>
          <p className="text-gray-500 text-sm mt-1">앱 사용설명 편집</p>
        </div>
        {API_BASE && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-gray-400 text-center py-8">로딩 중...</p>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!API_BASE}
            rows={16}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            placeholder="사용설명 내용을 입력하세요"
          />
        )}
      </div>
    </div>
  );
}
