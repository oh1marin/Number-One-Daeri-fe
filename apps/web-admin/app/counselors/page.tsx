"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function CounselorsPage() {
  const { getAccessToken } = useAuth();
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cid: "",
    loginId: "",
    password: "",
    enableCounselList: "사용",
    enableAppInstallList: "미사용",
    enableNotice: "미사용",
    enableAd: "미사용",
    enableMileage: "미사용",
    enablePointMall: "사용",
    enableDataWrite: "미사용",
    enableDataRead: "사용",
    enableOrderView: "무권한",
  });

  const load = async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setCounselors([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/counselors`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.data?.items ?? data.data ?? data.items ?? data;
        setCounselors(Array.isArray(raw) ? raw : []);
      } else {
        setCounselors([]);
      }
    } catch {
      setCounselors([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken]);

  const filtered = counselors.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(c.loginId || c.id || "").toLowerCase().includes(q) ||
      String(c.name || "").toLowerCase().includes(q)
    );
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.loginId.trim() || !form.password.trim()) {
      alert("이름, 아이디, 비밀번호를 입력하세요.");
      return;
    }
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      alert("API 설정 또는 로그인 정보를 확인하세요.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        cid: form.cid.trim() || null,
        loginId: form.loginId.trim(),
        password: form.password,
        permissions: {
          counselorList: form.enableCounselList === "사용",
          appInstallList: form.enableAppInstallList === "사용",
          notice: form.enableNotice === "사용",
          ad: form.enableAd === "사용",
          mileage: form.enableMileage === "사용",
          pointMall: form.enablePointMall === "사용",
          dataWrite: form.enableDataWrite === "사용",
          dataRead: form.enableDataRead === "사용",
          orderView: form.enableOrderView !== "무권한",
        },
      };
      const res = await fetch(`${API_BASE}/admin/counselors`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || d.message || "요청에 실패했습니다.");
      } else {
        alert("상담원이 등록되었습니다.");
        setShowModal(false);
        setForm({
          name: "",
          cid: "",
          loginId: "",
          password: "",
          enableCounselList: "사용",
          enableAppInstallList: "미사용",
          enableNotice: "미사용",
          enableAd: "미사용",
          enableMileage: "미사용",
          enablePointMall: "사용",
          enableDataWrite: "미사용",
          enableDataRead: "사용",
          enableOrderView: "무권한",
        });
        load();
      }
    } catch {
      alert("오류가 발생했습니다.");
    }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">상담원 관리</h1>
        <p className="text-gray-500 text-sm mt-1">상담원 리스트 / 로그인 상태 조회</p>
        <p className="text-gray-400 text-xs mt-1">
          백엔드 <code className="text-xs">/api/v1/admin/counselors</code> 응답 필드를 표시합니다.
        </p>
      </div>

      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 bg-[var(--sheet-header-bg)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">상담원 목록</h2>
            <span className="text-xs text-gray-500">총 {counselors.length}명</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 검색"
              className="px-2.5 py-1.5 border border-gray-300 rounded text-xs"
            />
            <button
              onClick={() => load()}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
            >
              검색
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded hover:bg-emerald-600"
            >
              상담원 등록
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left">아이디</th>
                <th className="px-4 py-2.5 text-left">이름</th>
                <th className="px-4 py-2.5 text-left">비밀번호</th>
                <th className="px-4 py-2.5 text-left">CID</th>
                <th className="px-4 py-2.5 text-left">로그인</th>
                <th className="px-4 py-2.5 text-left">사용</th>
                <th className="px-4 py-2.5 text-left">등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">로딩 중…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    상담원이 없습니다. 백엔드 `/admin/counselors` 응답을 확인하세요.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const registeredAt = c.registeredAt || c.createdAt;
                  return (
                    <tr key={c.id || c.loginId}>
                      <td className="px-4 py-2.5 font-medium">{c.loginId || c.id}</td>
                      <td className="px-4 py-2.5">{c.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{c.passwordMasked || c.password || "****"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{c.cid || ""}</td>
                      <td className="px-4 py-2.5">{c.loggedIn ? "로그인" : "로그아웃"}</td>
                      <td className="px-4 py-2.5">{c.enabled === false ? "0" : "1"}</td>
                      <td className="px-4 py-2.5 text-gray-500">{registeredAt || ""}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* 상담원 신규 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm">상담원 신규 등록</h2>
              <button
                onClick={() => !saving && setShowModal(false)}
                className="text-gray-400 hover:text-red-500 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">이름</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CID</label>
                  <input
                    name="cid"
                    value={form.cid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">아이디</label>
                  <input
                    name="loginId"
                    value={form.loginId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">비밀번호</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {[
                ["상담원리스트", "enableCounselList"],
                ["앱설치리스트", "enableAppInstallList"],
                ["공지사항설정", "enableNotice"],
                ["광고설정", "enableAd"],
                ["마일리지설정", "enableMileage"],
                ["포인트몰", "enablePointMall"],
                ["자료등록(쓰기)", "enableDataWrite"],
                ["자료등록(읽기)", "enableDataRead"],
                ["오더보기", "enableOrderView"],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                    {label}
                  </div>
                  <select
                    name={key}
                    value={(form as any)[key]}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded text-xs"
                  >
                    {key === "enableOrderView" ? (
                      <>
                        <option value="무권한">무권한</option>
                        <option value="사용">사용</option>
                      </>
                    ) : (
                      <>
                        <option value="사용">사용</option>
                        <option value="미사용">미사용</option>
                      </>
                    )}
                  </select>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => !saving && setShowModal(false)}
                className="px-4 py-2 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs rounded bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
