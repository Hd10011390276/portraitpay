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
    default: "PortraitPay AI — Your Portrait, Your Rights",
    template: "%s | PortraitPay AI",
  },
  description: "AI-powered portrait rights protection and licensing platform. Protect your digital identity and authorize portrait usage with timestamped certificates.",
  keywords: ["portrait rights", "portrait licensing", "AI copyright protection", "digital identity", "IP protection", "consent management"],
  authors: [{ name: "PortraitPay AI" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://portraitpayai.com",
    siteName: "PortraitPay AI",
    title: "PortraitPay AI — Your Portrait, Your Rights",
    description: "AI-powered face tracing and portrait copyright protection platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "PortraitPay AI — Your Portrait, Your Rights",
    description: "AI-powered face tracing and portrait copyright protection platform",
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
    <html lang="en-US" suppressHydrationWarning>
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
