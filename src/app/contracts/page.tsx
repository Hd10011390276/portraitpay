/**
 * /contracts - Digital Avatar Licensing Contracts showcase page
 * Public marketing page for production companies and brands
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const contracts = [
  {
    type: "Standard License",
    typeZh: "标准授权",
    icon: "📄",
    description: "General use for social media, advertisements, and products.",
    descriptionZh: "适用于社交媒体、广告和产品的通用授权。",
    duration: "12",
    durationUnit: "months",
    durationUnitZh: "个月",
    useCases: ["Social media posts", "Online advertisements", "Product packaging", "Marketing materials"],
    useCasesZh: ["社交媒体帖子", "在线广告", "产品包装", "营销材料"],
    color: "blue",
    bgLight: "from-blue-50 to-indigo-50",
    bgDark: "dark:from-blue-900/20 dark:to-indigo-900/20",
    borderLight: "border-blue-200",
    borderDark: "dark:border-blue-800",
    accentLight: "text-blue-700 dark:text-blue-400",
    badgeLight: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    type: "Exclusive License",
    typeZh: "独家授权",
    icon: "🏆",
    description: "Full exclusivity including film, gaming, and broadcast rights.",
    descriptionZh: "包含电影、游戏和广播权的完全独家授权。",
    duration: "24",
    durationUnit: "months",
    durationUnitZh: "个月",
    useCases: ["Film & TV productions", "Video games", "Broadcasting", "All commercial uses"],
    useCasesZh: ["电影和电视节目", "电子游戏", "广播", "所有商业用途"],
    color: "purple",
    bgLight: "from-purple-50 to-pink-50",
    bgDark: "dark:from-purple-900/20 dark:to-pink-900/20",
    borderLight: "border-purple-200",
    borderDark: "dark:border-purple-800",
    accentLight: "text-purple-700 dark:text-purple-400",
    badgeLight: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    type: "Endorsement License",
    typeZh: "代言授权",
    icon: "⭐",
    description: "Brand endorsement, advertisement filming, and promotional activities.",
    descriptionZh: "品牌代言、广告拍摄和推广活动。",
    duration: "12",
    durationUnit: "months",
    durationUnitZh: "个月",
    useCases: ["Brand campaigns", "TV commercials", "Print advertising", "Event appearances"],
    useCasesZh: ["品牌活动", "电视广告", "平面广告", "活动出席"],
    color: "amber",
    bgLight: "from-amber-50 to-orange-50",
    bgDark: "dark:from-amber-900/20 dark:to-orange-900/20",
    borderLight: "border-amber-200",
    borderDark: "dark:border-amber-800",
    accentLight: "text-amber-700 dark:text-amber-400",
    badgeLight: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    type: "Film Adaptation",
    typeZh: "影视改编",
    icon: "🎬",
    description: "Film, TV, and web series exclusive licensing with maximum protection.",
    descriptionZh: "电影、电视和网络剧的独家授权，最大程度保护。",
    duration: "36",
    durationUnit: "months",
    durationUnitZh: "个月",
    useCases: ["Feature films", "TV series", "Web dramas", "Documentaries"],
    useCasesZh: ["电影", "电视剧", "网络剧", "纪录片"],
    color: "emerald",
    bgLight: "from-emerald-50 to-teal-50",
    bgDark: "dark:from-emerald-900/20 dark:to-teal-900/20",
    borderLight: "border-emerald-200",
    borderDark: "dark:border-emerald-800",
    accentLight: "text-emerald-700 dark:text-emerald-400",
    badgeLight: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
];

export default function ContractsPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="PortraitPay AI" className="logo-light w-8 h-8 object-contain" style={{ borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="PortraitPay AI" className="logo-dark w-8 h-8 object-contain" style={{ borderRadius: "6px" }} />
            <span className="font-bold text-gray-900 dark:text-white text-sm" style={{ letterSpacing: "-0.02em" }}>PortraitPay AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/enterprise/authorization/apply" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              {isZh ? "申请授权" : "Request License"}
            </Link>
            <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm">
              {isZh ? "登录" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 dark:from-gray-950 dark:to-black text-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            {isZh ? "区块链认证 · 律师审核 · 永久有效" : "Blockchain Certified · Lawyer Reviewed · Permanently Valid"}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
            {isZh ? "数字人授权合同" : "Digital Avatar Licensing Contracts"}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            {isZh
              ? "为制片公司、品牌和创作者打造的合法数字人授权解决方案。区块链存证 + 律师审核 = 法律认可的授权证明。"
              : "Legally binding authorization for production companies, brands, and creators. Blockchain evidence + lawyer review = legally admissible proof."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/enterprise/authorization/apply" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              {isZh ? "申请授权合同" : "Request a Contract"}
            </Link>
            <Link href="/faq" className="px-6 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-medium rounded-lg transition-colors">
              {isZh ? "常见问题" : "View FAQ"}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {isZh ? "工作流程" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: isZh ? "选择合同模板" : "Choose Contract Template", desc: isZh ? "从4种授权类型中选择最适合您用途的模板" : "Select from 4 license types for your use case" },
              { step: "02", title: isZh ? "提交授权申请" : "Submit Authorization Request", desc: isZh ? "填写表单，附上数字人相关资料和授权范围" : "Fill out the form with avatar details and license scope" },
              { step: "03", title: isZh ? "律师审核确认" : "Lawyer Review & Approval", desc: isZh ? "平台律师审核合同内容，确保合法合规" : "Platform lawyers review to ensure legal compliance" },
              { step: "04", title: isZh ? "获得区块链授权证明" : "Receive Blockchain Certificate", desc: isZh ? "签署完成后获得链上授权证明，可供第三方验证" : "Receive on-chain authorization proof verifiable by LibTV/Runway" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {isZh ? "授权合同模板" : "License Contract Templates"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
            {isZh
              ? "每种合同模板都由执业律师审核，确保符合行业标准并具有法律效力"
              : "Each contract template is reviewed by licensed lawyers, ensuring industry standards and legal validity"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contracts.map((contract) => (
              <div
                key={contract.type}
                className={`bg-gradient-to-br ${contract.bgLight} ${contract.bgDark} border ${contract.borderLight} ${contract.borderDark} rounded-2xl p-8 hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-4xl mb-3 block`}>{contract.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{isZh ? contract.typeZh : contract.type}</h3>
                    <p className={`text-sm ${contract.accentLight} mt-1`}>{contract.type}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${contract.badgeLight}`}>
                    {contract.duration} {isZh ? contract.durationUnitZh : contract.durationUnit}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {isZh ? contract.descriptionZh : contract.description}
                </p>

                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {isZh ? "适用场景" : "Use Cases"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(isZh ? contract.useCasesZh : contract.useCases).map((useCase) => (
                      <span key={useCase} className="px-3 py-1 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/enterprise/authorization/apply"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700`}
                >
                  {isZh ? "申请此合同" : "Request This License"}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 px-6 bg-gray-900 dark:bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            {isZh ? "为什么选择 PortraitPay 授权合同？" : "Why PortraitPay Licensing Contracts?"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔗",
                title: isZh ? "区块链存证" : "Blockchain Evidence",
                desc: isZh ? "每份合同都有链上哈希值，可被 LibTV、Runway、Midjourney 等平台验证" : "Every contract has an on-chain hash verifiable by LibTV, Runway, and Midjourney",
              },
              {
                icon: "⚖️",
                title: isZh ? "律师审核" : "Lawyer Reviewed",
                desc: isZh ? "所有合同模板由合作律所审核，确保法律效力" : "All contract templates reviewed by partner law firms for legal enforceability",
              },
              {
                icon: "💰",
                title: isZh ? "自动分账" : "Auto Profit Sharing",
                desc: isZh ? "智能合约自动执行分账，实时结算，无需人工介入" : "Smart contracts automatically distribute profits in real-time, no manual intervention",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {isZh ? "准备好申请数字人授权了吗？" : "Ready to License a Digital Avatar?"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {isZh
              ? "联系我们的团队，获取定制化授权方案和报价"
              : "Contact our team for a customized licensing plan and quote"}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/enterprise/authorization/apply" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              {isZh ? "立即申请" : "Apply Now"}
            </Link>
            <Link href="/contact" className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors">
              {isZh ? "联系我们" : "Contact Us"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="logo-light w-6 h-6 object-contain" style={{ borderRadius: "4px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark w-6 h-6 object-contain" style={{ borderRadius: "4px" }} />
            <span className="text-gray-500 dark:text-gray-400 text-sm">PortraitPay AI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "隐私政策" : "Privacy Policy"}</Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">{isZh ? "服务条款" : "Terms of Service"}</Link>
            <Link href="/faq" className="hover:text-gray-900 dark:hover:text-white">FAQ</Link>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">© 2026 PortraitPay AI</p>
        </div>
      </footer>
    </div>
  );
}
