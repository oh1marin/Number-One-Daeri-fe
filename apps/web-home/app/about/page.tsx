import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회사소개 | 라이드",
};

const VALUES = [
  { icon: "🛡️", title: "안전", desc: "모든 기사는 3단계 심사와 정기 교육을 통해 검증됩니다." },
  { icon: "⚡", title: "신속", desc: "AI 매칭으로 어디서든 5분 이내 배차를 보장합니다." },
  { icon: "💎", title: "신뢰", desc: "투명한 요금과 정직한 서비스로 고객 신뢰를 최우선합니다." },
  { icon: "🤝", title: "상생", desc: "기사와 고객 모두가 만족하는 건강한 플랫폼을 만듭니다." },
];

const HISTORY = [
  { year: "2021", title: "라이드 창립", desc: "대리운전 플랫폼 사업 시작, 서울 지역 서비스 런칭" },
  { year: "2022", title: "전국 확장", desc: "수도권 전역 서비스 확대, 누적 이용 1만 건 달성" },
  { year: "2023", title: "앱 2.0 출시", desc: "실시간 위치 추적, 마일리지 시스템 도입" },
  { year: "2024", title: "5만 건 돌파", desc: "누적 이용 5만 건 달성, 기사 2,000명 확보" },
];

const TEAM = [
  { name: "김대표", role: "대표이사 / CEO", desc: "전 카카오모빌리티 PM, 모빌리티 업계 10년" },
  { name: "이기술", role: "CTO", desc: "전 쏘카 백엔드 엔지니어, 실시간 시스템 전문가" },
  { name: "박운영", role: "COO", desc: "전 타다 운영팀장, 기사 채용·교육 총괄" },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 to-blue-950 text-white py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-6 border border-blue-500/30">
            회사소개
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            사람과 사람을 잇는<br />
            <span className="text-blue-400">신뢰의 이동</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
            라이드는 검증된 전문 기사와 스마트 기술을 통해 모두가 안전하게
            귀가할 수 있는 세상을 만들어 갑니다.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">우리의 미션</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              라이드는 <strong className="text-gray-900">모든 사람이 안전하게 이동할 수 있는 권리</strong>를
              실현하기 위해 설립되었습니다.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              음주운전 사고, 과로 운전의 위험에서 벗어나 전문 기사와 함께하는
              안전한 귀가 문화를 만들어 나갑니다.
            </p>
            <p className="text-gray-600 leading-relaxed">
              기술과 신뢰를 기반으로 기사와 고객 모두가 만족하는
              지속 가능한 플랫폼을 구축합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-gray-50 rounded-2xl p-5">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-bold mb-1">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">연혁</h2>
            <p className="text-gray-500">라이드의 성장 역사</p>
          </div>
          <div className="relative">
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />
            <div className="space-y-8">
              {HISTORY.map((h) => (
                <div key={h.year} className="flex gap-6 items-start">
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="font-bold text-blue-600">{h.year}</span>
                  </div>
                  <div className="relative">
                    <div className="hidden md:block absolute -left-[1.65rem] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-5 border border-gray-100">
                    <h3 className="font-bold mb-1">{h.title}</h3>
                    <p className="text-gray-500 text-sm">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">경영진</h2>
            <p className="text-gray-500">라이드를 이끄는 팀</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((t) => (
              <div key={t.name} className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-md transition">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {t.name[0]}
                </div>
                <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                <p className="text-blue-600 text-sm font-medium mb-3">{t.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 기사 모집 CTA */}
      <section className="py-20 px-6 bg-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">기사로 함께하세요</h2>
          <p className="text-blue-100 mb-8">
            라이드와 함께 안정적인 수입과 자유로운 근무 환경을 경험하세요.
          </p>
          <a
            href="mailto:driver@ride.kr"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            기사 지원하기
          </a>
        </div>
      </section>
    </>
  );
}
