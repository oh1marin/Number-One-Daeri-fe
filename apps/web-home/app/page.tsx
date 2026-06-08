import Link from "next/link";
import { FeatureIcons } from "@/components/Icons";
import { SiApple, SiGoogleplay } from "react-icons/si";
import { fetchNotices } from "@/lib/notices";
import BusinessInfoBlock from "@/components/BusinessInfoBlock";
import { SERVICE_PRODUCTS } from "@/lib/companyInfo";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "";
const GOOGLE_PLAY_URL = process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL?.trim() || "";

const FEATURES = [
  { icon: "fast", title: "빠른 배차", desc: "가까운 기사를 찾아 신속하게 배차해 드립니다." },
  { icon: "safe", title: "안전 보장", desc: "철저한 심사를 통과한 전문 기사만 운행하며, 전 노선 보험 적용됩니다." },
  { icon: "payment", title: "간편 결제", desc: "현금, 카드, 마일리지 등 다양한 결제수단을 지원합니다." },
  { icon: "tracking", title: "실시간 추적", desc: "앱에서 배정된 기사 위치를 실시간으로 확인할 수 있습니다." },
  { icon: "hours", title: "앱 한곳에서", desc: "호출부터 결제까지 앱에서 간편하게 이용하실 수 있습니다." },
  { icon: "support", title: "전담 고객센터", desc: "이용 문의에 빠르게 안내해 드립니다." },
];

const STEPS = [
  { step: "01", title: "앱 설치", desc: "App Store 또는 Google Play에서 일등대리 앱을 설치하세요." },
  { step: "02", title: "출발·도착지 입력", desc: "출발지와 도착지를 입력하고 예상 요금을 확인하세요." },
  { step: "03", title: "호출", desc: "원하는 옵션과 결제수단을 선택하고 기사를 호출하세요." },
  { step: "04", title: "안전 귀가", desc: "배정된 기사와 함께 안전하게 귀가하세요." },
];

export default async function HomePage() {
  const latestNotices = (await fetchNotices()).slice(0, 3);

  return (
    <>
      {/* Hero — home 배경 + 문구 유지 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 text-white">
        <img
          src="/images/home.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/75 to-blue-950/40" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.12),_transparent_55%)]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 py-32 md:py-40">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/10 text-brand-muted text-xs font-semibold rounded-full mb-6 border border-white/15 backdrop-blur-sm">
              전문 대리운전
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
              안전하고 빠른<br />
              <span className="text-brand-on-dark">대리운전</span> 서비스
            </h1>
            <p className="text-lg text-gray-100 mb-10 leading-relaxed max-w-xl">
              검증된 전문 기사로<br className="hidden md:block" />
              빠르고 안전한 대리운전을 제공합니다.
            </p>
            <div className="flex flex-wrap gap-4" id="download">
              <a
                href={APP_STORE_URL || "#download"}
                target={APP_STORE_URL ? "_blank" : undefined}
                rel={APP_STORE_URL ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition shadow-lg shadow-black/20 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                <SiApple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </a>
              <a
                href={GOOGLE_PLAY_URL || "#download"}
                target={GOOGLE_PLAY_URL ? "_blank" : undefined}
                rel={GOOGLE_PLAY_URL ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 px-6 py-3 bg-white/10 text-white border border-white/25 rounded-xl font-semibold hover:bg-white/15 transition backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                <SiGoogleplay className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs text-gray-300">Get it on</div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 일등대리인가요?</h2>
            <p className="text-gray-500">고객의 안전과 편의를 최우선으로 생각합니다.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-brand/25 hover:shadow-lg hover:-translate-y-0.5 transition duration-200"
              >
                <div className="mb-4">{FeatureIcons[f.icon as keyof typeof FeatureIcons]}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최신 공지 — /community 와 동일 소스(fetchNotices). Vercel에 RIDE_API_BASE_URL 필요 */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">공지사항</h2>
            <Link
              href="/community"
              className="text-sm font-medium text-brand hover:text-brand-hover hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 rounded"
            >
              전체보기 →
            </Link>
          </div>
          {latestNotices.length === 0 ? (
            <p className="text-gray-500 text-sm">등록된 공지가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/50">
              {latestNotices.map((n) => (
                <li key={String(n.id)}>
                  <Link
                    href={`/community/${n.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-white transition focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/30"
                  >
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${n.badgeColor}`}
                    >
                      {n.badge}
                    </span>
                    <span className="flex-1 min-w-0 font-medium text-sm text-gray-900 truncate">
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{n.date}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">이용 방법</h2>
            <p className="text-gray-500">4단계로 간편하게 이용하세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-[calc(100%-2rem)] h-0.5 bg-gray-200/90 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-md shadow-brand/25">
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

      {/* 서비스·요금 (PG 심사용 — 가격 표시 상품) */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">서비스 및 요금</h2>
              <p className="text-gray-500 text-sm mt-2">대리운전 유료 서비스 — 거리(km) 기준 요금 (원)</p>
            </div>
            <Link
              href="/services"
              className="text-sm font-medium text-brand hover:underline underline-offset-4"
            >
              전체 요금표 →
            </Link>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">서비스명</th>
                  <th className="px-4 py-3 font-semibold">설명</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">가격</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {SERVICE_PRODUCTS.slice(0, 3).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.description}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {p.price.toLocaleString("ko-KR")}원 / km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            예: 10km 일반 호출 약 10,000원 · 64km 기준 일반 64,000원 / 빠른 72,000원 / 프리미엄 82,000원
          </p>
        </div>
      </section>

      {/* 사업자 정보 (PG — 주소 명시) */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <BusinessInfoBlock />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-gray-950 text-white text-center border-t border-gray-800/80">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">지금 바로 시작하세요</h2>
          <p className="text-gray-400 mb-8">신규 가입 시 1만원, 친구 추천 이벤트 진행 중!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#download"
              className="px-8 py-3 bg-brand rounded-xl font-semibold hover:bg-brand-hover transition shadow-lg shadow-brand/30 focus-visible:ring-2 focus-visible:ring-brand-muted focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              앱 다운로드
            </a>
            <Link
              href="/about"
              className="px-8 py-3 border border-white/25 rounded-xl font-semibold text-white hover:bg-white/10 hover:border-white/35 transition focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              회사 소개 보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
