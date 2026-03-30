import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { LanguageProvider } from "@/context/LanguageContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "PortraitPay AI — Portrait Rights on Blockchain",
    template: "%s | PortraitPay AI",
  },
  description:
    "Register your portrait rights on Ethereum. Upload, certify, and manage portrait authorization with blockchain timestamps and IPFS storage.",
  keywords: [
    "portrait rights",
    "blockchain",
    "Ethereum",
    "portrait certification",
    "AI face recognition",
    "digital rights management",
    "IPFS",
    "smart contract licensing",
    "infringement detection",
    "KYC verified profiles",
  ],
  authors: [{ name: "PortraitPay AI" }],
  creator: "PortraitPay AI",
  publisher: "PortraitPay AI",
  metadataBase: new URL("https://portraitpayai.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "zh-CN": "/?lang=zh",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
    url: "https://portraitpayai.com",
    siteName: "PortraitPay AI",
    title: "PortraitPay AI — Portrait Rights on Blockchain",
    description:
      "Register your portrait rights on Ethereum. Upload, certify, and manage portrait authorization with blockchain timestamps and IPFS storage.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PortraitPay AI — Protect Your Portrait Rights on the Blockchain",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@PortraitPayAI",
    creator: "@PortraitPayAI",
    title: "PortraitPay AI — Portrait Rights on Blockchain",
    description:
      "Register your portrait rights on Ethereum. Upload, certify, and manage portrait authorization with blockchain timestamps and IPFS storage.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100`}
      >
        <LanguageProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
