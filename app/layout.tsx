import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "광고주엔 고객을, 인플루언서엔 수익을. AI 원스톱 마케팅 플랫폼-앤팅-",
  description: "체험단, SNS 브랜딩, 쇼핑커머스, 콘텐츠 자동 생성까지 한곳에서.",
  openGraph: {
    title: "광고주엔 고객을, 인플루언서엔 수익을. AI 원스톱 마케팅 플랫폼-앤팅-",
    description: "체험단, SNS 브랜딩, 쇼핑커머스, 콘텐츠 자동 생성까지 한곳에서.",
    url: "https://anting-app-0001.web.app",
    siteName: "앤팅 (Anting)",
  },
  verification: {
    google: "temp-google-site-verification",
    other: {
      "naver-site-verification": ["temp-naver-site-verification"],
    },
  },
};

import CSBot from "@/components/ui/CSBot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "앤팅 (Anting)",
    url: "https://anting-app-0001.web.app",
    description: "체험단, SNS 브랜딩, 쇼핑커머스, 콘텐츠 자동 생성까지 한곳에서 제공하는 AI 원스톱 마케팅 플랫폼입니다.",
  };

  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased font-pretendard">
        <AuthProvider>
          {children}
          <CSBot />
        </AuthProvider>
      </body>
    </html>
  );
}
