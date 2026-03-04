import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오시는길 | 라이드",
};

const TRANSPORTS = [
  {
    icon: "🚇",
    title: "지하철",
    lines: [
      "2호선 강남역 3번 출구 도보 5분",
      "9호선 신논현역 5번 출구 도보 3분",
    ],
  },
  {
    icon: "🚌",
    title: "버스",
    lines: [
      "간선버스: 140, 146, 341, 360",
      "지선버스: 3412, 4312",
    ],
  },
  {
    icon: "🚗",
    title: "자가용",
    lines: [
      "강남대로 방면 → 신논현역 방향",
      "건물 지하 주차장 이용 가능 (2시간 무료)",
    ],
  },
];

export default function LocationPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 to-blue-950 text-white py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-6 border border-blue-500/30">
            오시는길
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">찾아오시는 방법</h1>
          <p className="text-gray-300 text-lg">라이드 본사는 서울시 강남구에 위치해 있습니다.</p>
        </div>
      </section>

      {/* Map + Address */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Map Placeholder */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="bg-gray-100 h-80 flex flex-col items-center justify-center text-gray-400">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="font-medium text-gray-600 mb-2">지도</p>
              <p className="text-sm text-center px-8">
                카카오맵 / 네이버맵 SDK 연동 후 실제 지도로 교체됩니다.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="https://map.kakao.com"
                  target="_blank"
                  className="px-4 py-2 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-lg hover:bg-yellow-300 transition"
                >
                  카카오맵
                </a>
                <a
                  href="https://map.naver.com"
                  target="_blank"
                  className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  네이버지도
                </a>
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">본사 주소</h2>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold mb-1">주소</p>
                  <p className="text-gray-600 text-sm">
                    서울특별시 강남구 테헤란로 123<br />
                    라이드빌딩 8층
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold mb-1">대표 전화</p>
                  <p className="text-gray-600 text-sm">1588-0000</p>
                  <p className="text-gray-400 text-xs mt-0.5">평일 09:00 – 18:00</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">✉️</span>
                <div>
                  <p className="font-semibold mb-1">이메일</p>
                  <a href="mailto:hello@ride.kr" className="text-blue-600 text-sm hover:underline">
                    hello@ride.kr
                  </a>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="font-semibold mb-1">운영시간</p>
                  <p className="text-gray-600 text-sm">평일 09:00 – 18:00</p>
                  <p className="text-gray-400 text-xs mt-0.5">주말 및 공휴일 휴무</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transport */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">교통편 안내</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRANSPORTS.map((t) => (
              <div key={t.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.icon}</span>
                  <h3 className="font-bold text-lg">{t.title}</h3>
                </div>
                <ul className="space-y-2">
                  {t.lines.map((line) => (
                    <li key={line} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
