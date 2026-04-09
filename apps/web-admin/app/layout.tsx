import type { Metadata } from "next";
import "./globals.css";
import "./sheet.css";
import { AuthProvider } from "@/lib/AuthContext";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "관리자 페이지 | 일등대리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="sheet-page text-gray-900 antialiased min-h-screen">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
