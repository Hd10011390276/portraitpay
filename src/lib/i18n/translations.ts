/**
 * i18n — Translations dictionary for PortraitPay AI
 * Supports: zh-CN (default), en-US
 */

export type Locale = "zh-CN" | "en-US";

export const locales: Locale[] = ["zh-CN", "en-US"];
export const defaultLocale: Locale = "zh-CN";

export const translations = {
  "zh-CN": {
    // Navigation
    nav: {
      features: "功能特点",
      howItWorks: "如何使用",
      pricing: "价格方案",
      faq: "常见问题",
      signIn: "登录",
      getStarted: "免费开始",
    },
    // Hero
    hero: {
      badge: "已在以太坊 Sepolia 测试网上线",
      headline: "你的肖像。\n你的权利。\n上链。",
      sub: "在以太坊区块链上注册你的肖像权，带有不可变时间戳、IPFS 存储和智能合约许可。一次注册，永远拥有。",
      cta1: "免费注册 — 立即开始",
      cta2: "了解如何使用",
      socialProof: "已注册艺术家和创作者",
    },
    // Features
    features: {
      title: "保护你肖像权所需的一切",
      sub: "从上传到链上认证，只需几分钟。完全自动化，密码学安全。",
    },
    // How it works
    howItWorks: {
      title: "从肖像到受保护资产，只需4步",
      sub: "无需加密货币专业知识。我们处理区块链复杂性——你来掌控。",
    },
    // Pricing
    pricing: {
      title: "简单透明的定价",
      sub: "免费开始，随成长扩展。无隐藏费用。",
    },
    // FAQ
    faq: {
      title: "常见问题",
    },
    // CTA
    cta: {
      title: "准备好拥有你的肖像权了吗？",
      sub: "今天就加入成千上万的创作者，保护他们在区块链上的图像身份。",
      cta1: "立即免费开始",
      cta2: "登录",
    },
    // Footer
    footer: {
      copyright: "© 2026 PortraitPay AI. 保留所有权利。",
      privacy: "隐私政策",
      terms: "服务条款",
      contact: "联系我们",
    },
    // Meta
    meta: {
      title: "PortraitPay AI — 区块链肖像权保护",
      description:
        "在以太坊上注册你的肖像权。上传、认证、管理肖像授权，带有区块链时间戳和IPFS存储。",
    },
  },

  "en-US": {
    // Navigation
    nav: {
      features: "Features",
      howItWorks: "How it Works",
      pricing: "Pricing",
      faq: "FAQ",
      signIn: "Sign In",
      getStarted: "Get Started Free",
    },
    // Hero
    hero: {
      badge: "Now live on Ethereum Sepolia Testnet",
      headline: "Your Portrait.\nYour Rights.\nOn Chain.",
      sub: "Register your portrait rights on the Ethereum blockchain with immutable timestamps, IPFS storage, and smart-contract licensing. Own your image identity — once and for all.",
      cta1: "Start Free — Register Now",
      cta2: "See How It Works",
      socialProof: "artists and creators registered",
    },
    // Features
    features: {
      title: "Everything you need to protect your portrait rights",
      sub: "From upload to on-chain certification in minutes. Fully automated, cryptographically secure.",
    },
    // How it works
    howItWorks: {
      title: "From portrait to protected asset in 4 steps",
      sub: "No crypto expertise required. We handle the blockchain complexity — you keep control.",
    },
    // Pricing
    pricing: {
      title: "Simple, transparent pricing",
      sub: "Start free. Scale as you grow. No hidden fees.",
    },
    // FAQ
    faq: {
      title: "Frequently Asked Questions",
    },
    // CTA
    cta: {
      title: "Ready to own your portrait rights?",
      sub: "Join thousands of creators protecting their image identity on the blockchain today.",
      cta1: "Start Free Today",
      cta2: "Sign In",
    },
    // Footer
    footer: {
      copyright: "© 2026 PortraitPay AI. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
    },
    // Meta
    meta: {
      title: "PortraitPay AI — Portrait Rights on Blockchain",
      description:
        "Register your portrait rights on Ethereum. Upload, certify, and manage portrait authorization with blockchain timestamps and IPFS storage.",
    },
  },
} as const;

export type TranslationKeys = (typeof translations)["zh-CN"];
