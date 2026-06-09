const KST = "Asia/Seoul";

/** API 날짜 값 → Date (ISO UTC, epoch, naive KST 문자열 지원) */
function parseAdminDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const s = String(value).trim();
  if (!s) return null;

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // 타임존 없는 "YYYY-MM-DD HH:mm:ss" → KST로 해석
  const naive = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (naive) {
    const iso = `${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}:${naive[6] ?? "00"}+09:00`;
    const kst = new Date(iso);
    return Number.isNaN(kst.getTime()) ? null : kst;
  }

  return null;
}

/** 한국 시간(KST) YYYY-MM-DD HH:mm:ss */
export function formatDateTimeKST(value: unknown, fallback = "-"): string {
  const d = parseAdminDate(value);
  if (!d) return value != null && value !== "" ? String(value) : fallback;

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

/** 한국 시간(KST) YYYY-MM */
export function formatYearMonthKST(value: unknown, fallback = "-"): string {
  const d = parseAdminDate(value);
  if (!d) return fallback;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  if (!year || !month) return fallback;
  return `${year}-${month}`;
}
