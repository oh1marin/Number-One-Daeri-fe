/** PG·약관·푸터 등에 공통으로 노출하는 사업자 정보 */
export const COMPANY = {
  serviceName: "일등대리",
  legalName: "마린소프트",
  developerName: "마린소프트",
  representative: "오마린",
  businessRegistrationNumber: "225-51-12994",
  /** PG 심사·약관용 — '주소' 키워드가 HTML에 명시되도록 */
  addressLabel: "사업장 주소",
  addressLine1: "경기도 평택시 용이동 신흥1로 67",
  addressLine2: "102동 501호",
  get fullAddress() {
    return `${this.addressLine1} ${this.addressLine2}`;
  },
  phone: "031-8001-8001",
  customerCenter: "1668-0001",
  email: "orr06022@naver.com",
  fax: "031-247-1988",
} as const;

/** 앱·백엔드와 동일한 거리(km)당 요금 (원) — rides/estimate 기준 */
export const SERVICE_PRODUCTS = [
  {
    id: "daeri-normal",
    name: "일반 대리운전",
    description: "저렴한 요금, 여유 있는 배차",
    unit: "km당",
    price: 1000,
    example: "10km 기준 10,000원",
  },
  {
    id: "daeri-fast",
    name: "빠른 대리운전",
    description: "합리적 요금, 일반 배차",
    unit: "km당",
    price: 1125,
    example: "10km 기준 11,250원",
  },
  {
    id: "daeri-premium",
    name: "프리미엄 대리운전",
    description: "고급 요금, 초고속 배차",
    unit: "km당",
    price: 1281,
    example: "10km 기준 12,810원",
  },
  {
    id: "daeri-64km-normal",
    name: "일반 대리운전 (64km 예시)",
    description: "출발·도착 거리 64km 기준 예상 요금",
    unit: "건당",
    price: 64000,
    example: "앱 호출 시 거리별 자동 산정",
  },
  {
    id: "daeri-64km-fast",
    name: "빠른 대리운전 (64km 예시)",
    description: "출발·도착 거리 64km 기준 예상 요금",
    unit: "건당",
    price: 72000,
    example: "앱 호출 시 거리별 자동 산정",
  },
  {
    id: "daeri-64km-premium",
    name: "프리미엄 대리운전 (64km 예시)",
    description: "출발·도착 거리 64km 기준 예상 요금",
    unit: "건당",
    price: 82000,
    example: "앱 호출 시 거리별 자동 산정",
  },
] as const;

export const DIGITAL_PRODUCTS = [
  {
    id: "gifticon-exchange",
    name: "마일리지 기프티콘 교환",
    description: "앱 기프티콘 상점에서 마일리지로 교환 (음료·외식 등)",
    unit: "건당",
    price: 2000,
    priceNote: "2,000 마일리지부터 (상품별 상이)",
  },
] as const;
