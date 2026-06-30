import type { Metadata } from "next";
import { APP_LINKS, COMPANY } from "@/lib/companyInfo";

/** 운영 홈 도메인 (Punycode). Vercel에 NEXT_PUBLIC_SITE_URL 설정 시 우선 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://www.xn--vk1bv0b35gbnr.kr";

export const SITE = {
  name: COMPANY.serviceName,
  legalName: COMPANY.legalName,
  title: "일등대리 — 안전하고 빠른 대리운전 앱",
  description:
    "일등대리는 앱으로 간편하게 호출하는 대리운전 서비스입니다. 실시간 배차·위치 확인, 카드·마일리지 결제, 기프티콘 교환까지 지원합니다. Google Play에서 앱을 설치하세요.",
  keywords: [
    "일등대리",
    "대리운전",
    "대리운전 앱",
    "대리기사",
    "대리호출",
    "대리운전 요금",
    "마일리지",
    "기프티콘",
    "평택 대리운전",
    "경기 대리운전",
    "번호1대리",
  ],
  locale: "ko_KR",
  ogImagePath: "/images/home.png",
} as const;

export const FAQ_ITEMS = [
  {
    question: "일등대리는 어떤 서비스인가요?",
    answer:
      "일등대리는 스마트폰 앱으로 대리기사를 호출하는 대리운전 서비스입니다. 출발지·도착지를 입력하면 배차부터 결제까지 앱에서 처리할 수 있습니다.",
  },
  {
    question: "요금은 어떻게 책정되나요?",
    answer:
      "이동 거리(km)와 호출 유형(일반·빠른·프리미엄)에 따라 요금이 산정됩니다. 일반 대리운전은 km당 1,000원부터이며, 앱에서 예상 요금을 확인한 뒤 호출할 수 있습니다.",
  },
  {
    question: "앱은 어디서 설치하나요?",
    answer:
      "Android는 Google Play 스토어에서 '일등대리'를 검색해 설치할 수 있습니다. iOS App Store 출시 예정입니다.",
  },
  {
    question: "결제 방법은 무엇이 있나요?",
    answer:
      "현금, 카드, 토스페이, 카카오페이, 마일리지 등 다양한 결제 수단을 지원합니다. 자세한 내용은 앱 내 결제 화면에서 확인할 수 있습니다.",
  },
  {
    question: "고객센터 연락처는 어디인가요?",
    answer: `고객센터 ${COMPANY.customerCenter}, 이메일 ${COMPANY.email}, 사업장 주소 ${COMPANY.fullAddress}로 문의하실 수 있습니다.`,
  },
] as const;

const OG_IMAGE = `${SITE_URL}${SITE.ogImagePath}`;

type PageMetaOpts = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  /** 홈 등 — title template 미적용 */
  absoluteTitle?: boolean;
};

export function createPageMetadata(opts: PageMetaOpts): Metadata {
  const description = opts.description ?? SITE.description;
  const canonical = opts.path ? `${SITE_URL}${opts.path}` : SITE_URL;
  const displayTitle = opts.absoluteTitle ? opts.title : `${opts.title} | ${SITE.name}`;

  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description,
    keywords: [...SITE.keywords],
    alternates: { canonical },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url: canonical,
      siteName: SITE.name,
      title: displayTitle,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE.name} 대리운전 서비스` }],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    email: COMPANY.email,
    telephone: COMPANY.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${COMPANY.addressLine1} ${COMPANY.addressLine2}`,
      addressLocality: "평택시",
      addressRegion: "경기도",
      addressCountry: "KR",
    },
    sameAs: APP_LINKS.googlePlay ? [APP_LINKS.googlePlay] : undefined,
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    inLanguage: "ko-KR",
    publisher: { "@type": "Organization", name: SITE.legalName },
  };
}

export function serviceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "일등대리 대리운전",
    provider: { "@type": "Organization", name: SITE.legalName, url: SITE_URL },
    areaServed: { "@type": "Country", name: "대한민국" },
    serviceType: "대리운전",
    description: SITE.description,
    offers: {
      "@type": "Offer",
      price: "1000",
      priceCurrency: "KRW",
      description: "km당 요금(일반 대리운전 기준, 거리·유형에 따라 변동)",
    },
  };
}

export function mobileAppJsonLd() {
  if (!APP_LINKS.googlePlay) return null;
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: SITE.name,
    operatingSystem: "Android",
    applicationCategory: "MapsAndNavigationApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    installUrl: APP_LINKS.googlePlay,
    url: APP_LINKS.googlePlay,
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
