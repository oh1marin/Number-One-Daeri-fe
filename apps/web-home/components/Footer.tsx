import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-xs">
          <div>
            <span className="text-white font-medium">서비스</span>
            <span className="mx-2 text-gray-600">|</span>
            <Link href="/about" className="hover:text-white transition">회사소개</Link>
            <span className="mx-1.5 text-gray-600">·</span>
            <Link href="/location" className="hover:text-white transition">오시는길</Link>
            <span className="mx-1.5 text-gray-600">·</span>
            <Link href="/community" className="hover:text-white transition">공지사항</Link>
            <span className="mx-1.5 text-gray-600">·</span>
            <Link href="/contact" className="hover:text-white transition">상담문의</Link>
          </div>
          <div>
            <span className="text-white font-medium">고객센터</span>
            <span className="mx-2 text-gray-600">|</span>
            <a href="tel:1668-0001" className="hover:text-white transition">1668-0001</a>
          </div>
          <div className="text-gray-500 space-y-1">
            <div>
              일등대리 · 개발사 마린소프트 · 대표 오마린 · 사업자등록번호{" "}
              <span className="text-gray-400">225-51-12994</span>
            </div>
            <div>
              전화: <a href="tel:031-8001-8001" className="hover:text-white transition">031-8001-8001</a> | 팩스:
              031-247-1988 | 메일:{" "}
              <a href="mailto:orr06022@naver.com" className="hover:text-white transition">
                orr06022@naver.com
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 md:ml-auto">
            <Link href="/terms" className="hover:text-white transition">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              개인정보처리방침
            </Link>
            <Link href="/refund" className="hover:text-white transition">
              환불정책
            </Link>
            <span className="text-gray-600">© 2026 일등대리</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
