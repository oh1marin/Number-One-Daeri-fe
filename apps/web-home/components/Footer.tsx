import Link from "next/link";

const linkClass = "text-gray-400 hover:text-white transition";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs leading-relaxed">
          <div className="space-y-2">
            <p className="text-white font-semibold text-sm tracking-tight">서비스</p>
            <div className="flex flex-col gap-1.5">
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
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white font-semibold text-sm tracking-tight">고객센터</p>
            <a href="tel:1668-0001" className={`${linkClass} text-sm font-medium`}>
              1668-0001
            </a>
          </div>

          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <p className="text-white font-semibold text-sm tracking-tight">사업자 정보</p>
            <p className="text-gray-500">
              일등대리 · 개발사 마린소프트 · 대표 오마린 · 사업자등록번호{" "}
              <span className="text-gray-400 tabular-nums">225-51-12994</span>
            </p>
            <p className="text-gray-500">
              전화:{" "}
              <a href="tel:031-8001-8001" className={linkClass}>
                031-8001-8001
              </a>{" "}
              · 팩스: <span className="text-gray-500 tabular-nums">031-247-1988</span>
              <br />
              메일:{" "}
              <a href="mailto:orr06022@naver.com" className={linkClass}>
                orr06022@naver.com
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
          </div>
          <p className="text-gray-600">© 2026 일등대리</p>
        </div>
      </div>
    </footer>
  );
}
