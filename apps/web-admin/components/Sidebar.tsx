"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Smartphone,
  Settings,
  type LucideIcon,
} from "lucide-react";

const GROUPS: { label: string; icon: LucideIcon; items: { href: string; label: string }[] }[] = [
  {
    label: "운행 관리",
    icon: LayoutDashboard,
    items: [
      { href: "/", label: "대시보드" },
      { href: "/daily", label: "운행일보" },
      { href: "/rides/new", label: "콜 입력" },
      { href: "/rides/bulk-import", label: "엑셀자료등록" },
      { href: "/rides", label: "콜 조회" },
      { href: "/order-status", label: "오더현황" },
      { href: "/order-stats", label: "오더통계현황" },
    ],
  },
  {
    label: "고객/기사",
    icon: Users,
    items: [
      { href: "/customers", label: "고객자료관리" },
      { href: "/customers/ledger", label: "고객관리대장" },
      { href: "/drivers", label: "기사님 관리" },
      { href: "/attendance", label: "기사 근태관리" },
    ],
  },
  {
    label: "정산/결제",
    icon: CreditCard,
    items: [
      { href: "/invoices", label: "세금계산서" },
      { href: "/statistics", label: "통계" },
      { href: "/card-payments", label: "카드결재현황" },
    ],
  },
  {
    label: "앱/마일리지",
    icon: Smartphone,
    items: [
      { href: "/app-access", label: "앱접속관리" },
      { href: "/app-install", label: "앱설치현황" },
      { href: "/app-install-stats", label: "앱설치통계" },
      { href: "/app-images", label: "앱이미지" },
      { href: "/usage-guide", label: "사용설명" },
      { href: "/accumulation", label: "적립설정" },
      { href: "/coupon-purchases", label: "쿠폰구매현황" },
      { href: "/coupon-requests", label: "기프티콘 신청관리" },
      { href: "/promo-list", label: "홍보리스트" },
      { href: "/recommendation-kings", label: "추천왕 리스트" },
      { href: "/mileage/history", label: "마일리지 적립현황" },
      { href: "/mileage/manage", label: "마일리지 관리" },
      { href: "/mileage/errors", label: "마일리지 오류현황" },
      { href: "/withdrawals", label: "출금요청 관리" },
    ],
  },
  {
    label: "시스템",
    icon: Settings,
    items: [
      { href: "/counselors", label: "상담원 관리" },
      { href: "/notices", label: "공지사항" },
      { href: "/complaints", label: "불편사항" },
      { href: "/inquiries", label: "1:1 문의" },
      { href: "/ad-settings", label: "광고설정" },
      { href: "/number-change", label: "번호변경 리스트" },
      { href: "/admin/me", label: "관리자정보" },
      { href: "/settings", label: "요금 설정" },
    ],
  },
];

function NavGroup({
  label,
  icon: Icon,
  items,
  pathname,
  defaultOpen,
}: {
  label: string;
  icon: LucideIcon;
  items: { href: string; label: string }[];
  pathname: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);
  const hasActive = items.some((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
  );

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
          hasActive ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
          <span>{label}</span>
        </span>
        <span
          className={`flex-shrink-0 text-xs transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>
      {open && (
        <div className="mt-0.5 ml-3 pl-2 border-l border-gray-700 space-y-0.5">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-2.5 py-2 rounded-lg text-sm transition ${
                  active
                    ? "text-white shadow-sm"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                style={active ? { background: "linear-gradient(135deg,#6366f1,#7c3aed)" } : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // 기본적으로 현재 경로가 속한 그룹은 펼침
  const getDefaultOpen = (group: (typeof GROUPS)[0]) => {
    return group.items.some((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
    );
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
            R
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">일등대리</p>
            <p className="text-xs text-gray-400">관리자 페이지</p>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {GROUPS.map((g) => (
          <NavGroup
            key={g.label}
            label={g.label}
            icon={g.icon}
            items={g.items}
            pathname={pathname}
            defaultOpen={getDefaultOpen(g)}
          />
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-2 flex-shrink-0">
        {user && (
          <div className="text-xs">
            <p className="text-gray-300 font-medium truncate">{user.name}</p>
            <p className="text-gray-500 truncate">{user.email}</p>
            <button
              onClick={handleLogout}
              className="mt-2 w-full py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
            >
              로그아웃
            </button>
          </div>
        )}
        <p className="text-xs text-gray-500">© 2026 일등대리</p>
      </div>
    </aside>
  );
}
