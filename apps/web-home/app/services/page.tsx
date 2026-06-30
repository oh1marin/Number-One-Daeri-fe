import type { Metadata } from "next";
import Link from "next/link";
import BusinessInfoBlock from "@/components/BusinessInfoBlock";
import { DIGITAL_PRODUCTS, SERVICE_PRODUCTS } from "@/lib/companyInfo";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "서비스 및 요금",
  description:
    "일등대리 대리운전 요금표. 일반·빠른·프리미엄 km당 요금과 마일리지 기프티콘 상품 가격을 안내합니다.",
  path: "/services",
});

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function ServicesPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-gray-950 to-blue-950 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">서비스 및 요금</h1>
          <p className="mt-4 text-gray-200 leading-relaxed max-w-2xl">
            일등대리가 제공하는 대리운전 서비스와 디지털 상품(마일리지 기프티콘)의 가격을 안내합니다. 실제 결제
            금액은 출발·도착 거리, 호출 유형, 야간·대기 등에 따라 앱에서 산정된 금액이 적용됩니다.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <h2 className="text-2xl font-bold mb-2">대리운전 서비스 (유료)</h2>
            <p className="text-sm text-gray-500 mb-6">
              앱에서 출발지·도착지 입력 후 표시되는 예상 요금과 동일한 산식을 기준으로 합니다.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">상품·서비스명</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">설명</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">가격</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SERVICE_PRODUCTS.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.description}
                        <span className="block text-xs text-gray-400 mt-1">{p.example}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 whitespace-nowrap tabular-nums">
                        {p.unit === "km당" ? (
                          <>
                            {formatWon(p.price)}
                            <span className="text-gray-500"> / km</span>
                          </>
                        ) : (
                          formatWon(p.price)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">디지털 상품</h2>
            <p className="text-sm text-gray-500 mb-6">앱 내 마일리지 상점에서 교환 가능한 상품입니다.</p>
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">상품명</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">설명</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">가격</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {DIGITAL_PRODUCTS.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.description}</td>
                      <td className="px-4 py-3 text-gray-900 tabular-nums">
                        {formatWon(p.price)}~
                        <span className="block text-xs text-gray-500">{p.priceNote}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-6 text-sm text-gray-700 space-y-2">
            <p className="font-semibold text-gray-900">결제 안내</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>결제 수단: 현금, 등록 카드, 앱 결제(카드·간편결제), 마일리지</li>
              <li>최종 요금은 호출 완료 후 실제 운행 거리·시간 기준으로 확정됩니다.</li>
              <li>환불·취소는 <Link href="/refund" className="text-brand hover:underline">환불정책</Link>을 따릅니다.</li>
            </ul>
          </div>

          <BusinessInfoBlock />
        </div>
      </section>
    </>
  );
}
