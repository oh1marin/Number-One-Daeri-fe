"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { isAdminSignupDisabled } from "@/lib/adminEnv";
import { useInquiryNotifier } from "@/lib/useInquiryNotifier";
import Sidebar from "./Sidebar";
import ChatWidget from "./ChatWidget";

const AUTH_PATHS = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isAuthPage = AUTH_PATHS.includes(pathname);
  const { getAccessToken } = useAuth();
  const { unreadCount, handoffToast } = useInquiryNotifier(getAccessToken);

  const [toast, setToast] = useState<{ title: string; body: string; href?: string; key: number } | null>(null);

  const toastKey = useMemo(() => handoffToast?.at ?? 0, [handoffToast?.at]);

  useEffect(() => {
    if (!handoffToast || !toastKey) return;
    const name = handoffToast.firstName?.trim() || "고객";
    const title = "상담원 호출";
    const body =
      handoffToast.count > 1
        ? `${name} 외 ${handoffToast.count}건이 상담원을 호출했습니다.`
        : `${name} 고객이 상담원을 호출했습니다.`;
    setToast({ title, body, href: "/inquiries", key: toastKey });
  }, [handoffToast, toastKey]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (isLoading) return;
    if (isAdminSignupDisabled() && pathname === "/signup") {
      router.replace("/login");
      return;
    }
    if (!user && !isAuthPage) router.replace("/login");
  }, [user, isLoading, isAuthPage, pathname, router]);

  if (isLoading || (!user && !isAuthPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f2f2]">
        <p className="text-gray-500 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {toast && (
        <button
          type="button"
          onClick={() => {
            if (toast.href) router.push(toast.href);
            setToast(null);
          }}
          className="fixed bottom-6 right-6 z-[120] w-[360px] max-w-[calc(100vw-3rem)] text-left rounded-2xl border border-gray-200 bg-white shadow-xl px-4 py-3 hover:shadow-2xl transition"
        >
          <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
          <p className="mt-0.5 text-xs text-gray-600">{toast.body}</p>
          <p className="mt-2 text-[11px] text-indigo-600 font-medium">클릭해서 1:1 문의로 이동</p>
        </button>
      )}
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      <ChatWidget unreadCount={unreadCount} />
    </div>
  );
}
