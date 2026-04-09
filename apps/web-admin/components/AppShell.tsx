"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { isAdminSignupDisabled } from "@/lib/adminEnv";
import Sidebar from "./Sidebar";
import ChatWidget from "./ChatWidget";

const AUTH_PATHS = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isAuthPage = AUTH_PATHS.includes(pathname);

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
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      <ChatWidget />
    </div>
  );
}
