"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
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
  const isZh = false;

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
    if (!form.name.trim()) e.name = t.enterpriseContact.validationName;
    if (!form.email.trim()) e.email = t.enterpriseContact.validationEmail;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.enterpriseContact.validationEmailFormat;
    if (!form.company.trim()) e.company = t.enterpriseContact.validationEnterprise;
    if (!form.message.trim()) e.message = t.enterpriseContact.validationUse;
    else if (form.message.trim().length < 10) e.message = t.enterpriseContact.validationUseLen;
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
        setServerError(json.error ?? t.enterpriseContact.serverError);
      }
    } catch {
      setServerError(t.enterpriseContact.networkError);
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
            {t.enterpriseContact.success}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.enterpriseContact.successMsg}
          </p>
          <Link
            href="/"
            className="inline-block w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.enterpriseContact.backHome}
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
            <ThemeToggle />
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
              {t.enterpriseContact.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full mb-6">
              🏢 {t.enterpriseContact.enterpriseSolutions}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t.enterpriseContact.builtForEnterprise}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              {t.enterpriseContact.builtForEnterpriseSub}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#contact" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                {t.enterpriseContact.contactSales}
              </a>
              <Link href="/enterprise/agency" className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t.enterpriseContact.learnAgency}
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              {t.enterpriseContact.enterpriseFeatures}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "👥", title: t.enterpriseContact.multiArtistMgmt, desc: t.enterpriseContact.multiArtistMgmtDesc },
                { icon: "📋", title: t.enterpriseContact.bulkUpload, desc: t.enterpriseContact.bulkUploadDesc },
                { icon: "📜", title: t.enterpriseContact.whiteLabelCert, desc: t.enterpriseContact.whiteLabelCertDesc },
                { icon: "🔗", title: t.enterpriseContact.apiAccess, desc: t.enterpriseContact.apiAccessDesc },
                { icon: "👔", title: t.enterpriseContact.dedicatedAccountMgr, desc: t.enterpriseContact.dedicatedAccountMgrDesc },
                { icon: "⚙️", title: t.enterpriseContact.customLicenseTerms, desc: t.enterpriseContact.customLicenseTermsDesc },
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
                {t.enterpriseContact.enterpriseServices}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {t.enterpriseContact.enterpriseServicesSub}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  href: "/enterprise/authorization/apply",
                  icon: "📄",
                  title: t.enterpriseContact.applyForLicense,
                  desc: t.enterpriseContact.applyForLicenseDesc,
                  color: "blue",
                },
                {
                  href: "/enterprise/authorization/list",
                  icon: "📋",
                  title: t.enterpriseContact.licenseRecords,
                  desc: t.enterpriseContact.licenseRecordsDesc,
                  color: "purple",
                },
                {
                  href: "/enterprise/certification",
                  icon: "🏢",
                  title: t.enterpriseContact.enterpriseCert,
                  desc: t.enterpriseContact.enterpriseCertDesc,
                  color: "emerald",
                },
                {
                  href: "/contact",
                  icon: "📞",
                  title: t.enterpriseContact.contactUs,
                  desc: t.enterpriseContact.contactUsDesc,
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
              {plans.map((plan: any, i: number) => (
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
                    {plan.features.map((feature: any, j: number) => (
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
                {t.enterpriseContact.formTitle}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {t.enterpriseContact.subtitle}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {t.enterpriseContact.name} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder={t.enterpriseContact.namePlaceholder}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {t.enterpriseContact.email} <span className="text-red-500">*</span>
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
                      {t.enterpriseContact.company} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      placeholder={t.enterpriseContact.companyPlaceholder}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.company ? "border-red-500" : ""}`}
                    />
                    {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      {t.enterpriseContact.phone}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder={t.enterpriseContact.phonePlaceholder}
                      className="w-full px-4 py-2.5 rounded-lg border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    {t.enterpriseContact.message} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder={t.enterpriseContact.messagePlaceholder}
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
                  {submitting ? t.enterpriseContact.submitting : t.enterpriseContact.submit}
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
