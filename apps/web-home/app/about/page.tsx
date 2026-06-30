import type { Metadata } from "next";
import { ValueIcons } from "@/components/Icons";
import BusinessInfoBlock from "@/components/BusinessInfoBlock";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "회사소개",
  description: "일등대리(마린소프트) 회사 소개. 안전·신속·신뢰를 바탕으로 한 대리운전 서비스를 제공합니다.",
  path: "/about",
});

const VALUES = [
  { icon: "safe", title: "안전", desc: "전문 기사가 안전하게 운전해 고객을 모십니다." },
  { icon: "fast", title: "신속", desc: "요청하시면 가까운 기사로 빠르게 매칭됩니다." },
  { icon: "trust", title: "신뢰", desc: "투명한 요금과 정직한 서비스로 고객 신뢰를 최우선합니다." },
  { icon: "comfort", title: "편의", desc: "앱으로 간편하게 호출하고, 결제까지 한곳에서 이용하실 수 있습니다." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero — invite 배너, 문구 없음 */}
      <section className="relative overflow-hidden bg-blue-950 py-32 md:py-40 px-4 min-h-[320px] md:min-h-[400px] flex items-center justify-center">
        <img
          src="/images/invite.png"
          alt="회사소개"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </section>

      {/* Mission */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">우리의 미션</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              일등대리는 <strong className="text-gray-900">모든 사람이 안전하게 이동할 수 있는 권리</strong>를
              실현하기 위해 설립되었습니다.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              음주운전 사고, 과로 운전의 위험에서 벗어나 전문 기사와 함께하는
              안전한 귀가 문화를 만들어 나갑니다.
            </p>
            <p className="text-gray-600 leading-relaxed">
              고객이 믿고 이용할 수 있는 대리운전 서비스를 꾸준히 이어가겠습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-gray-50 rounded-2xl p-5">
                <div className="mb-3">{ValueIcons[v.icon as keyof typeof ValueIcons]}</div>
                <h3 className="font-bold mb-1">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <BusinessInfoBlock />
        </div>
      </section>
    </>
  );
}
