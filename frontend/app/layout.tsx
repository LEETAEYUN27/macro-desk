import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Shell from "@/components/Shell";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} - 금리·환율·경기침체 확률 거시경제 대시보드`, template: `%s | ${SITE.name}` },
  description: SITE.tagline,
  applicationName: SITE.name,
  keywords: ["거시경제 대시보드", "장단기금리차", "공포지수", "VIX", "원달러 환율", "경기침체 확률", "FOMC", "실러 CAPE", "주식 시황"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "ko_KR", siteName: SITE.name, url: "/",
    title: `${SITE.name} - 오늘의 거시경제 한눈에`, description: SITE.tagline,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.tagline, images: ["/og.png"] },
  robots: { index: true, follow: true },
  // 네이버 서치어드바이저 · 구글 서치콘솔 소유 확인 메타태그
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NAVER_SITE_VERIFICATION ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION } : undefined,
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#2563eb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link rel="alternate" type="application/rss+xml" title={`${SITE.name} 브리핑`} href="/rss.xml" />
        {SITE.adsense && (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsense}`}
          />
        )}
      </head>
      <body className="font-sans antialiased">
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          // Cloudflare Web Analytics : 무료 · 쿠키 미사용 방문자 통계 (반응 확인용)
          <Script
            id="cf-analytics"
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN })}
          />
        )}
        <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, inLanguage: "ko-KR", description: SITE.tagline }} />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
