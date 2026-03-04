import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-white text-lg">라이드</span>
            </div>
            <p className="text-sm leading-relaxed">
              안전하고 빠른 대리운전 서비스.<br />
              24시간 365일, 언제 어디서나 함께합니다.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">회사소개</Link></li>
              <li><Link href="/location" className="hover:text-white transition">오시는길</Link></li>
              <li><Link href="/community" className="hover:text-white transition">커뮤니티</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">상담문의</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">고객센터</h4>
            <ul className="space-y-2 text-sm">
              <li>1588-0000</li>
              <li>평일 09:00 – 18:00</li>
              <li className="mt-2">
                <a href="mailto:help@ride.kr" className="hover:text-white transition">
                  help@ride.kr
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2024 라이드 주식회사. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">이용약관</a>
            <a href="#" className="hover:text-white transition">개인정보처리방침</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
