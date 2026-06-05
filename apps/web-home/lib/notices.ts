import {
  getApiOriginWithoutV1,
  getApiV1Base,
  getServerApiBaseRaw,
  isAbsoluteHttpUrl,
} from "./apiBase";

export interface NoticeEvent {
  title: string;
  date: string;
  desc: string;
  imageUrl?: string;
}

export interface Notice {
  id: number | string;
  badge: string;
  badgeColor: string;
  title: string;
  date: string;
  views: number;
  content: string;
  coverImageUrl?: string;
  events: NoticeEvent[];
}

/** 웹 홈/공지 목록에서 제외 — 더 이상 대외 노출하지 않는 샘플·구버전 공지 */
function isExcludedFromPublicWebNotice(n: Notice): boolean {
  const t = `${n.title ?? ""} ${n.content ?? ""}`;
  if (/앱\s*업데이트/i.test(t)) return true;
  if (/v2\.3\.0/i.test(t)) return true;
  if (/실시간\s*위치\s*공유/i.test(t) && (/업데이트|추가|안내/i.test(t) || /기능/i.test(t))) return true;
  return false;
}

function filterPublicNotices(list: Notice[]): Notice[] {
  return list.filter((n) => !isExcludedFromPublicWebNotice(n));
}

/** API 폴백용 — 앱·FAQ에 표시되는 혜택 문구 기준: docs/app-benefits-copy.md */
export const NOTICES: Notice[] = [
  {
    id: 1,
    badge: "안내",
    badgeColor: "bg-red-100 text-red-600",
    title: "마일리지 적립·가입 혜택 안내",
    date: "2026.05.15",
    views: 1820,
    content: `안녕하세요, 일등대리입니다.

앱 홈·마일리지·FAQ·카드 관리 화면에 안내되어 있는 적립 기준을 공지사항으로도 정리해 드립니다.
실제 지급·적립 조건은 서버·약관·운영 정책을 기준으로 하시기 바랍니다.`,
    events: [
      {
        title: "가입·카드 결제 적립",
        date: "2026.05.15",
        desc: "가입 시 10,000원 지급, 카드 결제 시 이용금액의 10% 적립됩니다. (마일리지 화면·FAQ 문구와 동일)\n카드 관리: 카드거래시, 요금의 10% 마일리지적립.",
      },
      {
        title: "전화 접수 적립",
        date: "2026.05.15",
        desc: "전화 접수 시 10% 적립됩니다. (1668-0001, FAQ 문구와 동일)",
      },
      {
        title: "추천 없이 가입 완료 시",
        date: "2026.05.15",
        desc: "앱 가입 완료 시 10,000원 적립 (추천 아님) + 카드 결제 시 이용금액의 10% 적립. (추천인 현황 기본 혜택 문구와 동일)",
      },
    ],
  },
  {
    id: 2,
    badge: "이벤트",
    badgeColor: "bg-blue-100 text-blue-600",
    title: "신규 가입 시 1만원, 친구 추천 이벤트 안내",
    date: "2026.05.15",
    views: 2410,
    content: `일등대리 고객 여러분께 감사드립니다.

앱 홈 공지/배너 폴백 제목과 동일하게, 신규 가입 1만원 혜택과 친구 추천 관련 금액·흐름을 안내드립니다.
친구 초대 배너: 「친구 초대하고 혜택 받기」, 배지에 10,000원 + 2,000원 표기.`,
    events: [
      {
        title: "내추천인 등록·추천인 혜택",
        date: "2026.05.15",
        desc: "추천받은 사람: 가입 시 10,000원. 나를 추천해 준 분: 친구 등록 시 2,000원.\n추천인 혜택 흐름: 친구 가입 시 2,000원 → 첫 이용 시 3,000원 추가 → 친구 이용할 때마다 이용금액의 2% 적립.\n빈 상태 안내 문구: 친구 추천하면 2천원! 첫 이용 시 3천원! 이용할 때마다 2%",
      },
      {
        title: "친구 추천 상품 쿠폰(실물)",
        date: "2026.05.15",
        desc: "쿠폰함: 2명 추천 → 스타벅스 음료 쿠폰 2장 / 5명 추천 → 교촌치킨 세트 쿠폰.\n쿠폰은 마일리지와 별도로 지급되며, 유효기간은 발급일로부터 30일입니다.",
      },
      {
        title: "공유 시 문구 예시",
        date: "2026.05.15",
        desc: "일등대리 1668-0001 완전대박! 앱 다운받고 혜택 받아가세요 🚗",
      },
    ],
  },
  {
    id: 3,
    badge: "안내",
    badgeColor: "bg-red-100 text-red-600",
    title: "마일리지 출금 안내",
    date: "2026.05.15",
    views: 960,
    content: `마일리지 출금 화면·FAQ에 표시된 조건을 공지로 정리합니다.

FAQ에는 「잔액 전액 출금 가능」과 「20,000원 이상 10,000원 단위」 안내가 함께 있으니, 출금 신청 전 앱 내 안내를 확인해 주세요.`,
    events: [
      {
        title: "출금 금액·단위",
        date: "2026.05.15",
        desc: "최소 20,000원, 단위 10,000원. (출금 화면 검증 메시지·FAQ와 동일)",
      },
      {
        title: "수수료·처리 기간",
        date: "2026.05.15",
        desc: "출금 시 500원 수수료가 부과됩니다. 영업일 기준 1~2일 내 처리됩니다. (출금 화면 안내 문단과 동일)",
      },
    ],
  },
];

