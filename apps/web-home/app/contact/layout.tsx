import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "상담문의",
  description:
    "일등대리 대리운전 서비스 이용 문의, 제휴·기타 상담을 접수합니다. 고객센터 또는 온라인 문의 폼을 이용해 주세요.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
