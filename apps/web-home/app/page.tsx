import Link from "next/link";

const FEATURES = [
  {
    icon: "⚡",
    title: "빠른 배차",
    desc: "AI 기반 매칭 시스템으로 평균 5분 이내 기사를 배정합니다.",
  },
  {
    icon: "🛡️",
    title: "안전 보장",
    desc: "철저한 심사를 통과한 전문 기사만 운행하며, 전 노선 보험 적용됩니다.",
  },
  {
    icon: "💳",
    title: "간편 결제",
    desc: "현금, 카드, 마일리지 등 다양한 결제수단을 지원합니다.",
  },
  {
    icon: "📍",
    title: "실시간 추적",
    desc: "기사 위치를 실시간으로 확인하고 가족과 공유할 수 있습니다.",
  },
  {
    icon: "🕐",
    title: "24시간 운영",
    desc: "365일 24시간, 언제든지 이용 가능합니다.",
  },
  {
    icon: "💬",
    title: "전담 고객센터",
    desc: "빠른 응답의 전담 고객센터가 항상 대기 중입니다.",
  },
];

const STEPS = [
  { step: "01", title: "앱 설치", desc: "App Store 또는 Google Play에서 라이드 앱을 설치하세요." },
  { step: "02", title: "출발·도착지 입력", desc: "출발지와 도착지를 입력하고 예상 요금을 확인하세요." },
  { step: "03", title: "호출", desc: "원하는 옵션과 결제수단을 선택하고 기사를 호출하세요." },
  { step: "04", title: "안전 귀가", desc: "배정된 기사와 함께 안전하게 귀가하세요." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-32 md:py-40">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-6 border border-blue-500/30">
              24시간 · 365일 운영
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              안전하고 빠른<br />
              <span className="text-blue-400">대리운전</span> 서비스
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              검증된 전문 기사와 AI 매칭 시스템으로<br className="hidden md:block" />
              평균 5분 이내 배차를 보장합니다.
            </p>
            <div className="flex flex-wrap gap-4" id="download">
              <a
                href="#"
                className="flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                <span className="text-xl">🍎</span>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                <span className="text-xl">▶</span>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 라이드인가요?</h2>
            <p className="text-gray-500">고객의 안전과 편의를 최우선으로 생각합니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">이용 방법</h2>
            <p className="text-gray-500">4단계로 간편하게 이용하세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-[calc(100%-2rem)] h-0.5 bg-gray-200 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-gray-950 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-gray-400 mb-8">첫 이용 시 10% 할인 혜택을 드립니다.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#download" className="px-8 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 transition">
              앱 다운로드
            </a>
            <Link href="/about" className="px-8 py-3 border border-gray-600 rounded-xl font-semibold hover:border-gray-400 transition">
              회사 소개 보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
