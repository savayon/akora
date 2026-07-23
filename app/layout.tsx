import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "아고라 (akora) - 지성인의 놀이터",
  description: "논리와 존중이 함께하는 아고라에 오신 것을 환영합니다. 나의 논리를 펼치세요. 사람들을 설득하세요.",
};

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { ReportModal } from "@/components/ReportModal";
import { FloatingAdBanner } from "@/components/FloatingAdBanner";
import { ProfilePopover } from "@/components/ProfilePopover";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3068766287086121" 
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-slate-900 font-sans">
        <AuthProvider>
          <Header />
          <div className="flex-1 w-full max-w-[1536px] mx-auto px-4 flex justify-center relative items-stretch">
            {/* 좌측 스크롤 추적 광고 배너 */}
            {/* <FloatingAdBanner side="left" imageUrl="/mock-ad-left.png" /> */}

            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 min-w-0 w-full max-w-5xl">
              {children}
            </main>

            {/* 우측 고정 광고 배너 (스크롤 미추적) */}
            {/* <FloatingAdBanner side="right" imageUrl="/mock-ad-right.png" type="static" /> */}
          </div>
          <ReportModal />
          <ProfilePopover />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
