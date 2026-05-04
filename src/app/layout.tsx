import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "PortraitPay AI — 你的肖像 你的权利",
    template: "%s | PortraitPay AI",
  },
  description: "AI驱动的人脸溯源与肖像版权保护平台。保护你的数字身份，授权你的肖像权益。",
  keywords: ["人脸识别", "肖像版权", "区块链", "AI", "数字身份"],
  authors: [{ name: "PortraitPay AI" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://portraitpayai.com",
    siteName: "PortraitPay AI",
    title: "PortraitPay AI — 你的肖像 你的权利",
    description: "AI驱动的人脸溯源与肖像版权保护平台",
  },
  twitter: {
    card: "summary_large_image",
    title: "PortraitPay AI — 你的肖像 你的权利",
    description: "AI驱动的人脸溯源与肖像版权保护平台",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Inline theme script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var t = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
            `.trim(),
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <ToastProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
