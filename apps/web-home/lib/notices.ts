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

export const NOTICES: Notice[] = [
  {
    id: 1,
    badge: "공지",
    badgeColor: "bg-red-100 text-red-600",
    title: "2026년 연말 이벤트 안내 — 첫 이용 20% 할인",
    date: "2026.04.13",
    views: 1240,
    content: `안녕하세요, 일등대리입니다.

2026년을 마무리하며, 새해를 맞이하는 여러분께 특별한 이벤트를 준비했습니다.
첫 이용 고객분들께 20% 할인 혜택을 드립니다.

아래 이벤트 내용을 확인하시고, 많은 참여 부탁드립니다.`,
    events: [
      {
        title: "첫 이용 20% 할인",
        date: "2026.04.13 ~ 04.30",
        desc: "일등대리 앱 첫 이용 고객 대상 요금 20% 할인. 적용 요금 3만원 한도.",
      },
      {
        title: "연말 새해 귀가 지원",
        date: "2026.04.13 ~ 05.31",
        desc: "성수기 기간에도 동일 요금 적용. 사전 예약 시 추가 5% 할인 쿠폰 제공.",
      },
      {
        title: "친구 초대 보너스",
        date: "2026.04.13 ~ 04.30",
        desc: "이벤트 기간 중 친구 초대 시 초대자·피초대자 모두 1만원 마일리지 적립.",
      },
    ],
  },
  {
    id: 2,
    badge: "공지",
    badgeColor: "bg-red-100 text-red-600",
    title: "앱 업데이트 안내 (v2.3.0) — 실시간 위치공유 기능 추가",
    date: "2026.04.13",
    views: 987,
    content: `일등대리 앱 v2.3.0 업데이트를 안내드립니다.

이번 업데이트에서는 여러분이 요청해 주신 실시간 위치 공유 기능이 추가되었습니다.
기사님 배정 후, 대리운전 진행 상황을 실시간으로 확인하실 수 있습니다.

주요 변경 사항은 하단 이벤트 섹션에서 확인해 주세요.`,
    events: [
      {
        title: "실시간 위치 공유",
        date: "2026.04.13",
        desc: "기사 배정 후 출발지·경유지·도착지까지 실시간 경로 확인 가능. 지도에서 진행 상황 확인.",
      },
      {
        title: "도착 예상 시간 알림",
        date: "2026.04.13",
        desc: "기사 도착 5분 전 푸시 알림. 대기 시간을 더 효율적으로 활용하세요.",
      },
      {
        title: "결제 내역 다운로드",
        date: "2026.04.13",
        desc: "이용 완료 후 결제 내역 PDF 다운로드 지원. 세금계산서·영수증 보관에 활용 가능.",
      },
    ],
  },
  {
    id: 3,
    badge: "이벤트",
    badgeColor: "bg-blue-100 text-blue-600",
    title: "친구 초대 이벤트 — 초대할 때마다 마일리지 3,000원 적립",
    date: "2026.04.13",
    views: 2340,
    content: `일등대리 고객 여러분께 감사드립니다.

친구 초대 이벤트가 시작되었습니다. 친구를 초대하고 마일리지를 받아보세요.
초대한 친구가 첫 이용을 완료하면, 초대자와 피초대자 모두 혜택을 받으실 수 있습니다.

자세한 내용은 아래를 참고해 주세요.`,
    events: [
      {
        title: "초대자 혜택",
        date: "2026.04.13 ~ 05.31",
        desc: "친구 1명 초대 시 3,000원, 최대 10명까지 30,000원 마일리지 적립. 다음 이용 시 현금처럼 사용 가능.",
      },
      {
        title: "피초대자 혜택",
        date: "2026.04.13 ~ 05.31",
        desc: "초대 링크로 가입 후 첫 이용 시 5,000원 할인 쿠폰 자동 지급. 2만원 이상 이용 시 적용.",
      },
      {
        title: "추가 럭키드로우",
        date: "2026.04.13 ~ 05.31",
        desc: "친구 3명 이상 초대 시 럭키드로우 참여권 1장. 10만원 상당 기프트카드 추첨 (매주 5명).",
      },
    ],
  },
];

export function getNoticeById(id: number): Notice | undefined {
  return NOTICES.find((n) => n.id === id);
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
    coverImageUrl:
      typeof r.coverImageUrl === "string" && r.coverImageUrl.trim()
        ? r.coverImageUrl.trim()
        : undefined,
    events: (Array.isArray(r.events) ? r.events : []).map((e: Record<string, unknown>) => ({
      title: String(e.title ?? ""),
      date: String(e.date ?? ""),
      desc: String(e.desc ?? ""),
      imageUrl:
        typeof e.imageUrl === "string" && e.imageUrl.trim() ? e.imageUrl.trim() : undefined,
    })),
  };
}

/**
 * API에서 공지 목록 조회.
 * - 성공 시(배열로 파싱됨)에는 빈 배열이어도 그대로 반환(더 이상 샘플 NOTICES로 덮어쓰지 않음)
 * - API 미설정·오류·응답 형식 불가 시에만 정적 NOTICES 폴백
 */
const NOTICES_QS = "limit=50";

export async function fetchNotices(): Promise<Notice[]> {
  const rawEnv = getServerApiBaseRaw();
  if (!rawEnv) return NOTICES;
  // 상대 경로(`/api/v1`)만 있으면 web-home에는 리라이트가 없어 백엔드로 안 나감 → 샘플 폴백
  if (!isAbsoluteHttpUrl(rawEnv)) return NOTICES;

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

      return list.map((row) => mapNoticeRow(row as Record<string, unknown>));
    }
  } catch {
    // 네트워크 등
  }

  return NOTICES;
}

/** API에서 공지 1건 조회. 실패 시 정적 NOTICES에서 검색 */
export async function fetchNoticeById(id: string | number): Promise<Notice | null> {
  const notices = await fetchNotices();
  const n = notices.find((x) => String(x.id) === String(id));
  return n ?? null;
}
