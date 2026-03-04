"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getDrivers, getAttendanceList, upsertAttendance, clearAttendanceMonth } from "@/lib/store";
import { Driver, AttendanceStatus } from "@/lib/types";

// 근태 코드 순환: 빈칸 → 정상(0) → 지각(지) → 결근(결) → 휴무(휴) → 빈칸
const CYCLE: AttendanceStatus[] = ["", "0", "지", "결", "휴"];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  "":  "bg-white text-gray-300",
  "0": "bg-green-100 text-green-700 font-bold",
  "지": "bg-yellow-200 text-yellow-800 font-bold",
  "결": "bg-red-200 text-red-700 font-bold",
  "휴": "bg-blue-100 text-blue-600 font-bold",
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function dayOfWeek(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay(); // 0=Sun
}

export default function AttendancePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [grid, setGrid] = useState<Record<string, Record<number, AttendanceStatus>>>({});
  // grid[driverId][day] = status
  const [now, setNow] = useState("");
  const [focusCell, setFocusCell] = useState<{ driverIdx: number; day: number } | null>(null);
  const [enterDir, setEnterDir] = useState<"down" | "right">("down");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(() => {
    const ds = getDrivers();
    setDrivers(ds);
    const att = getAttendanceList().filter((a) => a.year === year && a.month === month);
    const g: Record<string, Record<number, AttendanceStatus>> = {};
    ds.forEach((d) => {
      const rec = att.find((a) => a.driverId === d.id);
      g[d.id] = rec?.entries ?? {};
    });
    setGrid(g);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      setNow(`${d.getDate()}일 ${days[d.getDay()]}요일  ${d.toTimeString().slice(0, 8)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const totalDays = daysInMonth(year, month);
  const dayList = Array.from({ length: totalDays }, (_, i) => i + 1);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };
  const thisMonth = () => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); };

  // 셀 값 변경
  const handleCellChange = (driverId: string, driverName: string, day: number, value: string) => {
    let status: AttendanceStatus = "";
    const v = value.trim();
    if (v === "0" || v === "") status = v as AttendanceStatus;
    else if (v === "1" || v === "지") status = "지";
    else if (v === "2" || v === "결") status = "결";
    else if (v === "휴" || v === "3") status = "휴";
    else return;
    upsertAttendance(driverId, driverName, year, month, day, status);
    setGrid((prev) => ({
      ...prev,
      [driverId]: { ...(prev[driverId] ?? {}), [day]: status },
    }));
  };

  // 클릭 → 순환
  const handleCellClick = (driverId: string, driverName: string, day: number) => {
    const current = grid[driverId]?.[day] ?? "";
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    upsertAttendance(driverId, driverName, year, month, day, next);
    setGrid((prev) => ({
      ...prev,
      [driverId]: { ...(prev[driverId] ?? {}), [day]: next },
    }));
  };

  // Enter 이동
  const handleKeyDown = (
    e: React.KeyboardEvent, driverIdx: number, day: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (enterDir === "down") {
        const nextIdx = driverIdx + 1 < drivers.length ? driverIdx + 1 : 0;
        inputRefs.current[`${drivers[nextIdx]?.id}-${day}`]?.focus();
        setFocusCell({ driverIdx: nextIdx, day });
      } else {
        const nextDay = day + 1 <= totalDays ? day + 1 : 1;
        inputRefs.current[`${drivers[driverIdx]?.id}-${nextDay}`]?.focus();
        setFocusCell({ driverIdx, day: nextDay });
      }
    }
  };

  // 통계
  const countOf = (driverId: string, status: AttendanceStatus) =>
    Object.values(grid[driverId] ?? {}).filter((s) => s === status).length;

  const handleDeleteAll = (driverId: string, driverName: string) => {
    if (!confirm(`${driverName} 기사의 ${year}년 ${month}월 근태 데이터를 전부 삭제할까요?`)) return;
    clearAttendanceMonth(driverId, year, month);
    load();
  };

  // 보고서 출력
  const handleReport = () => window.print();

  return (
    <div className="flex flex-col h-screen bg-gray-200 overflow-hidden text-xs">

      {/* ─── 헤더 ─── */}
      <div className="bg-gray-300 border-b border-gray-400 px-3 py-2 flex items-center gap-3 flex-shrink-0">
        <span className="font-bold text-sm">기사님 근태관리</span>

        <span className="text-gray-600 ml-2">근태 처리 년월</span>
        <span className="text-red-600 font-bold text-sm">{year}년 {String(month).padStart(2, "0")}월</span>

        <span className="text-gray-500 ml-3">현재 일자/시간</span>
        <span className="font-mono text-blue-700 font-bold">{now}</span>

        <div className="ml-auto flex gap-1.5">
          {[
            { label: "달력", onClick: () => {} },
            { label: "이전달", onClick: prevMonth },
            { label: "다음달", onClick: nextMonth },
            { label: "금월", onClick: thisMonth },
          ].map(({ label, onClick }) => (
            <button key={label} onClick={onClick}
              className="px-3 py-1.5 bg-white border border-gray-400 rounded text-xs font-medium hover:bg-gray-50 shadow-sm">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-1.5 text-xs text-gray-600 flex-shrink-0">
        지각과 결근처리시 <span className="font-bold text-red-600">&apos;지&apos;</span>, <span className="font-bold text-red-600">&apos;결&apos;</span>로 입력하시거나 &nbsp;
        지각은 <span className="font-bold">&apos;1&apos;</span>로 &nbsp;결근은 <span className="font-bold">&apos;2&apos;</span>로 입력해도 됩니다.&nbsp;
        정상근무는 <span className="font-bold">&apos;0&apos;</span>으로, 휴무는 <span className="font-bold">&apos;휴&apos;</span>또는 <span className="font-bold">&apos;3&apos;</span>으로 입력하시면 됩니다.&nbsp;
        <span className="text-gray-400 ml-2">셀 클릭으로도 순환 입력 가능합니다.</span>
      </div>

      {/* ─── 그리드 ─── */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="border-collapse text-xs min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-3 py-1.5 w-24 text-left font-medium text-gray-700 sticky left-0 bg-gray-200 z-20">성명</th>
              {dayList.map((d) => {
                const dow = dayOfWeek(year, month, d);
                const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate();
                const isSun = dow === 0;
                const isSat = dow === 6;
                return (
                  <th key={d}
                    className={`border border-gray-400 w-7 py-1.5 text-center font-medium
                      ${isToday ? "bg-blue-800 text-white" : isSun ? "bg-red-100 text-red-600" : isSat ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}>
                    {String(d).padStart(2, "0")}
                  </th>
                );
              })}
              <th className="border border-gray-400 px-2 py-1.5 w-10 text-center text-yellow-700 font-bold bg-yellow-50">지각</th>
              <th className="border border-gray-400 px-2 py-1.5 w-10 text-center text-red-700 font-bold bg-red-50">결근</th>
              <th className="border border-gray-400 px-2 py-1.5 w-10 text-center text-green-700 font-bold bg-green-50">정상</th>
              <th className="border border-gray-400 px-2 py-1.5 w-10 text-center text-blue-700 font-bold bg-blue-50">휴무</th>
              <th className="border border-gray-400 px-2 py-1.5 w-12 text-center text-gray-500 bg-gray-100">삭제</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={totalDays + 6} className="py-10 text-center text-gray-400">
                  등록된 기사가 없습니다. 기사님 관리에서 먼저 등록하세요.
                </td>
              </tr>
            ) : drivers.map((driver, driverIdx) => {
              const lateCount = countOf(driver.id, "지");
              const absentCount = countOf(driver.id, "결");
              const normalCount = countOf(driver.id, "0");
              const offCount = countOf(driver.id, "휴");
              return (
                <tr key={driver.id}
                  className={driverIdx % 2 === 0 ? "bg-yellow-50 hover:bg-yellow-100" : "bg-white hover:bg-gray-50"}>
                  {/* 성명 */}
                  <td className={`border border-gray-300 px-2 py-1 font-bold text-gray-800 sticky left-0 z-10 ${driverIdx % 2 === 0 ? "bg-yellow-50" : "bg-white"}`}>
                    {driver.name}
                  </td>

                  {/* 일별 셀 */}
                  {dayList.map((d) => {
                    const dow = dayOfWeek(year, month, d);
                    const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && d === today.getDate();
                    const isSun = dow === 0;
                    const isSat = dow === 6;
                    const status = (grid[driver.id]?.[d] ?? "") as AttendanceStatus;
                    const cellKey = `${driver.id}-${d}`;
                    const isFocused = focusCell?.driverIdx === driverIdx && focusCell?.day === d;
                    return (
                      <td key={d}
                        onClick={() => handleCellClick(driver.id, driver.name, d)}
                        className={`border border-gray-200 w-7 h-7 text-center cursor-pointer select-none relative
                          ${isToday ? "border-blue-400 border-2" : ""}
                          ${isSun ? "bg-red-50" : isSat ? "bg-blue-50" : ""}`}>
                        <span className={`absolute inset-0 flex items-center justify-center text-xs rounded-sm ${STATUS_STYLE[status]}`}>
                          {status === "0" ? "○" : status}
                        </span>
                        {/* 숨김 input for keyboard navigation */}
                        <input
                          ref={(el) => { inputRefs.current[cellKey] = el; }}
                          className="sr-only"
                          onFocus={() => setFocusCell({ driverIdx, day: d })}
                          onKeyDown={(e) => handleKeyDown(e, driverIdx, d)}
                          onChange={(e) => handleCellChange(driver.id, driver.name, d, e.target.value)}
                          tabIndex={0}
                        />
                      </td>
                    );
                  })}

                  {/* 통계 */}
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold text-yellow-700 bg-yellow-50">{lateCount || 0}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold text-red-600 bg-red-50">{absentCount || 0}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold text-green-700 bg-green-50">{normalCount || 0}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center font-bold text-blue-600 bg-blue-50">{offCount || 0}</td>
                  <td className="border border-gray-300 px-1 py-1 text-center bg-gray-50">
                    <button onClick={() => handleDeleteAll(driver.id, driver.name)}
                      className="text-red-400 hover:text-red-600 text-[10px] px-1 rounded hover:bg-red-50">
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* 합계 행 */}
          {drivers.length > 0 && (
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td className="border border-gray-400 px-3 py-1.5 sticky left-0 bg-gray-200 z-10 text-gray-700">합계</td>
                {dayList.map((d) => {
                  const workedCount = drivers.filter((dr) => (grid[dr.id]?.[d] ?? "") === "0").length;
                  const hasAbsent = drivers.some((dr) => (grid[dr.id]?.[d] ?? "") === "결");
                  return (
                    <td key={d} className={`border border-gray-300 px-0 py-1 text-center text-[10px] ${hasAbsent ? "text-red-600" : "text-gray-500"}`}>
                      {workedCount > 0 ? workedCount : ""}
                    </td>
                  );
                })}
                <td className="border border-gray-400 px-1 py-1.5 text-center text-yellow-700">
                  {drivers.reduce((s, d) => s + countOf(d.id, "지"), 0)}
                </td>
                <td className="border border-gray-400 px-1 py-1.5 text-center text-red-700">
                  {drivers.reduce((s, d) => s + countOf(d.id, "결"), 0)}
                </td>
                <td className="border border-gray-400 px-1 py-1.5 text-center text-green-700">
                  {drivers.reduce((s, d) => s + countOf(d.id, "0"), 0)}
                </td>
                <td className="border border-gray-400 px-1 py-1.5 text-center text-blue-700">
                  {drivers.reduce((s, d) => s + countOf(d.id, "휴"), 0)}
                </td>
                <td className="border border-gray-400" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ─── 범례 ─── */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-1 flex-shrink-0 flex items-center gap-4">
        {([
          ["○ 정상(0)", "text-green-700 bg-green-100"],
          ["지 지각(1)", "text-yellow-800 bg-yellow-200"],
          ["결 결근(2)", "text-red-700 bg-red-200"],
          ["휴 휴무(3)", "text-blue-600 bg-blue-100"],
        ] as [string, string][]).map(([label, cls]) => (
          <span key={label} className={`px-2 py-0.5 rounded text-xs font-bold ${cls}`}>{label}</span>
        ))}
        <span className="text-gray-400 text-xs ml-2">셀 클릭 → 순환 입력</span>
      </div>

      {/* ─── 하단 버튼 ─── */}
      <div className="bg-gray-300 border-t border-gray-400 px-3 py-1.5 flex-shrink-0 flex items-center gap-2">
        {/* Enter 방향 */}
        <div className="flex flex-col gap-0.5 mr-2">
          <label className="flex items-center gap-1 cursor-pointer text-xs">
            <input type="radio" name="enterDir" checked={enterDir === "down"} onChange={() => setEnterDir("down")} className="accent-blue-600" />
            Enter: 아래이동
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-xs">
            <input type="radio" name="enterDir" checked={enterDir === "right"} onChange={() => setEnterDir("right")} className="accent-blue-600" />
            Enter: 우측이동
          </label>
        </div>

        <div className="w-px h-8 bg-gray-400 mx-1" />

        {[
          { icon: "🔍", label: "누락자료확인", shortcut: "F2", onClick: () => {
            const missing = drivers.filter((d) => Object.keys(grid[d.id] ?? {}).length === 0);
            alert(missing.length > 0 ? `미입력 기사: ${missing.map(d => d.name).join(", ")}` : "모든 기사 입력 완료");
          }},
          { icon: "🗑️", label: "자료삭제", shortcut: "F4", onClick: () => {
            if (!confirm(`${year}년 ${month}월 전체 근태 데이터를 삭제할까요?`)) return;
            drivers.forEach((d) => clearAttendanceMonth(d.id, year, month));
            load();
          }},
          { icon: "💬", label: "문자메세지", shortcut: "F7", onClick: () => alert("문자 발송 기능 (백엔드 연동 필요)") },
          { icon: "📊", label: "보 고 서", shortcut: "F9", onClick: handleReport },
        ].map(({ icon, label, shortcut, onClick }) => (
          <button key={label} onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-400 rounded text-xs font-medium hover:bg-gray-50 shadow-sm">
            <span>{icon}</span>{label}<span className="text-gray-400 text-[10px]">[{shortcut}]</span>
          </button>
        ))}

        <button onClick={() => {}}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white rounded text-xs font-bold hover:bg-orange-600 shadow-sm">
          ✅ 작업완료 <span className="opacity-70 text-[10px]">[Esc]</span>
        </button>
      </div>
    </div>
  );
}
