import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PortraitPay AI — Portrait Rights on Blockchain",
  description:
    "AI驱动的肖像权保护平台。区块链认证 + IPFS存储 + 智能合约授权。保护你的数字身份。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
            })();
          `
        }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
