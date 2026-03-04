"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", icon: "📊", label: "대시보드" },
  { href: "/daily", icon: "📅", label: "운행일보" },
  { href: "/customers", icon: "👥", label: "고객자료관리" },
  { href: "/customers/ledger", icon: "📋", label: "고객관리대장" },
  { href: "/drivers", icon: "🚗", label: "기사님 관리" },
  { href: "/attendance", icon: "📆", label: "기사 근태관리" },
  { href: "/rides/new", icon: "✏️", label: "콜 입력" },
  { href: "/rides", icon: "🔍", label: "콜 조회" },
  { href: "/invoices", icon: "🧾", label: "세금계산서" },
  { href: "/statistics", icon: "📈", label: "통계" },
  { href: "/settings", icon: "⚙️", label: "요금 설정" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">R</div>
          <div>
            <p className="font-bold text-sm leading-tight">라이드</p>
            <p className="text-xs text-gray-400">관리대장</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        © 2024 라이드 관리대장
      </div>
    </aside>
  );
}
