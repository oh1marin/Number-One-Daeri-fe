import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | 일등대리",
  description: "일등대리 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="px-6 py-12 bg-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">이용약관</h1>
        <p className="mt-3 text-sm text-gray-500">본 페이지는 준비 중입니다.</p>
      </div>
    </div>
  );
}

