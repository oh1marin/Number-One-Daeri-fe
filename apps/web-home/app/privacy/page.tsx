import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 일등대리",
  description: "일등대리 서비스 개인정보처리방침",
};

export default function PrivacyPage() {
  const updatedAt = "2026-04-27";

  return (
    <div className="px-6 py-12 bg-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">개인정보처리방침</h1>
        <p className="mt-3 text-sm text-gray-500">시행일: {updatedAt}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-7 text-gray-800">
          <section className="space-y-3">
            <p>
              일등대리(이하 “회사”)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게
              보호하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다. 서비스 애플리케이션 등은 개발사
              마린소프트가 개발합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. 수집하는 개인정보 항목</h2>
            <div className="space-y-2">
              <p className="font-medium">필수(서비스 제공을 위해 필요한 정보)</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>휴대전화번호(본인확인 및 로그인/회원가입)</li>
                <li>서비스 이용기록(호출/배차/운행 등), 접속 로그, 쿠키, IP 주소</li>
                <li>기기 정보(OS/단말 식별자 등), 앱 버전 등</li>
                <li>위치정보(출발지/도착지 입력, 기사 배정 및 실시간 위치 확인 기능 제공 시)</li>
              </ul>

              <p className="font-medium mt-4">선택</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>이름, 이메일(고객 상담/안내, 계정 식별 편의 제공 시)</li>
                <li>푸시 알림 토큰(FCM 등) 및 알림 수신 설정</li>
              </ul>

              <p className="text-sm text-gray-600 mt-3">
                결제와 관련된 정보(카드번호 등)는 결제대행사(PG)가 직접 처리하며, 회사는 결제 승인 결과 등 서비스
                제공에 필요한 최소 정보만 수신·보관할 수 있습니다.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. 개인정보의 수집 및 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>회원가입/본인확인/로그인 등 이용자 식별 및 계정 관리</li>
              <li>대리운전 서비스 제공(호출/배차/운행/요금 안내), 고객 상담 및 민원 처리</li>
              <li>서비스 품질 향상 및 부정 이용 방지, 보안/인증</li>
              <li>공지, 안내, 이벤트 등 정보 제공(이용자가 동의한 경우 푸시 알림 포함)</li>
              <li>법령 및 내부 방침에 따른 분쟁 대응, 기록 보존</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. 개인정보의 보관 및 이용 기간</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>원칙적으로 개인정보는 수집·이용 목적 달성 시 지체 없이 파기합니다.</li>
              <li>
                다만 관계법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다(예: 전자상거래 등에서의 소비자보호에
                관한 법률, 통신비밀보호법 등).
              </li>
              <li>부정 이용 방지 및 서비스 안정성을 위해 필요한 범위에서 최소 기간 보관할 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. 개인정보의 제3자 제공</h2>
            <p className="text-gray-700">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거가 있거나, 이용자의
              동의가 있는 경우에 한하여 제공할 수 있습니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. 개인정보 처리 위탁</h2>
            <p className="text-gray-700">
              회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁할 수 있으며, 위탁 계약 시 관련 법령에 따라
              안전하게 관리·감독합니다.
            </p>
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] text-sm">
                <div className="bg-gray-50 p-4 font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-200">
                  수탁자(예시)
                </div>
                <div className="p-4 text-gray-700 border-b border-gray-200 sm:border-b-0">
                  Google Firebase(FCM) 등
                </div>
                <div className="bg-gray-50 p-4 font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-200">
                  위탁 업무 내용
                </div>
                <div className="p-4 text-gray-700">
                  푸시 알림 발송, 서비스 운영을 위한 인프라/로그 처리 등
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              실제 위탁 현황은 서비스 운영 상황에 따라 변경될 수 있으며, 변경 시 본 방침을 통해 공지합니다.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. 이용자 및 법정대리인의 권리와 행사 방법</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구를 할 수 있습니다.</li>
              <li>
                회원 탈퇴(계정 삭제)를 요청하는 경우, 회사는 관련 법령에 따른 보관 의무가 있는 정보를 제외하고 지체
                없이 삭제 또는 익명화 처리합니다.
              </li>
              <li>요청은 아래 “문의처”로 연락하시면 지체 없이 처리하겠습니다.</li>
              <li>만 14세 미만 아동의 경우 법정대리인이 권리를 행사할 수 있습니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. 계정 삭제(회원 탈퇴) 및 개인정보 삭제</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                이용자는 언제든지 계정 삭제(회원 탈퇴)를 요청할 수 있습니다. 계정 삭제를 요청하면 서비스 제공을 위해
                보관 중인 개인정보는 관련 법령에 따른 보관 의무가 있는 경우를 제외하고 지체 없이 삭제 또는 익명화
                처리합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-medium">요청 방법</span>: 고객센터(1668-0001) 또는 이메일(
                  <span className="font-medium">orr06022@naver.com</span>)로 “계정 삭제 요청”을 보내주세요.
                  본인 확인을 위해 가입한 휴대전화번호 등 최소 정보 확인이 필요할 수 있습니다.
                </li>
                <li>
                  <span className="font-medium">삭제 대상</span>: 계정 정보(전화번호 등), 서비스 이용과정에서 생성된
                  개인정보(예: 프로필 정보, 알림 토큰 등) 중 보관 의무가 없는 항목
                </li>
                <li>
                  <span className="font-medium">보관 예외</span>: 전자상거래 등 관련 법령에 따라 거래/정산/분쟁 처리를
                  위해 일정 기간 보관이 필요한 정보는 해당 기간 동안 보관 후 파기합니다.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. 개인정보의 파기 절차 및 방법</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>파기 사유가 발생한 개인정보는 내부 방침 및 관련 법령에 따라 안전하게 파기합니다.</li>
              <li>전자적 파일 형태의 정보는 복구 불가능한 방법으로 삭제합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. 개인정보 보호를 위한 기술적·관리적 조치</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>접근권한 관리, 접근통제, 암호화, 보안 업데이트 등</li>
              <li>개인정보 취급자 최소화 및 내부 교육</li>
              <li>침해사고 대응 절차 운영</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. 문의처</h2>
            <p className="text-gray-700">
              개인정보 보호 관련 문의, 불만 처리, 피해 구제는 아래로 연락해 주세요.
            </p>
            <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
              <div>상호: 일등대리</div>
              <div>개발사: 마린소프트 | 대표: 오마린 | 사업자등록번호: 225-51-12994</div>
              <div>전화: 031-8001-8001 / 고객센터 1668-0001</div>
              <div>이메일: orr06022@naver.com</div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. 고지의 의무</h2>
            <p className="text-gray-700">
              본 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우 시행일자 최소 7일 전부터 서비스 내 공지 또는
              본 페이지를 통해 고지합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

