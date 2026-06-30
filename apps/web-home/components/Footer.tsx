import Link from "next/link";
import { COMPANY, APP_LINKS } from "@/lib/companyInfo";

const linkClass = "text-gray-400 hover:text-white transition";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs leading-relaxed">
          <div className="space-y-2">
            <p className="text-white font-semibold text-sm tracking-tight">서비스</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/services" className={linkClass}>
                서비스·요금
              </Link>
              <Link href="/about" className={linkClass}>
                회사소개
              </Link>
              <Link href="/location" className={linkClass}>
                오시는길
              </Link>
              <Link href="/community" className={linkClass}>
                공지사항
              </Link>
              <Link href="/contact" className={linkClass}>
                상담문의
              </Link>
              {APP_LINKS.googlePlay ? (
                <a
                  href={APP_LINKS.googlePlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Google Play 앱
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white font-semibold text-sm tracking-tight">고객센터</p>
            <a href={`tel:${COMPANY.customerCenter}`} className={`${linkClass} text-sm font-medium`}>
              {COMPANY.customerCenter}
            </a>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <p className="text-white font-semibold text-sm tracking-tight">사업자 정보</p>
            <p className="text-gray-500">
              {COMPANY.serviceName} · {COMPANY.developerName} · 대표 {COMPANY.representative} · 사업자등록번호{" "}
              <span className="text-gray-400 tabular-nums">{COMPANY.businessRegistrationNumber}</span>
            </p>
            <p className="text-gray-500">
              <span className="text-gray-400 font-medium">{COMPANY.addressLabel}:</span> {COMPANY.fullAddress}
            </p>
            <p className="text-gray-500">
              전화:{" "}
              <a href={`tel:${COMPANY.phone}`} className={linkClass}>
                {COMPANY.phone}
              </a>{" "}
              · 팩스: <span className="text-gray-500 tabular-nums">{COMPANY.fax}</span>
              <br />
              메일:{" "}
              <a href={`mailto:${COMPANY.email}`} className={linkClass}>
                {COMPANY.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/terms" className={linkClass}>
              이용약관
            </Link>
            <Link href="/privacy" className={linkClass}>
              개인정보처리방침
            </Link>
            <Link href="/refund" className={linkClass}>
              환불정책
            </Link>
            <Link href="/services" className={linkClass}>
              서비스·요금
            </Link>
          </div>
          <p className="text-gray-600">© 2026 {COMPANY.serviceName}</p>
        </div>
      </div>
    </footer>
  );
}
