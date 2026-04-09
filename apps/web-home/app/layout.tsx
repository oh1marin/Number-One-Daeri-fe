import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "일등대리 — 안전하고 빠른 대리운전",
  description: "24시간 365일 언제나 함께하는 대리운전 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <ToastContainer position="top-center" theme="light" closeButton pauseOnHover />
      </body>
    </html>
  );
}
