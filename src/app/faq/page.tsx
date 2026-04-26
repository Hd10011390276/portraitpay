/**
 * /faq - FAQ page
 * Uses translations from LanguageContext
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

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
  const isZh = locale === "zh-CN";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = isZh
    ? [
        {
          q: "链上证书有法律效力吗？",
          a: "有。IPFS 哈希 + 时间戳 + 128维人脸向量 = 公证效果。合作律所确认可作为诉讼证据使用。",
        },
        {
          q: "如何验证数字人授权合同的真实性？",
          a: "每份合同都有 PortraitPay 平台签名 + 区块链哈希。LibTV、Runway 可通过公钥验证签名，确认授权来源。",
        },
        {
          q: "为什么制片公司要使用我们的合同？",
          a: "自行起草合同加律师费起步数万元。使用我们的模板加区块链证书费用更低，且有律所背书。",
        },
        {
          q: "1% 佣金够运营吗？",
          a: "数字人授权合同通常金额较大（数万至数百万）。1% 足以覆盖运营成本，同时提供完整法律保护。",
        },
        {
          q: "为什么不自己搭建侵权监控？",
          a: "成本高、效果差、法律风险大。律所模式更轻量、更有效。",
        },
        {
          q: "什么是肖像权认证？",
          a: "肖像权认证将您的肖像的存在、作者身份和时间戳记录在以太坊区块链上。这创建了一个不可变的、在法律上可接受的证明。",
        },
        {
          q: "使用 PortraitPay 需要加密货币吗？",
          a: "不需要。我们代为处理认证的 Gas 费用。您可以绑定银行卡或支付宝/微信支付进行提现。无需钱包设置。",
        },
        {
          q: "AI 侵权检测如何工作？",
          a: "我们的 AI 使用人脸识别 + 视觉相似度扫描网站、社交媒体和图片平台。当发现匹配度超过您设定的阈值时，您将收到警报和证据包。",
        },
      ]
    : t.faq.items.map((item: { q: string; a: string }) => ({ q: item.q, a: item.a }));

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
              {isZh ? "授权合同" : "Contracts"}
            </Link>
            <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
              {isZh ? "登录" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-gray-950 dark:to-black text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
            {isZh ? "常见问题" : "Frequently Asked Questions"}
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            {isZh
              ? "关于 PortraitPay AI 平台、链上证书和数字人授权的常见问题"
              : "Common questions about PortraitPay AI platform, on-chain certificates, and digital avatar licensing"}
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
                {isZh ? "常见问题" : "Common Questions"}
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
                  {isZh ? "还有其他问题？" : "Still have questions?"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {isZh
                    ? "我们的团队将在 1-3 个工作日内回复"
                    : "Our team will respond within 1-3 business days"}
                </p>
                <Link
                  href="/contact"
                  className="block text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isZh ? "联系我们" : "Contact Us"}
                </Link>
              </div>

              {/* Quick links */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {isZh ? "快速链接" : "Quick Links"}
                </h3>
                <div className="space-y-3">
                  {[
                    { href: "/contracts", label: isZh ? "数字人授权合同" : "Digital Avatar Contracts" },
                    { href: "/enterprise/authorization/apply", label: isZh ? "申请授权" : "Request a License" },
                    { href: "/enterprise/certification", label: isZh ? "企业认证服务" : "Enterprise Certification" },
                    { href: "/lawyer/apply", label: isZh ? "律师入驻" : "Lawyer Registration" },
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
                  {isZh ? "区块链证书有法律效力吗？" : "Is the blockchain certificate legally valid?"}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  {isZh
                    ? "是的。IPFS 哈希 + 时间戳 + 128维人脸向量经合作律所确认，可作为诉讼证据。"
                    : "Yes. IPFS hash + timestamp + 128-dim face vector confirmed by partner law firms as litigation evidence."}
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
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "隐私政策" : "Privacy Policy"}</Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "服务条款" : "Terms of Service"}</Link>
            <Link href="/contracts" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "授权合同" : "Contracts"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
