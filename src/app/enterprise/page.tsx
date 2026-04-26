"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
}

interface FieldError {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
}

export default function EnterprisePage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN";

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const plans = t.pricing.plans;

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = isZh ? "请填写姓名" : "Please enter your name";
    if (!form.email.trim()) e.email = isZh ? "请填写邮箱" : "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = isZh ? "邮箱格式不正确" : "Invalid email format";
    if (!form.company.trim()) e.company = isZh ? "请填写公司名称" : "Please enter your company name";
    if (!form.message.trim()) e.message = isZh ? "请填写留言内容" : "Please enter your message";
    else if (form.message.trim().length < 10) e.message = isZh ? "留言至少10个字符" : "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "ENTERPRISE" }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setServerError(json.error ?? (isZh ? "提交失败，请稍后重试" : "Submission failed, please try again later"));
      }
    } catch {
      setServerError(isZh ? "网络错误，请检查网络连接" : "Network error, please check your connection");
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isZh ? "提交成功！" : "Submitted Successfully!"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isZh ? "感谢您的留言，我们的团队会在 1-3 个工作日内与您联系。" : "Thank you for your message. Our team will get back to you within 1-3 business days."}
          </p>
          <Link
            href="/"
            className="inline-block w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isZh ? "返回首页" : "Back to Home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">PortraitPay AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
              {isZh ? "登录" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full mb-6">
              🏢 {isZh ? "企业解决方案" : "Enterprise Solutions"}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {isZh ? "为企业和代理机构打造" : "Built for Enterprises & Agencies"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              {isZh
                ? "批量管理艺术家肖像、定制授权条款、专属客户经理，以及完整的 API 接口访问。"
                : "Bulk manage artist portraits, custom licensing terms, dedicated account managers, and full API access."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                {isZh ? "联系销售" : "Contact Sales"}
              </a>
              <Link href="/enterprise/agency" className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {isZh ? "了解代理功能" : "Learn about Agency Features"}
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              {isZh ? "企业版功能" : "Enterprise Features"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "👥", title: isZh ? "多艺术家管理" : "Multi-Artist Management", desc: isZh ? "在一个仪表板中管理多位艺术家和他们的作品集" : "Manage multiple artists and their portfolios in one dashboard" },
                { icon: "📋", title: isZh ? "批量上传" : "Bulk Upload", desc: isZh ? "一次上传多位艺术家的多个肖像作品" : "Upload multiple portraits for multiple artists at once" },
                { icon: "📜", title: isZh ? "白标证书" : "White-Label Certificates", desc: isZh ? "为您的品牌定制区块链证书外观" : "Customize blockchain certificate appearance for your brand" },
                { icon: "🔗", title: isZh ? "API 接口" : "API Access", desc: isZh ? "完整的 REST API 用于系统集成" : "Full REST API for system integration" },
                { icon: "👔", title: isZh ? "专属客户经理" : "Dedicated Account Manager", desc: isZh ? "获得专门的支持团队帮助您成功" : "Get a dedicated support team to help you succeed" },
                { icon: "⚙️", title: isZh ? "自定义授权条款" : "Custom Licensing Terms", desc: isZh ? "灵活定制授权规则和分成比例" : "Flexibly customize licensing rules and revenue splits" },
              ].map((feature, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Service Hub */}
        <section className="py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isZh ? "企业服务" : "Enterprise Services"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isZh ? "一站式满足企业数字人授权和肖像权保护需求" : "All-in-one platform for digital avatar licensing and portrait rights protection"}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  href: "/enterprise/authorization/apply",
                  icon: "📄",
                  title: isZh ? "申请授权" : "Apply for License",
                  desc: isZh ? "申请数字人授权合同模板" : "Request digital avatar licensing contracts",
                  color: "blue",
                },
                {
                  href: "/enterprise/authorization/list",
                  icon: "📋",
                  title: isZh ? "授权查询" : "License Records",
                  desc: isZh ? "查询已申请的数字人授权" : "Check your digital avatar license records",
                  color: "purple",
                },
                {
                  href: "/enterprise/certification",
                  icon: "🏢",
                  title: isZh ? "企业认证" : "Enterprise Cert",
                  desc: isZh ? "企业级肖像批量认证服务" : "Enterprise-level portrait certification",
                  color: "emerald",
                },
                {
                  href: "/contact",
                  icon: "📞",
                  title: isZh ? "联系我们" : "Contact Us",
                  desc: isZh ? "联系销售团队获取定制方案" : "Get a customized plan from sales",
                  color: "amber",
                },
              ].map((service) => (
                <a
                  key={service.href}
                  href={service.href}
                  className="group flex flex-col items-start p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                >
                  <span className="text-3xl mb-3">{service.icon}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{service.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 sm:py-20 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
              {t.pricing.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-12">
              {t.pricing.sub}
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 border-2 transition-all ${
                    plan.highlight
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg scale-105"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  }`}
                >
                  {plan.highlight && (
                    <div className="text-center mb-4">
                      <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                        {t.pricing.proBadge}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    {plan.period && <span className="text-gray-500">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {i === 2 ? (
                    <a
                      href="#contact"
                      className={`block w-full py-3 text-center font-medium rounded-lg transition-colors ${
                        plan.highlight
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {t.pricing.contactUs}
                    </a>
                  ) : (
                    <Link
                      href="/register"
                      className={`block w-full py-3 text-center font-medium rounded-lg transition-colors ${
                        plan.highlight
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-16 sm:py-20">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {isZh ? "联系销售团队" : "Contact Our Sales Team"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isZh ? "告诉我们您的需求，我们将为您提供定制方案" : "Tell us about your needs and we'll provide a customized plan"}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {isZh ? "姓名" : "Name"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder={isZh ? "您的姓名" : "Your name"}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {isZh ? "邮箱" : "Email"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="your@email.com"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {isZh ? "公司" : "Company"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      placeholder={isZh ? "公司名称" : "Company name"}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.company ? "border-red-500" : ""}`}
                    />
                    {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {isZh ? "电话" : "Phone"}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder={isZh ? "手机号（选填）" : "Phone (optional)"}
                      className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    {isZh ? "留言内容" : "Message"} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder={isZh ? "请描述您的需求..." : "Please describe your needs..."}
                    rows={4}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.message ? "border-red-500" : ""}`}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                </div>

                {serverError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {submitting ? (isZh ? "提交中..." : "Submitting...") : (isZh ? "提交" : "Submit")}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
