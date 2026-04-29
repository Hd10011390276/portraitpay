/**
 * /contracts — Contract Templates Download Center
 * Dedicated page for downloading contract PDF (free) and Word (paid) files.
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

const CONTRACT_FILES = [
  {
    name: "00-Overview-and-Signing-Guide",
    label: "Overview & Signing Guide",
    labelZh: "概览与签署指南",
    icon: "📋",
    description: "Introduction to contract system and step-by-step signing instructions.",
    descriptionZh: "合同系统介绍及分步签署说明。",
  },
  {
    name: "01-Standard-License-Agreement",
    label: "Standard License Agreement",
    labelZh: "标准授权协议",
    icon: "📄",
    description: "General use for social media, advertisements, and products.",
    descriptionZh: "适用于社交媒体、广告和产品的通用授权。",
  },
  {
    name: "02-Exclusive-License-Agreement",
    label: "Exclusive License Agreement",
    labelZh: "独家授权协议",
    icon: "🏆",
    description: "Full exclusivity including film, gaming, and broadcast rights.",
    descriptionZh: "包含电影、游戏和广播权的完全独家授权。",
  },
  {
    name: "03-Endorsement-License-Agreement",
    label: "Endorsement License Agreement",
    labelZh: "代言授权协议",
    icon: "⭐",
    description: "Brand endorsement, advertisement filming, and promotional activities.",
    descriptionZh: "品牌代言、广告拍摄和推广活动。",
  },
  {
    name: "04-Film-Adaptation-License-Agreement",
    label: "Film Adaptation License Agreement",
    labelZh: "影视改编授权协议",
    icon: "🎬",
    description: "Film, TV, and web series exclusive licensing with maximum protection.",
    descriptionZh: "电影、电视和网络剧的独家授权，最大程度保护。",
  },
];

export default function ContractsPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN";
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingWord, setDownloadingWord] = useState<string | null>(null);
  const [unlockedContracts, setUnlockedContracts] = useState<Record<string, boolean>>({});

  // Check unlock status on mount and whenever localStorage changes
  React.useEffect(() => {
    const checkUnlock = () => {
      const unlocked: Record<string, boolean> = {};
      for (const c of CONTRACT_FILES) {
        unlocked[c.name] = localStorage.getItem(`wordUnlocked_${c.name}`) === "true";
      }
      setUnlockedContracts(unlocked);
    };
    checkUnlock();
    // Poll for localStorage changes (listen to storage event from same tab via custom event)
    const handler = () => checkUnlock();
    window.addEventListener("contracts:unlock", handler);
    return () => window.removeEventListener("contracts:unlock", handler);
  }, []);

  async function downloadPdf(name: string) {
    if (downloadingPdf) return;
    setDownloadingPdf(name);
    try {
      const res = await fetch(`/contracts/pdf/${name}.pdf`);
      if (!res.ok) throw new Error("PDF not found");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert(isZh ? "PDF 下载失败，请稍后重试" : "PDF download failed, please try again later");
    } finally {
      setDownloadingPdf(null);
    }
  }

  async function downloadWord(name: string) {
    if (downloadingWord) return;
    setDownloadingWord(name);
    try {
      const res = await fetch(`/api/contracts/${name}.docx`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert(isZh ? "Word 下载失败，请稍后重试" : "Word download failed, please try again later");
    } finally {
      setDownloadingWord(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Minimal sticky header with back link + theme/language toggles */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isZh ? "返回控制台" : "Back to Dashboard"}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Page Header — gradient hero card matching lawyer-registration style */}
      <section style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1a3a5c 100%)",
        padding: "48px 32px",
        borderRadius: "var(--radius-xl)",
        textAlign: "center",
        margin: "40px auto",
        maxWidth: "800px",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "white", letterSpacing: "-0.02em", marginBottom: "12px" }}>
          {isZh ? "合同模板下载中心" : "Contract Templates Download Center"}
        </h1>
        <p style={{ fontSize: "var(--text-body)", color: "rgba(255,255,255,0.75)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
          {isZh
            ? "免费下载 PDF 合同模板，或支付 $1 解锁 Word 可编辑版本。所有模板均经执业律师审核。"
            : "Free PDF download, or pay $1 to unlock editable Word versions. All templates reviewed by licensed lawyers."}
        </p>
      </section>

      {/* Contract Cards */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {CONTRACT_FILES.map((contract) => {
            const isPdfLoading = downloadingPdf === contract.name;
            const isWordLoading = downloadingWord === contract.name;
            const isUnlocked = unlockedContracts[contract.name];

            return (
              <div
                key={contract.name}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 flex items-start gap-5">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-[#244169]/10 flex items-center justify-center text-3xl flex-shrink-0">
                    {contract.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {isZh ? contract.labelZh : contract.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {isZh ? contract.descriptionZh : contract.description}
                    </p>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
                  {/* Free PDF */}
                  <button
                    onClick={() => downloadPdf(contract.name)}
                    disabled={isPdfLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {isPdfLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    {isPdfLoading
                      ? (isZh ? "下载中..." : "Downloading...")
                      : (isZh ? "免费下载 PDF" : "Free Download PDF")}
                  </button>

                  {/* Word — unlocked: direct download, otherwise go to payment */}
                  {isUnlocked ? (
                    <button
                      onClick={() => downloadWord(contract.name)}
                      disabled={isWordLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#244169] hover:bg-[#1a3354] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {isWordLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      {isWordLoading
                        ? (isZh ? "下载中..." : "Downloading...")
                        : (isZh ? "下载 Word" : "Download Word")}
                    </button>
                  ) : (
                    <Link
                      href={`/contracts/payment?name=${encodeURIComponent(contract.name)}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#244169] hover:bg-[#1a3354] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {isZh ? "解锁 Word $1" : "Unlock Word $1"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 px-6 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="logo-light w-6 h-6 object-contain" style={{ borderRadius: "4px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark w-6 h-6 object-contain" style={{ borderRadius: "4px" }} />
            <span className="text-gray-500 dark:text-gray-400 text-sm">PortraitPay AI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "隐私政策" : "Privacy Policy"}</Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "服务条款" : "Terms of Service"}</Link>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">© 2026 PortraitPay AI</p>
        </div>
      </footer>
    </div>
  );
}