export function getNoticeById(id: number): Notice | undefined {
  return filterPublicNotices(NOTICES).find((n) => n.id === id);
}

function extractNoticeList(data: unknown): unknown[] | null {
  if (data == null) return null;
  if (Array.isArray(data)) return data;
  if (typeof data !== "object") return null;
  const o = data as Record<string, unknown>;

  const nested = o.data;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    for (const key of ["items", "notices", "list", "results"] as const) {
      const v = d[key];
      if (Array.isArray(v)) return v;
    }
  }

  for (const key of ["items", "notices", "list", "results"] as const) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }

  return null;
}

function resolvePublicMediaUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (isAbsoluteHttpUrl(u)) return u;
  const origin = getApiOriginWithoutV1();
  if (u.startsWith("/")) return `${origin}${u}`;
  return `${origin}/${u}`;
}

function mapNoticeRow(r: Record<string, unknown>): Notice {
  return {
    id:
      typeof r.id === "string" || typeof r.id === "number"
        ? r.id
        : r.id != null
          ? String(r.id)
          : 0,
    badge: String(r.badge ?? "공지"),
    badgeColor: String(r.badgeColor ?? "bg-red-100 text-red-600"),
    title: String(r.title ?? ""),
    date: String(r.date ?? ""),
    views: Number(r.views ?? 0),
    content: String(r.content ?? ""),
    coverImageUrl: resolvePublicMediaUrl(
      typeof r.coverImageUrl === "string" ? r.coverImageUrl : undefined
    ),
    events: (Array.isArray(r.events) ? r.events : []).map((e: Record<string, unknown>) => ({
      title: String(e.title ?? ""),
      date: String(e.date ?? ""),
      desc: String(e.desc ?? ""),
      imageUrl: resolvePublicMediaUrl(
        typeof e.imageUrl === "string" ? e.imageUrl : undefined
      ),
    })),
  };
}

/**
 * API에서 공지 목록 조회.
 * - 성공 시(배열로 파싱됨)에는 빈 배열이어도 그대로 반환(더 이상 샘플 NOTICES로 덮어쓰지 않음)
 * - API 미설정·오류·응답 형식 불가 시에만 정적 NOTICES 폴백
 */
const NOTICES_QS = "limit=50";

let warnedMissingApiBase = false;

export async function fetchNotices(): Promise<Notice[]> {
  const rawEnv = getServerApiBaseRaw();
  if (!rawEnv) {
    if (process.env.NODE_ENV === "production" && !warnedMissingApiBase) {
      warnedMissingApiBase = true;
      console.warn(
        "[web-home] 백엔드 URL 미설정: Vercel 환경변수에 RIDE_API_BASE_URL=https://<API호스트>/api/v1 (또는 NEXT_PUBLIC_API_BASE_URL) 를 넣고 재배포하세요. 지금은 샘플 공지만 보일 수 있습니다."
      );
    }
    return filterPublicNotices(NOTICES);
  }
  // 상대 경로(`/api/v1`)만 있으면 web-home에는 리라이트가 없어 백엔드로 안 나감 → 샘플 폴백
  if (!isAbsoluteHttpUrl(rawEnv)) return filterPublicNotices(NOTICES);

  const apiV1 = getApiV1Base();
  const origin = getApiOriginWithoutV1();
  const urls = Array.from(
    new Set([
      `${apiV1}/notices?${NOTICES_QS}`,
      `${origin}/notices?${NOTICES_QS}`,
      `${apiV1}/public/notices?${NOTICES_QS}`,
    ])
  );

  try {
    for (const url of urls) {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        continue;
      }

      const list = extractNoticeList(data);
      if (list === null) continue;

      return filterPublicNotices(list.map((row) => mapNoticeRow(row as Record<string, unknown>)));
    }
  } catch {
    // 네트워크 등
  }

  return filterPublicNotices(NOTICES);
}

/** API에서 공지 1건 조회. 실패 시 정적 NOTICES에서 검색 */
export async function fetchNoticeById(id: string | number): Promise<Notice | null> {
  const notices = await fetchNotices();
  const n = notices.find((x) => String(x.id) === String(id));
  return n ?? null;
}
