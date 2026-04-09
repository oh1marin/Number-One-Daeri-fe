import type { Metadata } from "next";
import KakaoMap from "@/components/KakaoMap";
import { LocationIcons } from "@/components/Icons";

export const metadata: Metadata = {
  title: "오시는길 | 일등대리",
};

export default function LocationPage() {
  return (
    <>
      {/* Hero — comeon 배너, 다른 페이지와 동일 높이 */}
      <section className="relative overflow-hidden bg-blue-950 py-32 md:py-40 px-4 min-h-[320px] md:min-h-[400px] flex items-center justify-center">
        <img
          src="/images/comeon.png"
          alt="오시는길"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </section>

      {/* 주소 → 지도 → 전화·이메일 */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 주소 (지도 위) */}
          <div className="flex gap-4 p-5 bg-gray-50 rounded-xl">
            <div className="flex-shrink-0">{LocationIcons.pin}</div>
            <div>
              <h2 className="font-bold text-lg mb-1">일등대리</h2>
              <p className="text-gray-600 text-sm">
                경기도 수원시 권선구 효원로 226<br />
                덕화빌딩 302호
              </p>
            </div>
          </div>

          {/* Kakao Map */}
          <KakaoMap />
        </div>
      </section>
    </>
  );
}
