"use client";

import { hasAdminWebSession } from "@/lib/auth";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const ENDPOINTS = ["/admin/accumulation", "/admin/settings/accumulation"] as const;

export default function AccumulationPage() {
  const { getAccessToken } = useAuth();
  const [settings, setSettings] = useState({
    rideEarnRate: 10,
    cardPercent: 5,
    referralJoin: 2000,
    referralFirstRide: 3000,
    referralRidePercent: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!API_BASE || !hasAdminWebSession()) {
        setLoading(false);
        return;
      }
      for (const path of ENDPOINTS) {
        try {
          const res = await fetch(`${API_BASE}${path}`, {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const d = data.data || data;
            if (d) {
              setSettings((s) => ({
                ...s,
                rideEarnRate: d.rideEarnRate ?? s.rideEarnRate,
                cardPercent: d.cardPercent ?? d.cardPayRate ?? s.cardPercent,
                referralJoin: d.referralJoin ?? s.referralJoin,
                referralFirstRide: d.referralFirstRide ?? s.referralFirstRide,
                referralRidePercent: d.referralRidePercent ?? d.referrerRideRate ?? s.referralRidePercent,
              }));
            }
            break;
          }
        } catch {
          continue;
        }
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
      const body = {
        rideEarnRate: settings.rideEarnRate,
        cardPercent: settings.cardPercent,
        cardPayRate: settings.cardPercent,
        referralJoin: settings.referralJoin,
        referralFirstRide: settings.referralFirstRide,
        referralRidePercent: settings.referralRidePercent,
        referrerRideRate: settings.referralRidePercent,
      };
      let res: Response | null = null;
      for (const path of ENDPOINTS) {
        res = await fetch(`${API_BASE}${path}`, {
          credentials: "include",
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) break;
      }
      if (res?.ok) {
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
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">적립설정</h1>
          <p className="text-gray-500 text-sm mt-1">적립 비율 설정 (FE 전달 문서 1.1 기준)</p>
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

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {loading ? (
          <p className="text-gray-400 text-center py-8">로딩 중...</p>
        ) : (
          <>
            <div>
              <h2 className="font-semibold mb-3">앱 사용 적립</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-44">앱 이용 요금 적립 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.rideEarnRate}
                    onChange={(e) => setSettings((s) => ({ ...s, rideEarnRate: Number(e.target.value) }))}
                    disabled={!API_BASE}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-400 text-sm">앱 이용 완료 시 결제금액(fare)의 % 적립</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-3">카드 결제 적립</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-44">카드 결제 적립 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.cardPercent}
                    onChange={(e) => setSettings((s) => ({ ...s, cardPercent: Number(e.target.value) }))}
                    disabled={!API_BASE}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-400 text-sm">PG 결제 시 cardPayRate % 적립</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-3">추천인 설정</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-44">피추천인 가입 포인트(원)</label>
                  <input
                    type="number"
                    value={settings.referralJoin}
                    onChange={(e) => setSettings((s) => ({ ...s, referralJoin: Number(e.target.value) }))}
                    disabled={!API_BASE}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-44">피추천인 첫 이용 포인트(원)</label>
                  <input
                    type="number"
                    value={settings.referralFirstRide}
                    onChange={(e) => setSettings((s) => ({ ...s, referralFirstRide: Number(e.target.value) }))}
                    disabled={!API_BASE}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-44">피추천인 이용 루트 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.referralRidePercent}
                    onChange={(e) => setSettings((s) => ({ ...s, referralRidePercent: Number(e.target.value) }))}
                    disabled={!API_BASE}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-400 text-sm">fare × referrerRideRate %</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 space-y-1">
              ※ 앱 이용 완료 시 이용 요금 적립(rideEarnRate) + 마일리지 결제 시 금액 차감.
              <br />
              ※ 추천인: 피추천인 가입(referralJoin) + 첫 이용(referralFirstRide) + 이용 루트(referrerRideRate %).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
