export const CUSTOMER_CATEGORIES = [
  "동창", "직장동료", "지인", "거래처", "일반회원",
  "종신회원", "특별회원", "친지가족", "매입처", "매출처", "본인",
] as const;

export type CustomerCategory = (typeof CUSTOMER_CATEGORIES)[number] | string;

/** 통합 고객 목록 항목 (Customer + 앱 회원) */
export interface CustomerListItem {
  id: string;
  source: "customer" | "app_user";
  no: number | null;
  registeredAt: string;
  category: string;
  name: string;
  phone?: string;
  mobile?: string;
  address?: string;
  addressDetail?: string;
  info?: string;
  dmSend?: boolean;
  smsSend?: boolean;
  otherPhone?: string;
  email?: string;
  mileageBalance?: number;
  rideCount?: number;
  /** 1차추천인 수 (추천 쿠폰 관리/통계에서 사용될 수 있음) */
  referrer1Count?: number;
  /** 2차추천인 수 (필요 시 사용) */
  referrer2Count?: number;
  referrerId?: string;
  memberNo?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  no: number;               // 고객번호
  registeredAt: string;     // 등록일자 (YYYY-MM-DD)
  dmSend: boolean;          // D.M 발송
  smsSend: boolean;         // 문자발송
  category: CustomerCategory; // 고객분류
  name: string;             // 고객성명
  info: string;             // 고객정보
  memberNo: string;         // 회원번호
  address: string;          // 주소
  addressDetail: string;
  phone: string;            // 전화번호
  mobile: string;           // 휴대폰
  otherPhone: string;       // 기타전화
  notes: string;            // 기타사항
  referrerId: string;       // 추천인 고객 ID
}

// ─── 기사 ────────────────────────────────────────────────────────
export const TIME_SLOTS = ["아무때나", "새벽1시이후", "오전", "오후", "야간", "주간", "오전·오후"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number] | string;

export interface Driver {
  id: string;
  no: number;               // 관리번호
  registeredAt: string;     // 등록일자 (YYYY-MM-DD)
  name: string;             // 성명
  region: string;           // 담당지역
  timeSlot: TimeSlot;       // 시간대
  address: string;          // 주소
  addressZip: string;       // 우편번호
  addressDetail: string;    // 상세주소
  phone: string;            // 전화번호
  mobile: string;           // 휴대폰
  licenseNo: string;        // 면허번호
  residentNo: string;       // 주민번호
  aptitudeTest: string;     // 적성검사 (날짜~)
  notes: string;
}

// ─── 근태 ────────────────────────────────────────────────────────
export type AttendanceStatus = "" | "0" | "지" | "결" | "휴";

export interface AttendanceMonth {
  id: string;
  driverId: string;
  driverName: string;
  year: number;
  month: number; // 1-12
  entries: Record<number, AttendanceStatus>; // day(1~31) -> status
}

// ─── 세금계산서 ──────────────────────────────────────────────────
export interface InvoiceItem {
  id: string;
  name: string;       // 품목
  spec: string;       // 규격
  unitPrice: number;  // 단가
  quantity: number;   // 수량
  supplyAmt: number;  // 공급가액
  vatRate: number;    // 부가세율 (%)
  vatAmt: number;     // 부가세액
}

export interface Invoice {
  id: string;
  docNo: string;          // 문서번호
  tradeDate: string;      // 거래일자 (YYYY-MM-DD)
  items: InvoiceItem[];
  totalSupply: number;    // 공급가액 합계
  totalVat: number;       // 부가세 합계
  totalAmt: number;       // 합계금액
  vatIncluded: boolean;   // 부가세 포함 여부
  memo: string;
  type: "tax" | "trade";  // 세금계산서 | 거래명세서
}

export interface InvoiceSettings {
  bizNo: string;          // 등록번호
  companyName: string;    // 업체명
  ceoName: string;        // 대표자명
  address: string;        // 사업장
  businessType: string;   // 업태
  businessCategory: string; // 종목
  phone: string;          // 전화번호
  // 인쇄 옵션
  itemKorean: boolean;
  specKorean: boolean;
  blankZeroQty: boolean;
  blankZeroSupply: boolean;
  printSpecAsUnit: boolean;
  printTradeDate: boolean;
  noDocNo: boolean;
  printFooter1: boolean;
  printFooter1Text: string;
  printFooter2: boolean;
  printFooter2Text: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  bizNo: "", companyName: "", ceoName: "", address: "",
  businessType: "", businessCategory: "", phone: "",
  itemKorean: true, specKorean: true, blankZeroQty: false,
  blankZeroSupply: false, printSpecAsUnit: true,
  printTradeDate: false, noDocNo: false,
  printFooter1: true, printFooter1Text: "",
  printFooter2: false, printFooter2Text: "",
};

export interface RideRecord {
  id: string;
  customerName: string;   // 고객명 및 업소명
  phone: string;          // 연락처
  date: string;           // 날짜 (YYYY-MM-DD)
  time: string;           // 시간 (HH:mm)
  driverName: string;     // 기사명
  pickup: string;         // 출발지
  dropoff: string;        // 도착지
  fare: number;           // 요금
  discount: number;       // 할인금액
  extra: number;          // 추가금액
  total: number;          // 금액합계
  note: string;           // 비고
}

export type SearchField =
  | "customerName"
  | "phone"
  | "date"
  | "time"
  | "pickup"
  | "dropoff"
  | "driverName";
