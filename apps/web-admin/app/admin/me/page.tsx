"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function AdminMePage() {
  const { user, getAccessToken } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setMe(user ? { name: user.name, email: user.email } : null);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/admin/me`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const next = data.data || data;
          setMe(next);
          setForm(next);
        } else {
          const fallback = user ? { name: user.name, email: user.email } : null;
          setMe(fallback);
          setForm(fallback);
        }
      } catch {
        const fallback = user ? { name: user.name, email: user.email } : null;
        setMe(fallback);
        setForm(fallback);
      }
      setLoading(false);
    }
    load();
  }, [getAccessToken, user]);

  const handleSave = async () => {
    if (!password.new || password.new !== password.confirm) {
      alert("새 비밀번호를 확인해 주세요.");
      return;
    }
    const token = getAccessToken();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/me`, {
        credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.new,
        }),
      });
      if (res.ok) {
        setPassword({ current: "", new: "", confirm: "" });
        alert("비밀번호가 변경되었습니다.");
      } else {
        const d = await res.json();
        alert(d.message || "변경에 실패했습니다.");
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
    setSaving(false);
  };

  const info = form || me || user;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">관리자 정보</h1>
        <p className="text-gray-500 text-sm mt-1">회사 / 관리자 정보 및 비밀번호 설정</p>
        <p className="text-gray-400 text-xs mt-1">
          백엔드 <code className="text-xs">/api/v1/admin/me</code> 응답 필드에 맞춰 표시됩니다.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <section>
          <h2 className="font-semibold mb-4">회사 / 관리자 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">아이디</label>
              <input
                readOnly
                value={loading ? "" : info?.id ?? ""}
                className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">이메일</label>
              <input
                value={loading ? "" : info?.email ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">상호명</label>
              <input
                value={loading ? "" : info?.companyName ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), companyName: e.target.value }))}
                placeholder="예: 주식회사 라이드"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">대표자</label>
              <input
                value={loading ? "" : info?.ceoName ?? info?.name ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), ceoName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">휴대폰</label>
              <input
                value={loading ? "" : info?.phone ?? info?.mobile ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">대표전화</label>
              <input
                value={loading ? "" : info?.tel ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), tel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">프로그램명</label>
              <input
                value={loading ? "" : info?.programName ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), programName: e.target.value }))}
                placeholder="예: 라이드 관리"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">포트</label>
              <input
                value={loading ? "" : info?.port ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), port: e.target.value }))}
                placeholder="예: 41500"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">앱 버전</label>
              <input
                value={loading ? "" : info?.appVersion ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), appVersion: e.target.value }))}
                placeholder="예: 3.4"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                checked={Boolean(info?.soundEnabled)}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), soundEnabled: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-xs text-gray-600">알림음 (soundEnabled)</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-4">운영 / 안내 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">업무 시작</label>
              <input
                value={loading ? "" : info?.workStartTime ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), workStartTime: e.target.value }))}
                placeholder="예: 09:00"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">업무 종료</label>
              <input
                value={loading ? "" : info?.workEndTime ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), workEndTime: e.target.value }))}
                placeholder="예: 18:00"
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">주소</label>
              <input
                value={loading ? "" : info?.address ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Android 설치 URL</label>
              <input
                value={loading ? "" : info?.androidInstallUrl ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), androidInstallUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">iOS 설치 URL</label>
              <input
                value={loading ? "" : info?.iosInstallUrl ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), iosInstallUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">홈페이지 URL</label>
              <input
                value={loading ? "" : info?.homepageUrl ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), homepageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">메인 공지</label>
              <textarea
                value={loading ? "" : info?.mainNotice ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...(p || {}), mainNotice: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded resize-none"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              if (!API_BASE) {
                alert("API 주소가 필요합니다. NEXT_PUBLIC_API_BASE_URL을 확인하세요.");
                return;
              }
              if (!hasAdminWebSession()) {
                alert("로그인이 필요합니다.");
                return;
              }
              if (!info) {
                alert("변경할 정보가 없습니다.");
                return;
              }
              if (!confirm("현재 화면의 회사/운영 정보를 서버에 저장할까요?")) return;

              const token = getAccessToken();
              try {
                const payload = {
                  companyName: info.companyName ?? "",
                  ceoName: info.ceoName ?? info.name ?? "",
                  phone: info.phone ?? info.tel ?? "",
                  address: info.address ?? "",
                  programName: info.programName ?? "",
                  port: info.port ?? "",
                  appVersion: info.appVersion ?? "",
                  soundEnabled: Boolean(info.soundEnabled),
                  workStartTime: info.workStartTime ?? "",
                  workEndTime: info.workEndTime ?? "",
                  androidInstallUrl: info.androidInstallUrl ?? "",
                  iosInstallUrl: info.iosInstallUrl ?? "",
                  homepageUrl: info.homepageUrl ?? "",
                  mainNotice: info.mainNotice ?? "",
                };

                const res = await fetch(`${API_BASE}/admin/me`, {
                  credentials: "include",
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify(payload),
                });

                const d = await res.json().catch(() => ({}));
                if (!res.ok) {
                  alert(d.error || d.message || "설정 변경에 실패했습니다.");
                  return;
                }
                setMe(d.data || d);
                alert("설정이 저장되었습니다.");
              } catch {
                alert("설정 저장 중 오류가 발생했습니다.");
              }
            }}
            className="px-4 py-2 text-xs rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            설정 저장
          </button>
        </div>

        {API_BASE && (
          <div>
            <h2 className="font-semibold mb-3">비밀번호 변경</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">현재 비밀번호</label>
                <input
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "처리 중…" : "비밀번호 변경"}
              </button>
            </div>
          </div>
        )}

        {!API_BASE && (
          <p className="text-sm text-gray-400">API 미설정 시 비밀번호 변경을 사용할 수 없습니다.</p>
        )}
      </div>
    </div>
  );
}
