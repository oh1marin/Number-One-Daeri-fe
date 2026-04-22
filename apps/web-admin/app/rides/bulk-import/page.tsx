"use client";

import { hasAdminWebSession } from "@/lib/auth";
import { adminCredentialsInit, getAdminApiFailureMessage, readAdminResponseBody } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/** 파일 라벨용 — `Button variant="secondary"` 와 유사한 보조 버튼 스타일 */
const buttonLikeSecondary =
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold h-9 px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all";

function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buf = reader.result;
        if (!buf || !(buf instanceof ArrayBuffer)) {
          resolve(XLSX.utils.book_new());
          return;
        }
        const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
        resolve(wb);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** 헤더 셀 → API 필드명 (한글/영문) */
function canonicalRideHeader(h: string): string {
  const k = String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  const m: Record<string, string> = {
    date: "date",
    일자: "date",
    접수일: "date",
    time: "time",
    시간: "time",
    접수시간: "time",
    customername: "customerName",
    고객명: "customerName",
    이름: "customerName",
    고객: "customerName",
    phone: "phone",
    전화: "phone",
    전화번호: "phone",
    휴대폰: "phone",
    연락처: "phone",
    pickup: "pickup",
    출발지: "pickup",
    출발: "pickup",
    dropoff: "dropoff",
    목적지: "dropoff",
    도착지: "dropoff",
    목적: "dropoff",
    fare: "fare",
    요금: "fare",
    기본요금: "fare",
    discount: "discount",
    할인: "discount",
    extra: "extra",
    추가: "extra",
    total: "total",
    합계: "total",
    총액: "total",
    estimatedfare: "estimatedFare",
    예정요금: "estimatedFare",
    paymentmethod: "paymentMethod",
    결제방법: "paymentMethod",
    결제: "paymentMethod",
    status: "status",
    상태: "status",
    drivername: "driverName",
    기사명: "driverName",
    기사: "driverName",
    note: "note",
    비고: "note",
    메모: "note",
  };
  return m[k] || k;
}

function parseRideSheet(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
  }) as (string | number | null)[][];
  if (rows.length < 2) return [];
  const headers = (rows[0] || []).map((c) => canonicalRideHeader(String(c)));
  const out: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (!key || key.startsWith("__")) continue;
      const raw = row[j];
      const val = raw === "" || raw == null ? undefined : raw;
      if (val !== undefined) obj[key] = val;
    }
    out.push(obj);
  }
  return out;
}

function canonicalMileageHeader(h: string): string {
  const k = String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  const m: Record<string, string> = {
    userid: "userId",
    이용자id: "userId",
    회원id: "userId",
    phone: "phone",
    전화: "phone",
    전화번호: "phone",
    휴대폰: "phone",
    amount: "amount",
    변동액: "amount",
    적용액: "amount",
    마일리지: "amount",
    금액: "amount",
    reason: "reason",
    사유: "reason",
    비고: "reason",
  };
  return m[k] || k;
}

function parseMileageSheet(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
  }) as (string | number | null)[][];
  if (rows.length < 2) return [];
  const headers = (rows[0] || []).map((c) => canonicalMileageHeader(String(c)));
  const out: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (!key || key.startsWith("__")) continue;
      const raw = row[j];
      const val = raw === "" || raw == null ? undefined : raw;
      if (val !== undefined) obj[key] = val;
    }
    out.push(obj);
  }
  return out;
}

const RIDE_TEMPLATE_HEADERS = [
  "일자",
  "시간",
  "고객명",
  "전화번호",
  "출발지",
  "목적지",
  "요금",
  "할인",
  "추가",
  "합계",
  "예정요금",
  "결제방법",
  "상태",
  "기사명",
  "비고",
];

const RIDE_SAMPLE_ROW = [
  "2026-04-10",
  "14:30",
  "홍길동",
  "01012345678",
  "서울시 강남구",
  "서울시 송파구",
  "25000",
  "0",
  "0",
  "25000",
  "",
  "현금",
  "완료",
  "김기사",
  "엑셀 일괄",
];

const MILEAGE_TEMPLATE_HEADERS = ["전화번호", "userId", "변동액", "사유"];
const MILEAGE_SAMPLE_ROW = ["01012345678", "", "5000", "이벤트 적립"];

function downloadRideTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([RIDE_TEMPLATE_HEADERS, RIDE_SAMPLE_ROW]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "운행");
  XLSX.writeFile(wb, "운행_일괄등록_양식.xlsx");
}

function downloadMileageTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([MILEAGE_TEMPLATE_HEADERS, MILEAGE_SAMPLE_ROW]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "마일리지");
  XLSX.writeFile(wb, "마일리지_일괄조정_양식.xlsx");
}

export default function RidesBulkImportPage() {
  const { getAccessToken } = useAuth();
  const [tab, setTab] = useState<"rides" | "mileage">("rides");
  const [linkUserByPhone, setLinkUserByPhone] = useState(true);
  const [rideRows, setRideRows] = useState<Record<string, unknown>[]>([]);
  const [mileageRows, setMileageRows] = useState<Record<string, unknown>[]>([]);
  const [rideFileName, setRideFileName] = useState("");
  const [mileageFileName, setMileageFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRideFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const wb = await readWorkbookFromFile(file);
      const name = wb.SheetNames[0];
      const sheet = name ? wb.Sheets[name] : undefined;
      if (!sheet) {
        setRideRows([]);
        setRideFileName("");
        setError("시트가 없습니다.");
        return;
      }
      const rows = parseRideSheet(sheet);
      setRideRows(rows);
      setRideFileName(file.name);
    } catch (err) {
      setRideRows([]);
      setRideFileName("");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const onMileageFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const wb = await readWorkbookFromFile(file);
      const name = wb.SheetNames[0];
      const sheet = name ? wb.Sheets[name] : undefined;
      if (!sheet) {
        setMileageRows([]);
        setMileageFileName("");
        setError("시트가 없습니다.");
        return;
      }
      const rows = parseMileageSheet(sheet);
      setMileageRows(rows);
      setMileageFileName(file.name);
    } catch (err) {
      setMileageRows([]);
      setMileageFileName("");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const submitRides = async () => {
    setError(null);
    setMessage(null);
    if (!API_BASE || !hasAdminWebSession()) {
      setError("API 주소 또는 로그인 세션을 확인하세요.");
      return;
    }
    if (rideRows.length === 0) {
      setError("먼저 엑셀을 불러오세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/rides/bulk-import`,
        adminCredentialsInit(getAccessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: rideRows, linkUserByPhone }),
        }),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const data = (json as { data?: { created?: number; linkedUsers?: number } }).data;
      setMessage(
        `등록 완료: ${data?.created ?? 0}건` +
          (data?.linkedUsers != null ? ` (앱 회원 연결 ${data.linkedUsers}건)` : ""),
      );
      setRideRows([]);
      setRideFileName("");
    } finally {
      setBusy(false);
    }
  };

  const submitMileage = async () => {
    setError(null);
    setMessage(null);
    if (!API_BASE || !hasAdminWebSession()) {
      setError("API 주소 또는 로그인 세션을 확인하세요.");
      return;
    }
    if (mileageRows.length === 0) {
      setError("먼저 엑셀을 불러오세요.");
      return;
    }
    const items = mileageRows.map((r) => ({
      userId: r.userId != null ? String(r.userId).trim() : undefined,
      phone: r.phone != null ? String(r.phone).trim() : undefined,
      amount: typeof r.amount === "number" ? r.amount : Number(String(r.amount).replace(/,/g, "")),
      reason: r.reason != null ? String(r.reason) : undefined,
    }));
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.userId && !row.phone) {
        setError(`행 ${i + 1}: 전화번호 또는 userId가 필요합니다.`);
        return;
      }
      if (!Number.isFinite(row.amount) || row.amount === 0) {
        setError(`행 ${i + 1}: 변동액(amount)은 0이 아닌 숫자여야 합니다.`);
        return;
      }
    }
    setBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/mileage/bulk-adjust`,
        adminCredentialsInit(getAccessToken, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }),
      );
      const { json, rawText } = await readAdminResponseBody(res);
      if (!res.ok) {
        setError(getAdminApiFailureMessage(res, json, rawText));
        return;
      }
      const data = (json as { data?: { processed?: number } }).data;
      setMessage(`처리 완료: ${data?.processed ?? items.length}건`);
      setMileageRows([]);
      setMileageFileName("");
    } finally {
      setBusy(false);
    }
  };

  const preview = tab === "rides" ? rideRows.slice(0, 15) : mileageRows.slice(0, 15);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">엑셀자료등록</h1>
      <p className="text-gray-500 text-sm mb-6">
        첫 번째 시트, 첫 행은 헤더입니다. 양식을 내려받아 작성한 뒤 업로드하고 미리보기를 확인한 다음 서버에 반영합니다.
      </p>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "rides" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
          }`}
          onClick={() => {
            setTab("rides");
            setError(null);
            setMessage(null);
          }}
        >
          운행(Ride) 일괄
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "mileage" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
          }`}
          onClick={() => {
            setTab("mileage");
            setError(null);
            setMessage(null);
          }}
        >
          마일리지 일괄 조정
        </button>
      </div>

      {tab === "rides" ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-900">
            <strong>필수 열:</strong> 고객명, 출발지, 목적지. <strong>선택:</strong> 일자·시간(비우면 오늘/현재),
            전화번호, 요금·할인·추가·합계, 예정요금, 결제방법(현금/카드/마일리지 등), 상태(완료/대기 등), 기사명,
            비고. 합계가 비어 있으면 요금+추가-할인으로 계산합니다. 전화번호가 앱 회원과 일치하면{" "}
            <code className="text-xs bg-amber-100 px-1 rounded">userId</code>로 연결됩니다.
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={linkUserByPhone}
              onChange={(e) => setLinkUserByPhone(e.target.checked)}
            />
            전화번호로 앱 회원 연결 (userId)
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" variant="outline" onClick={downloadRideTemplate}>
              운행 양식 다운로드
            </Button>
            <input
              id="ride-bulk-xlsx"
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={onRideFile}
            />
            <label htmlFor="ride-bulk-xlsx" className="inline-flex cursor-pointer">
              <span className={buttonLikeSecondary}>엑셀 선택</span>
            </label>
            {rideFileName ? <span className="text-sm text-gray-600">{rideFileName} · {rideRows.length}행</span> : null}
            <Button type="button" onClick={submitRides} disabled={busy || rideRows.length === 0}>
              {busy ? "처리 중…" : "서버에 등록"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-900">
            <strong>행마다:</strong> <code className="text-xs bg-amber-100 px-1 rounded">변동액</code> 양수는 적립,
            음수는 차감입니다. <code className="text-xs bg-amber-100 px-1 rounded">전화번호</code> 또는{" "}
            <code className="text-xs bg-amber-100 px-1 rounded">userId</code> 중 하나는 필수이며, 전화번호는 DB에
            등록된 앱 회원 번호(숫자만 비교)와 맞아야 합니다. 한 요청 전체가 하나의 트랜잭션으로 처리됩니다(중간 실패 시
            전부 롤백).
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" variant="outline" onClick={downloadMileageTemplate}>
              마일리지 양식 다운로드
            </Button>
            <input
              id="mileage-bulk-xlsx"
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={onMileageFile}
            />
            <label htmlFor="mileage-bulk-xlsx" className="inline-flex cursor-pointer">
              <span className={buttonLikeSecondary}>엑셀 선택</span>
            </label>
            {mileageFileName ? (
              <span className="text-sm text-gray-600">
                {mileageFileName} · {mileageRows.length}행
              </span>
            ) : null}
            <Button type="button" onClick={submitMileage} disabled={busy || mileageRows.length === 0}>
              {busy ? "처리 중…" : "서버에 반영"}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <div className="mt-4 text-sm text-red-600 whitespace-pre-wrap" role="alert">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-4 text-sm text-green-700" role="status">
          {message}
        </div>
      ) : null}

      {preview.length > 0 ? (
        <div className="mt-8 sheet-wrap overflow-hidden bg-white rounded-xl shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 bg-[var(--sheet-header-bg)]">
            <h2 className="font-semibold text-sm">미리보기 (최대 15행)</h2>
          </div>
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="sheet-table w-full text-xs">
              <thead>
                <tr>
                  {Object.keys(preview[0] || {}).map((k) => (
                    <th key={k} className="px-3 py-2 text-left whitespace-nowrap">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.keys(preview[0] || {}).map((k) => (
                      <td key={k} className="px-3 py-2 max-w-[200px] truncate" title={String(row[k] ?? "")}>
                        {String(row[k] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
