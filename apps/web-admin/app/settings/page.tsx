"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ride_admin_settings";
const MAX_AREAS = 10;

interface Settings {
  areas: string[];
  fares: Record<string, Record<string, number>>;
}

function loadSettings(): Settings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch { return { areas: [], fares: {} }; }
}

function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function SettingsPage() {
  const [areas, setAreas] = useState<string[]>([]);
  const [fares, setFares] = useState<Record<string, Record<string, number>>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setAreas(s.areas ?? []);
    setFares(s.fares ?? {});
  }, []);

  const handleAreaChange = (i: number, value: string) => {
    setAreas((prev) => { const next = [...prev]; next[i] = value; return next; });
  };

  const addArea = () => {
    if (areas.length >= MAX_AREAS) return;
    setAreas((prev) => [...prev, `지역${prev.length + 1}`]);
  };

  const removeArea = (i: number) => {
    setAreas((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleFareChange = (from: string, to: string, value: string) => {
    setFares((prev) => ({
      ...prev,
      [from]: { ...(prev[from] ?? {}), [to]: Number(value) },
    }));
  };

  const getFare = (from: string, to: string) => fares[from]?.[to] ?? 0;

  const handleSave = () => {
    saveSettings({ areas, fares });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">요금 설정</h1>
        <p className="text-gray-500 text-sm mt-1">지역이름 및 요금 설정</p>
      </div>

      {/* 지역 설정 */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">지역 목록 설정</h2>
          <button
            onClick={addArea}
            disabled={areas.length >= MAX_AREAS}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition disabled:opacity-40"
          >
            + 지역 추가
          </button>
        </div>
        {areas.length === 0 ? (
          <p className="text-sm text-gray-400">지역을 추가하세요. (최대 {MAX_AREAS}개)</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {areas.map((a, i) => (
              <div key={i} className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                <input
                  value={a}
                  onChange={(e) => handleAreaChange(i, e.target.value)}
                  className="px-3 py-1.5 text-sm w-24 focus:outline-none"
                />
                <button
                  onClick={() => removeArea(i)}
                  className="px-2 py-1.5 text-red-400 hover:bg-red-50 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">지역명을 입력하면 콜 입력 시 드롭다운으로 선택할 수 있습니다.</p>
      </div>

      {/* 요금 행렬 */}
      {areas.length >= 2 && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h2 className="font-semibold mb-4">지역별 요금 설정 (원)</h2>
          <p className="text-xs text-gray-400 mb-3">행 = 출발지, 열 = 도착지. 흰색 칸에 요금을 입력하세요.</p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs text-center">
              <thead>
                <tr>
                  <th className="border border-gray-200 bg-blue-50 px-3 py-2 w-20">출발↓ 도착→</th>
                  {areas.map((a) => (
                    <th key={a} className="border border-gray-200 bg-blue-50 px-3 py-2 min-w-20">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {areas.map((from) => (
                  <tr key={from}>
                    <td className="border border-gray-200 bg-blue-50 px-3 py-2 font-medium">{from}</td>
                    {areas.map((to) => (
                      <td key={to} className="border border-gray-200 p-0">
                        {from === to ? (
                          <div className="bg-gray-100 h-full px-2 py-2 text-gray-300">—</div>
                        ) : (
                          <input
                            type="number"
                            value={getFare(from, to) || ""}
                            onChange={(e) => handleFareChange(from, to, e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-2 text-right focus:outline-none focus:bg-blue-50 text-xs"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            설정한 요금은 콜 입력 시 출발지/도착지 선택 시 자동으로 적용됩니다.
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition"
        >
          설정 저장
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ 저장됐습니다</span>}
      </div>

      {/* 안내 */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 space-y-1">
        <p>• 흰색 영역에 각 지역별 요금을 미리 설정하세요.</p>
        <p>• 설정한 지역별 요금은 콜 입력 화면에서 자동으로 반영됩니다.</p>
        <p>• 지역 설정은 최대 {MAX_AREAS}개까지 설정할 수 있습니다.</p>
      </div>
    </div>
  );
}
