"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "홈" },
  { href: "/about", label: "회사소개" },
  { href: "/location", label: "오시는길" },
  { href: "/community", label: "공지사항" },
  { href: "/contact", label: "상담문의" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="일등대리" className="h-10 w-auto object-contain rounded-xl" />
          <span className="font-bold text-gray-900 text-lg">일등대리</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 ${
                pathname === link.href
                  ? "bg-brand-soft text-brand"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>


        {/* Mobile Hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
        >
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 ${
                pathname === link.href
                  ? "bg-brand-soft text-brand"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="#download"
            className="mt-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg text-center hover:bg-brand-hover transition focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2"
          >
            앱 다운로드
          </a>
        </div>
      )}
    </header>
  );
}
