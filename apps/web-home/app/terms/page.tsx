import type { Metadata } from "next";
import BusinessInfoBlock from "@/components/BusinessInfoBlock";
import { COMPANY } from "@/lib/companyInfo";

export const metadata: Metadata = {
  title: "이용약관 | 일등대리",
  description: "일등대리 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="px-6 py-12 bg-white">
      <div className="max-w-3xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">이용약관</h1>
          <p className="mt-3 text-sm text-gray-500">시행일: 2026년 6월 2일</p>
        </header>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제1조 (목적)</h2>
            <p>
              본 약관은 {COMPANY.serviceName}(이하 “회사”)가 제공하는 대리운전 및 관련 모바일·웹 서비스(이하
              “서비스”)의 이용 조건과 절차, 회사와 이용자의 권리·의무를 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제2조 (정의)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>“이용자”란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li>“대리운전”이란 이용자의 차량을 운전하여 목적지까지 이동시키는 유료 서비스를 말합니다.</li>
              <li>“요금”이란 거리·시간·호출 유형 등에 따라 산정되는 서비스 이용 대가를 말합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제3조 (약관의 게시 및 변경)</h2>
            <p>
              회사는 본 약관을 서비스 초기 화면 또는 연결 화면(본 페이지)에 게시합니다. 관련 법령을 위반하지 않는
              범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를 사전 공지합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제4조 (서비스의 제공)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>대리운전 호출·배차·운행 및 결제 관련 기능</li>
              <li>마일리지 적립·사용, 기프티콘 교환 등 부가 서비스</li>
              <li>고객센터·1:1 문의 등 고객 지원</li>
            </ul>
            <p className="text-sm text-gray-600">
              서비스별 요금은 <a href="/services" className="text-brand hover:underline">서비스·요금</a> 페이지에
              게시된 기준을 따릅니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제5조 (요금 및 결제)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>이용 요금은 앱에 표시된 예상 요금 및 운행 완료 후 확정 요금을 기준으로 합니다.</li>
              <li>결제는 현금, 카드, 앱 결제, 마일리지 등 회사가 제공하는 수단으로 할 수 있습니다.</li>
              <li>환불·취소는 별도의 환불정책에 따릅니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제6조 (이용자의 의무)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>허위 정보 등록, 타인 정보 도용, 서비스 운영 방해 행위를 하지 않습니다.</li>
              <li>음주·약물 등 안전운행에 지장을 주는 상태에서 서비스를 요청하지 않습니다.</li>
              <li>기사 및 회사 직원에 대한 폭언·폭력 등을 하지 않습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">제7조 (회사 정보)</h2>
            <BusinessInfoBlock variant="legal" />
          </section>
        </div>
      </div>
    </div>
  );
}
