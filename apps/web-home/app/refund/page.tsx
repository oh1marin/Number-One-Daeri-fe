import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "환불정책 | 일등대리",
  description: "일등대리 서비스 환불 및 취소 정책",
};

export default function RefundPage() {
  const updatedAt = "2026-05-04";

  return (
    <div className="px-6 py-12 bg-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">환불정책</h1>
        <p className="mt-3 text-sm text-gray-500">시행일: {updatedAt}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-gray-800">
          <section className="space-y-3">
            <p>
              일등대리(이하 “회사”) 서비스와 관련하여 환불·취소에 관한 사항을 안내합니다. 본 서비스의 앱·시스템은
              개발사 마린소프트가 개발·운영합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. 기본 원칙</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>회사는 관련 법령 및 결제·정산 정책에 따라 공정하게 환불을 처리합니다.</li>
              <li>실제 결제·승인·환불 처리는 결제대행사(PG) 및 카드사 정책에 따라 일정 시간이 소요될 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. 호출 취소</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>
                기사 배정 전 이용자가 호출을 취소한 경우, 선결제·승인만 이루어진 상태라면 결제가 취소되거나 환불
                처리됩니다.
              </li>
              <li>
                기사가 현장에 도착한 이후 취소하는 경우, 이미 운행이 확정되었거나 회사·정책에 따라 부분 취소불가·
                취소 수수료가 적용될 수 있습니다. 자세한 요금은 앱·안내 또는 상담을 통해 확인해 주세요.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. 서비스 미제공·중대한 하자</h2>
            <p className="text-gray-700">
              회사 또는 기사의 귀책으로 운행이 이루어지지 않았거나, 명백한 서비스 하자가 있는 경우 회사는 사실관계를
              확인한 뒤 환불·보정(재호출 등)을 진행합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. 환불 방법 및 소요 기간</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>카드 결제: 카드사 및 PG 정책에 따라 승인 취소 또는 환불이 처리되며, 통상 영업일 기준 수일 내 반영될 수 있습니다.</li>
              <li>환불 금액은 실제 결제·정산 내역을 기준으로 합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. 문의</h2>
            <p className="text-gray-700">
              환불·취소와 관련된 문의는 고객센터 또는 아래 연락처로 주시면 확인 후 안내드립니다.
            </p>
            <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
              <div>서비스명: 일등대리</div>
              <div>개발사: 마린소프트 | 대표: 오마린 | 사업자등록번호: 225-51-12994</div>
              <div>전화: 031-8001-8001 / 고객센터 1668-0001</div>
              <div>이메일: orr06022@naver.com</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
