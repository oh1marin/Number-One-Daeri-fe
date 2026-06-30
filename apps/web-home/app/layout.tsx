import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, SITE, SITE_URL, webSiteJsonLd } from "@/lib/seo";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: "%s | 일등대리",
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  category: "transportation",
  formatDetection: { telephone: true, email: true },
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    images: [{ url: "/images/home.png", width: 1200, height: 630, alt: `${SITE.name} 대리운전 서비스` }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/home.png"],
  },
  robots: { index: true, follow: true },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className={`${notoSansKr.className} min-h-screen flex flex-col bg-white text-gray-900 antialiased`}>
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <ToastContainer position="top-center" theme="light" closeButton pauseOnHover />
      </body>
    </html>
  );
}
