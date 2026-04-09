import type { Metadata } from "next";
import { ValueIcons } from "@/components/Icons";

export const metadata: Metadata = {
  title: "회사소개 | 일등대리",
};

const VALUES = [
  { icon: "safe", title: "안전", desc: "모든 기사는 3단계 심사와 정기 교육을 통해 검증됩니다." },
  { icon: "fast", title: "신속", desc: "AI 매칭으로 어디서든 5분 이내 배차를 보장합니다." },
  { icon: "trust", title: "신뢰", desc: "투명한 요금과 정직한 서비스로 고객 신뢰를 최우선합니다." },
  { icon: "together", title: "상생", desc: "기사와 고객 모두가 만족하는 건강한 플랫폼을 만듭니다." },
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
              기술과 신뢰를 기반으로 기사와 고객 모두가 만족하는
              지속 가능한 플랫폼을 구축합니다.
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
    </>
  );
}
