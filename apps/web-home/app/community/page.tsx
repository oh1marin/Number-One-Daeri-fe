import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "커뮤니티 | 라이드",
};

const NOTICES = [
  {
    id: 1,
    badge: "공지",
    badgeColor: "bg-red-100 text-red-600",
    title: "2024년 연말 이벤트 안내 — 첫 이용 20% 할인",
    date: "2024.12.01",
    views: 1240,
  },
  {
    id: 2,
    badge: "공지",
    badgeColor: "bg-red-100 text-red-600",
    title: "앱 업데이트 안내 (v2.3.0) — 실시간 위치공유 기능 추가",
    date: "2024.11.20",
    views: 987,
  },
  {
    id: 3,
    badge: "이벤트",
    badgeColor: "bg-blue-100 text-blue-600",
    title: "친구 초대 이벤트 — 초대할 때마다 마일리지 3,000원 적립",
    date: "2024.11.15",
    views: 2340,
  },
];

const REVIEWS = [
  {
    name: "김*수",
    rating: 5,
    date: "2024.12.02",
    content: "배차가 정말 빠르고 기사님도 너무 친절하셨어요. 앞으로도 계속 이용할 것 같습니다!",
    region: "강남구",
  },
  {
    name: "이*영",
    rating: 5,
    date: "2024.11.28",
    content: "앱이 직관적이고 사용하기 편해요. 요금도 투명하게 나와서 믿음이 갑니다.",
    region: "마포구",
  },
  {
    name: "박*민",
    rating: 5,
    date: "2024.11.25",
    content: "늦은 시간에도 빠르게 배차가 돼서 안심이에요. 기사님도 안전하게 모셔다 주셨어요.",
    region: "서초구",
  },
  {
    name: "최*희",
    rating: 4,
    date: "2024.11.20",
    content: "서비스가 전반적으로 만족스럽습니다. 마일리지 쌓이는 게 좋아서 자주 이용하고 있어요.",
    region: "송파구",
  },
  {
    name: "정*호",
    rating: 5,
    date: "2024.11.18",
    content: "기사님이 너무 친절하고 운전도 안정적으로 잘 하셨습니다. 강력 추천해요!",
    region: "용산구",
  },
  {
    name: "한*진",
    rating: 5,
    date: "2024.11.10",
    content: "실시간 위치 공유 기능 덕분에 가족이 안심할 수 있어서 너무 좋아요.",
    region: "강서구",
  },
];

const FAQS = [
  {
    q: "호출 후 취소하면 수수료가 발생하나요?",
    a: "기사 배차 전 취소는 수수료가 없습니다. 기사 배차 후 취소 시에는 상황에 따라 취소 수수료가 부과될 수 있습니다.",
  },
  {
    q: "결제 수단은 어떻게 되나요?",
    a: "현금, 카드(신용/체크), 마일리지 결제를 지원합니다. 앱에서 미리 카드를 등록해두면 더욱 편리합니다.",
  },
  {
    q: "마일리지는 어떻게 적립되나요?",
    a: "이용 금액의 1~3%가 마일리지로 적립됩니다. 친구 초대, 이벤트 참여 시 추가 마일리지를 받을 수 있습니다.",
  },
  {
    q: "기사를 직접 선택할 수 있나요?",
    a: "현재는 AI 자동 매칭 방식으로 운영됩니다. 단골 기사 설정 기능은 추후 업데이트 예정입니다.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-yellow-400" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 to-blue-950 text-white py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-6 border border-blue-500/30">
            커뮤니티
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">라이드 커뮤니티</h1>
          <p className="text-gray-300 text-lg">공지사항, 이용 후기, 자주 묻는 질문을 확인하세요.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* 공지사항 */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">공지사항 · 이벤트</h2>
            <button className="text-sm text-blue-600 hover:underline">전체보기</button>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
            {NOTICES.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-4 px-6 py-4 bg-white hover:bg-gray-50 transition cursor-pointer"
              >
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${n.badgeColor}`}>
                  {n.badge}
                </span>
                <p className="flex-1 font-medium text-sm truncate">{n.title}</p>
                <div className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-3">
                  <span>👁 {n.views.toLocaleString()}</span>
                  <span>{n.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 이용 후기 */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">이용 후기</h2>
              <p className="text-gray-500 text-sm mt-1">실제 이용 고객들의 생생한 후기</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">4.9</div>
              <StarRating rating={5} />
              <p className="text-xs text-gray-400 mt-1">3,241개 리뷰</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.map((r) => (
              <div key={r.name + r.date} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.region}</p>
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{r.content}</p>
                <p className="text-gray-400 text-xs mt-3">{r.date}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">자주 묻는 질문</h2>
            <p className="text-gray-500 text-sm mt-1">궁금한 점을 빠르게 해결하세요.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium hover:bg-gray-50 transition list-none">
                  <span className="flex gap-3 items-start">
                    <span className="text-blue-500 font-bold mt-0.5">Q</span>
                    <span>{faq.q}</span>
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4">▼</span>
                </summary>
                <div className="px-6 pb-4 pt-0 flex gap-3 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                  <span className="text-green-500 font-bold mt-3">A</span>
                  <p className="mt-3">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>

          {/* 문의 CTA */}
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
            <p className="text-gray-700 mb-3">원하는 답변을 찾지 못하셨나요?</p>
            <a
              href="mailto:help@ride.kr"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              1:1 문의하기
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
