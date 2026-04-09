"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function AppImagesPage() {
  const { getAccessToken } = useAuth();
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setImages({});
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/app-images`, {
        credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setImages(data.data || data || {});
        } else {
          setImages({});
        }
      } catch {
        setImages({});
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">앱 이미지</h1>
        <p className="text-gray-500 text-sm mt-1">배너 등 key-value 이미지 관리</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-gray-400 text-center py-8">로딩 중...</p>
        ) : Object.keys(images).length === 0 ? (
          <p className="text-gray-400 text-center py-8">등록된 이미지가 없습니다. API 연동 후 데이터가 표시됩니다.</p>
        ) : (
          <dl className="space-y-4">
            {Object.entries(images).map(([key, value]) => (
              <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                <dt className="text-xs text-gray-500 font-medium mb-1">{key}</dt>
                <dd className="text-sm break-all">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
