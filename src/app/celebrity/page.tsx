/**
 * /celebrity — Celebrity Artist Application Page
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

interface FormData {
  name: string;
  email: string;
  contactPhone: string;
  stageName: string;
  category: string;
  socialMedia: string;
  agency: string;
  message: string;
}

interface FieldError {
  name?: string;
  email?: string;
  stageName?: string;
  category?: string;
}

const CATEGORY_OPTIONS: { value: string; icon: string }[] = [
  { value: "star", icon: "⭐" },
  { value: "actor", icon: "🎬" },
  { value: "singer", icon: "🎤" },
  { value: "influencer", icon: "📱" },
  { value: "athlete", icon: "🏆" },
  { value: "artist", icon: "🎨" },
  { value: "other", icon: "🌟" },
];

export default function CelebrityPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    contactPhone: "",
    stageName: "",
    category: "",
    socialMedia: "",
    agency: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = isZh ? "请填写真实姓名" : "Real name is required";
    if (!form.email.trim()) e.email = isZh ? "请填写邮箱" : "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = isZh ? "邮箱格式不正确" : "Invalid email format";
    if (!form.stageName.trim()) e.stageName = isZh ? "请填写艺名/舞台名" : "Stage name is required";
    if (!form.category) e.category = isZh ? "请选择艺人类型" : "Please select artist category";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/v1/celebrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          contactPhone: form.contactPhone,
          stageName: form.stageName,
          category: form.category,
          socialMedia: form.socialMedia,
          agency: form.agency,
          message: form.message,
        }),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.celebrity.applicationSubmittedTitle}</h2>
          <p className="text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: t.celebrity.applicationSubmittedDesc }} />
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="block w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
            >
              {t.celebrity.backToHome}
            </Link>
            <Link
              href="/contact"
              className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              {t.celebrity.otherEnquiries}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PortraitPay AI" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>PortraitPay AI</span>
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/enterprise/contact" className="text-sm text-gray-500 hover:text-gray-700 transition">
              {t.celebrity.enterpriseSettlement}
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700 transition">
              {t.celebrity.normalContact}
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
              {t.celebrity.backHome}
            </Link>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 mb-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🌟</div>
              <div>
                <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">{t.celebrity.heroTag}</span>
                <h1 className="text-2xl font-bold mt-2">{t.celebrity.title}</h1>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{t.celebrity.socialProof}</div>
            </div>
          </div>
          <p className="text-purple-100 text-sm leading-relaxed mb-6">
            {t.celebrity.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🚨", label: t.celebrity.scenario1, sub: t.celebrity.scenario1Desc },
              { icon: "⚠️", label: t.celebrity.scenario2, sub: t.celebrity.scenario2Desc },
              { icon: "💼", label: t.celebrity.scenario3, sub: t.celebrity.scenario3Desc },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-xl mb-2">{s.icon}</div>
                <p className="text-sm font-semibold mb-1">{s.label}</p>
                <p className="text-xs text-purple-200 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">{t.celebrity.fillApplication}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.celebrity.realNameRequired} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder={isZh ? "张三" : "Zhang San"}
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.celebrity.workEmailRequired} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="artist@agency.com"
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.celebrity.phone} <span className="text-gray-400 font-normal">{t.celebrity.phoneOptional}</span>
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => update("contactPhone", e.target.value)}
                    placeholder="+86 138-0000-0000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Stage name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.celebrity.stageNameRequired} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.stageName}
                    onChange={(e) => update("stageName", e.target.value)}
                    placeholder={t.celebrity.stageNamePlaceholder}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.stageName ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.stageName && <p className="mt-1 text-xs text-red-500">{errors.stageName}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.celebrity.categoryRequired} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => update("category", cat.value)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border transition ${
                          form.category === cat.value
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{(t.celebrity[cat.value as keyof typeof t.celebrity]) as string ?? cat.value}</span>
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>

                {/* Social media */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.celebrity.socialMedia} <span className="text-gray-400 font-normal">{t.celebrity.socialMediaOptional}</span>
                  </label>
                  <input
                    type="text"
                    value={form.socialMedia}
                    onChange={(e) => update("socialMedia", e.target.value)}
                    placeholder={t.celebrity.socialMediaPlaceholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{t.celebrity.socialMediaHint}</p>
                </div>

                {/* Agency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.celebrity.agency} <span className="text-gray-400 font-normal">{t.celebrity.agencyOptional}</span>
                  </label>
                  <input
                    type="text"
                    value={form.agency}
                    onChange={(e) => update("agency", e.target.value)}
                    placeholder={t.celebrity.agencyPlaceholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.celebrity.additionalInfo} <span className="text-gray-400 font-normal">{t.celebrity.additionalInfoOptional}</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder={t.celebrity.additionalInfoPlaceholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                {serverError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      {t.celebrity.submitting}
                    </>
                  ) : (
                    t.celebrity.submitApplication
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  {isZh ? "提交即表示您同意我们的" : "By submitting, you agree to our"}{" "}
                  <a href="/privacy" className="text-purple-600 hover:underline">{t.celebrity.privacyPolicy}</a>
                </p>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* What you get */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">{t.celebrity.benefits}</h3>
              <ul className="space-y-3">
                {[
                  { icon: "🔐", text: t.celebrity.blockchainCert },
                  { icon: "💰", text: t.celebrity.royaltyRevenue },
                  { icon: "⚖️", text: t.celebrity.lawyerSupport },
                  { icon: "📊", text: t.celebrity.dataDashboard },
                  { icon: "📜", text: t.celebrity.officialLicense },
                  { icon: "🤝", text: t.celebrity.enterpriseLiaison },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Process */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">{t.celebrity.processTitle}</h3>
              <ol className="space-y-4">
                {[
                  { step: "1", text: t.celebrity.processStep1 },
                  { step: "2", text: t.celebrity.processStep2 },
                  { step: "3", text: t.celebrity.processStep3 },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <span className="pt-0.5 font-medium">{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
              <p className="text-sm font-medium mb-3">{t.celebrity.ctaButton}</p>
              <Link
                href="/register?type=celebrity"
                className="block w-full py-3 bg-white text-purple-700 rounded-xl text-sm font-semibold text-center hover:bg-purple-50 transition"
              >
                {t.celebrity.submitApplication}
              </Link>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-purple-200 mb-2">{t.celebrity.alreadyArtist}</p>
                <Link
                  href="/login"
                  className="text-sm text-white/80 hover:text-white underline"
                >
                  {t.celebrity.artistLogin}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
