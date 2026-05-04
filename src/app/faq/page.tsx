/**
 * /faq - FAQ page
 * Uses translations from LanguageContext
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full text-left px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white pr-4">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = (t.faq.items || [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ]).map((item: { q: string; a: string }) => ({ q: item.q, a: item.a }));

  function toggleIndex(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="PortraitPay AI" className="logo-light w-8 h-8 object-contain" style={{ borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="PortraitPay AI" className="logo-dark w-8 h-8 object-contain" style={{ borderRadius: "6px" }} />
            <span className="font-bold text-gray-900 dark:text-white text-sm" style={{ letterSpacing: "-0.02em" }}>PortraitPay AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/contracts" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
              {t.common?.contracts || t.nav?.contracts || "Contracts"}
            </Link>
            <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
              {t.nav?.signIn || "Sign In"}
            </Link>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-gray-950 dark:to-black text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
            {t.faq.title}
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            {t.faq.sub || t.faq.title}
          </p>
        </div>
      </section>

      {/* FAQ content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Main Q&A */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                {t.faq.commonTitle || "Common Questions"}
              </h2>
              {items.map((item, i) => (
                <AccordionItem
                  key={i}
                  question={item.q}
                  answer={item.a}
                  isOpen={openIndex === i}
                  onToggle={() => toggleIndex(i)}
                />
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Still have questions */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {t.faq.stillHaveQuestions || "Still have questions?"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t.faq.teamResponseTime || "Our team will respond within 1-3 business days"}
                </p>
                <Link
                  href="/contact"
                  className="block text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {t.common?.contactUs || t.nav?.contact || "Contact Us"}
                </Link>
              </div>

              {/* Quick links */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {t.faq.quickLinks || "Quick Links"}
                </h3>
                <div className="space-y-3">
                  {[
                    { href: "/contracts", label: t.contracts?.title || "Contracts" },
                    { href: "/enterprise/authorization/apply", label: t.enterprise?.requestLicense || "Request a License" },
                    { href: "/enterprise/certification", label: t.enterprise?.certification || "Enterprise Certification" },
                    { href: "/lawyer/apply", label: t.lawyerSection?.applyNow || "Lawyer Registration" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Blockchain FAQ highlight */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                  {t.faq.blockchainValidTitle || "Is the blockchain certificate legally valid?"}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  {t.faq.blockchainValidDesc || "Yes. IPFS hash + timestamp + 128-dim face vector confirmed by partner law firms as litigation evidence."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm">© 2026 PortraitPay AI</p>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">{t.footer?.privacy || "Privacy Policy"}</Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">{t.footer?.terms || "Terms of Service"}</Link>
            <Link href="/contracts" className="hover:text-gray-900 dark:hover:text-white">{t.contracts?.title || "Contracts"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
