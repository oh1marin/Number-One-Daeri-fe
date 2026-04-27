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
          <div className="text-gray-500">
            등록번호: 485-81-01266 | 전화: <a href="tel:031-8001-8001" className="hover:text-white transition">031-8001-8001</a> | 팩스: 031-247-1988 | 메일: <a href="mailto:orr06022@naver.com" className="hover:text-white transition">orr06022@naver.com</a>
          </div>
          <div className="flex gap-3 md:ml-auto">
            <Link href="/terms" className="hover:text-white transition">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              개인정보처리방침
            </Link>
            <span className="text-gray-600">© 2026 일등대리</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
