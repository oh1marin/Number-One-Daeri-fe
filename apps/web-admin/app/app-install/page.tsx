"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** ISO 날짜 → YYYY.MM.DD 오전/오후 HH:mm */
function formatDateTime(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = h < 12 ? "오전" : "오후";
    const hour12 = h % 12 || 12;
    return `${y}-${m}-${day} ${ampm} ${hour12}:${min}`;
  } catch {
    return s;
  }
}

type ModalType =
  | "mileage"
  | "optOut"
  | "coupon"
  | "referrerDelete"
  | "referrerBulk"
  | "phoneBulk"
  | "sms"
  | "smsAll"
  | null;

export default function AppInstallPage() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const limit = 20;

  const [modal, setModal] = useState<ModalType>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const handleSuccess = (msg?: string) => {
    showToast("ok", msg ?? "처리되었습니다.");
    closeModal();
    load();
    setChecked(new Set());
  };

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setModal(null);
    setTargetUser(null);
  };

  const load = async () => {
    const token = getAccessToken();
    if (!API_BASE || !hasAdminWebSession()) {
      setItems([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (filter) params.set("filter", filter);
      const res = await fetch(`${API_BASE}/admin/app-install?${params}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.data?.items ?? data.data ?? data.items ?? data;
        const list = Array.isArray(raw) ? raw : [];
        setItems(list);
        setTotalCount(data.data?.total ?? data.total ?? list.length);
      } else {
        setItems([]);
        setTotalCount(0);
      }
    } catch {
      setItems([]);
      setTotalCount(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [getAccessToken, page, filter]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (items.length === 0) return;
    setChecked(new Set(items.map((r) => String(r.id ?? r.userId ?? "")).filter(Boolean)));
  };

  const selectNone = () => setChecked(new Set());

  const getCheckedIds = () => Array.from(checked).filter(Boolean);
  const hasChecked = checked.size > 0;

  const apiFetch = async (url: string, opts: RequestInit = {}) => {
    const token = getAccessToken();
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...opts.headers,
      },
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="p-6 max-w-full">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-2xl font-bold">앱 설치 현황</h1>
        <p className="text-gray-500 text-sm mt-1">전체 설치: {totalCount.toLocaleString()}건</p>
      </div>

      {/* 검??*/}
      <div className="flex gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">전체</option>
          <option value="installed">설치</option>
          <option value="not_installed">미설치</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="전화번호, 이름, 추천인 검색"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
        >
          검색
        </button>
      </div>

      {/* 실적 안내 */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
        <strong>실적(전체·자동·수동)</strong> : 실적이란 추천받은 사람이 실제 대리운전을 이용했을 때의 실적을 말합니다.
        (단, 추천받은 당일 같은 사람이 대리운전 이용이 10건이어도 1건으로 계산되며, 1차추천인에게만 해당)
      </div>

      {/* 테이블 */}
      <div className="sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="sheet-table w-full text-xs min-w-max">
            <thead>
              <tr>
                <th className="px-2 py-2 w-8 text-center">
                  <input
                    type="checkbox"
                    onChange={(e) => (e.target.checked ? selectAll() : selectNone())}
                    className="accent-blue-600"
                  />
                </th>
                <th className="px-3 py-2 text-left">최초추천인</th>
                <th className="px-3 py-2 text-left">전화번호</th>
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">분류</th>
                <th className="px-3 py-2 text-center">1차추천인</th>
                <th className="px-3 py-2 text-center">2차추천인</th>
                <th className="px-3 py-2 text-left">앱설치유형</th>
                <th className="px-3 py-2 text-center">실적</th>
                <th className="px-3 py-2 text-center">건수</th>
                <th className="px-3 py-2 text-left">등록일</th>
                <th className="px-3 py-2 text-center">마일리지</th>
                <th className="px-3 py-2 text-center">최신거래</th>
                <th className="px-3 py-2 text-center">쿠폰발송</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((r, i) => {
                  const id = String(r.id ?? r.userId ?? i);
                  const isChecked = checked.has(id);
                  return (
                    <tr key={id}>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(id)}
                          className="accent-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2">{r.referrerId ?? "최상위"}</td>
                      <td className="px-3 py-2 font-mono">{r.phone ?? r.mobile ?? r.phoneNumber ?? "—"}</td>
                      <td className="px-3 py-2">{r.name || "미입력"}</td>
                      <td className="px-3 py-2">{r.category ?? "—"}</td>
                      <td className="px-3 py-2 text-center">{r.referrer1Count ?? 0}</td>
                      <td className="px-3 py-2 text-center">{r.referrer2Count ?? 0}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                          {r.installed === true ? "설치" : "미설치"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">{r.performance ?? 0}</td>
                      <td className="px-3 py-2 text-center">{r.rideCount ?? 0}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {formatDateTime(r.createdAt ?? "") || "—"}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => {
                            setTargetUser(r);
                            setModal("mileage");
                          }}
                          className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs hover:bg-amber-300"
                        >
                          적립/차감
                        </button>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => {
                            setTargetUser(r);
                            setModal("optOut");
                          }}
                          className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs hover:bg-amber-300"
                        >
                          최신거래
                        </button>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          onClick={() => {
                            setTargetUser(r);
                            setModal("coupon");
                          }}
                          className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs hover:bg-orange-300"
                        >
                          쿠폰발송
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border rounded disabled:opacity-40"
            >
              &lt;
            </button>
            <span className="px-3 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 border rounded disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">전체 건수: {totalCount.toLocaleString()}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setModal("referrerDelete")}
              disabled={!hasChecked}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50"
            >
              추천관계 삭제
            </button>
            <button
              onClick={() => setModal("referrerBulk")}
              disabled={!hasChecked}
              className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 disabled:opacity-50"
            >
              추천인 강제등록
            </button>
            <button
              onClick={() => setModal("phoneBulk")}
              disabled={!hasChecked}
              className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 disabled:opacity-50"
            >
              번호 강제등록
            </button>
            <button
              onClick={() => setModal("sms")}
              disabled={!hasChecked}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded hover:bg-emerald-600 disabled:opacity-50"
            >
              메시지 발송
            </button>
            <button
              onClick={() => setModal("smsAll")}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600"
            >
              전체 메시지 발송
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppInstallModals
        modal={modal}
        targetUser={targetUser}
        checkedIds={getCheckedIds()}
        submitting={submitting}
        setSubmitting={setSubmitting}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onError={(msg) => showToast("err", msg)}
        apiFetch={apiFetch}
        API_BASE={API_BASE}
      />
    </div>
  );
}

/** 모달 컴포넌트 */
function AppInstallModals({
  modal,
  targetUser,
  checkedIds,
  submitting,
  setSubmitting,
  onClose,
  onSuccess,
  onError,
  apiFetch,
  API_BASE,
}: {
  modal: ModalType;
  targetUser: any;
  checkedIds: string[];
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
  onError: (msg: string) => void;
  apiFetch: (url: string, opts?: RequestInit) => Promise<Response>;
  API_BASE: string;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [couponId, setCouponId] = useState("");
  const [referrerId, setReferrerId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setAmount("");
    setReason("");
    setCouponId("");
    setReferrerId("");
    setPhone("");
    setMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const doMileage = async () => {
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt === 0) {
      onError("금액을 입력하세요 (양수: 적립, 음수: 차감)");
      return;
    }
    const uid = targetUser?.id ?? targetUser?.userId;
    if (!uid) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/mileage/adjust`, {
        method: "POST",
        body: JSON.stringify({ userId: uid, amount: amt, reason: reason || undefined }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        onSuccess();
      } else {
        onError(data?.message ?? "처리 실패");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const doOptOut = async () => {
    const uid = targetUser?.id ?? targetUser?.userId;
    if (!uid) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/users/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ smsOptOut: true }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        onSuccess();
      } else {
        onError(data?.message ?? "처리 실패");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const doCoupon = async () => {
    const cid = couponId.trim();
    if (!cid) {
      onError("쿠폰 ID를 입력하세요");
      return;
    }
    const uids = targetUser
      ? [targetUser.id ?? targetUser.userId]
      : checkedIds;
    if (!uids.length) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/coupons/send`, {
        method: "POST",
        body: JSON.stringify({ userIds: uids, couponId: cid }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        onSuccess();
      } else {
        onError(data?.message ?? "처리 실패");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const doReferrerDelete = async () => {
    if (!checkedIds.length) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/app-install/referrer`, {
        method: "DELETE",
        body: JSON.stringify({ ids: checkedIds }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        onSuccess();
      } else {
        onError(data?.message ?? "처리 실패");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const doReferrerBulk = async () => {
    const rid = referrerId.trim();
    if (!rid) {
      onError("추천인 ID를 입력하세요");
      return;
    }
    if (!checkedIds.length) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/users/bulk`, {
        method: "PATCH",
        body: JSON.stringify({ ids: checkedIds, referrerId: rid }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        onSuccess();
      } else {
        onError(data?.message ?? "처리 실패");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const doPhoneBulk = async () => {
    const ph = phone.trim();
    if (!ph) {
      onError("전화번호를 입력하세요");
      return;
    }
    if (!checkedIds.length) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin/users/bulk`, {
        method: "PATCH",
        body: JSON.stringify({ ids: checkedIds, phone: ph }),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        onSuccess();
      } else {
        onError(data?.message ?? "처리 실패 (unique 제약으로 1명만 지정 가능할 수 있음)");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const doSms = async (sendAll: boolean) => {
    const msg = message.trim();
    if (!msg) {
      onError("메시지를 입력하세요");
      return;
    }
    if (!sendAll && !checkedIds.length) return;
    setSubmitting(true);
    try {
      const body = sendAll
        ? { message: msg, sendAll: true }
        : { ids: checkedIds, message: msg };
      const res = await apiFetch(`${API_BASE}/admin/sms/send`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && (data.success !== false || data.data)) {
        const d = data.data ?? data;
        const sent = d.sent ?? d.total ?? 0;
        onSuccess(`발송 완료: ${sent}건`);
      } else {
        onError(data?.message ?? "처리 실패");
      }
    } catch {
      onError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  if (!modal) return null;

  const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  if (modal === "mileage") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">적립/차감</h3>
        <p className="text-xs text-gray-500 mb-2">{targetUser?.name || targetUser?.phone} · {targetUser?.phone}</p>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">금액 (양수: 적립, 음수: 차감)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 1000 또는 -500"
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">사유 (선택)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button onClick={doMileage} disabled={submitting} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm disabled:opacity-50">
            {submitting ? "처리 중…" : "적용"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (modal === "optOut") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">최신거래</h3>
        <p className="text-sm text-gray-600 mb-4">{targetUser?.name || targetUser?.phone} ({targetUser?.phone}) 님 문자 수신을 거부하시겠습니까?</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button onClick={doOptOut} disabled={submitting} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm disabled:opacity-50">
            {submitting ? "처리 중…" : "확인"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (modal === "coupon") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">쿠폰 발송</h3>
        <p className="text-xs text-gray-500 mb-2">
          {targetUser
            ? String(targetUser.name || targetUser.phone || "") + " (1명)"
            : "선택 " + String(checkedIds.length) + "명"}
        </p>
        <div>
          <label className="block text-xs text-gray-600 mb-1">쿠폰 ID</label>
          <input
            type="text"
            value={couponId}
            onChange={(e) => setCouponId(e.target.value)}
            placeholder="쿠폰 ID"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button onClick={doCoupon} disabled={submitting} className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm disabled:opacity-50">
            {submitting ? "처리 중…" : "발송"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (modal === "referrerDelete") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">추천관계 삭제</h3>
        <p className="text-sm text-gray-600 mb-4">선택 {checkedIds.length}명의 추천인 관계를 삭제합니다. 계속하시겠습니까?</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button onClick={doReferrerDelete} disabled={submitting} className="px-3 py-1.5 bg-red-500 text-white rounded text-sm disabled:opacity-50">
            {submitting ? "처리 중…" : "삭제"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (modal === "referrerBulk") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">추천인 강제등록</h3>
        <p className="text-xs text-gray-500 mb-2">선택 {checkedIds.length}명</p>
        <div>
          <label className="block text-xs text-gray-600 mb-1">추천인 ID (전화번호 등)</label>
          <input
            type="text"
            value={referrerId}
            onChange={(e) => setReferrerId(e.target.value)}
            placeholder="추천인 ID"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button onClick={doReferrerBulk} disabled={submitting} className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm disabled:opacity-50">
            {submitting ? "처리 중…" : "등록"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (modal === "phoneBulk") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">번호 강제등록</h3>
        <p className="text-xs text-gray-500 mb-2">선택 {checkedIds.length}명 (unique 제약으로 1명만 지정 가능)</p>
        <div>
          <label className="block text-xs text-gray-600 mb-1">전화번호</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button onClick={doPhoneBulk} disabled={submitting} className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm disabled:opacity-50">
            {submitting ? "처리 중…" : "등록"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  if (modal === "sms" || modal === "smsAll") {
    return (
      <ModalOverlay>
        <h3 className="font-semibold mb-3">{modal === "smsAll" ? "전체 메시지 발송" : "메시지 발송"}</h3>
        <p className="text-xs text-gray-500 mb-2">
          {modal === "smsAll" ? "전체 회원 (최신거래 등 제외)" : "선택 " + checkedIds.length + "명"}
        </p>
        <div>
          <label className="block text-xs text-gray-600 mb-1">메시지</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="발송할 문자 내용"
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={handleClose} className="px-3 py-1.5 border rounded text-sm">취소</button>
          <button
            onClick={() => doSms(modal === "smsAll")}
            disabled={submitting}
            className="px-3 py-1.5 bg-emerald-500 text-white rounded text-sm disabled:opacity-50"
          >
            {submitting ? "처리 중…" : "발송"}
          </button>
        </div>
      </ModalOverlay>
    );
  }

  return null;
}
