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
    labelKey: "fileOverview",
    icon: "📋",
  },
  {
    name: "01-Standard-License-Agreement",
    labelKey: "fileStandard",
    icon: "📄",
  },
  {
    name: "02-Exclusive-License-Agreement",
    labelKey: "fileExclusive",
    icon: "🏆",
  },
  {
    name: "03-Endorsement-License-Agreement",
    labelKey: "fileEndorsement",
    icon: "⭐",
  },
  {
    name: "04-Film-Adaptation-License-Agreement",
    labelKey: "fileFilm",
    icon: "🎬",
  },
];

export default function ContractsPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";

  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingWord, setDownloadingWord] = useState<string | null>(null);
  const [unlockedContracts, setUnlockedContracts] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const checkUnlock = () => {
      const unlocked: Record<string, boolean> = {};
      for (const c of CONTRACT_FILES) {
        unlocked[c.name] = localStorage.getItem(`wordUnlocked_${c.name}`) === "true";
      }
      setUnlockedContracts(unlocked);
    };
    checkUnlock();
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
      alert(t.contracts.pdfDownloadFailed);
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
      alert(t.contracts.wordDownloadFailed);
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
            {t.contracts.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Page Header */}
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
          {t.contracts.title}
        </h1>
        <p style={{ fontSize: "var(--text-body)", color: "rgba(255,255,255,0.75)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
          {t.contracts.subtitle}
        </p>
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
          }}>
            ⚖️ {t.contracts.lawyerBadge}
          </span>
        </div>
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
                  <div className="w-14 h-14 rounded-xl bg-[#244169]/10 flex items-center justify-center text-3xl flex-shrink-0">
                    {contract.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {t.contracts[contract.labelKey]}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t.contracts[contract.labelKey + "Desc"]}
                    </p>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
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
                    {isPdfLoading ? t.contracts.downloading : t.contracts.freeDownloadPdf}
                  </button>

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
                      {isWordLoading ? t.contracts.downloading : t.contracts.downloadWord}
                    </button>
                  ) : (
                    <Link
                      href={`/contracts/payment?name=${encodeURIComponent(contract.name)}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#244169] hover:bg-[#1a3354] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {t.contracts.unlockWord}
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
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <svg className="w-4 h-4 text-[#244169] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t.contracts.footerDisclaimer}
            </span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="logo-light w-6 h-6 object-contain" style={{ borderRadius: "4px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark w-6 h-6 object-contain" style={{ borderRadius: "4px" }} />
            <span className="text-gray-500 dark:text-gray-400 text-sm">PortraitPay AI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">{t.contracts.privacyLink}</Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">{t.contracts.termsLink}</Link>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">{t.contracts.copyright}</p>
        </div>
      </footer>
    </div>
  );
}