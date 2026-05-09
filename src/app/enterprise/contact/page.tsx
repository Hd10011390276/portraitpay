"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

// SVG icon strings (single-line, safe for JSX attribute values)
type IconProps = { className?: string; style?: React.CSSProperties };
const SVG_BUILDING = "M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm9 20v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01";
const SVG_ZAP = "M13 2L3 14h9l-1 8 10-12h-1l1-8z";
const SVG_FILETEXT = "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H9H8";
const SVG_SHIELD = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
const SVG_SCALE = "M12 3v18M5 7H3M5 3H3M19 7h2M19 3h2M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5";
const SVG_BARCHART = "M18 20V10M12 20V4M6 20v6";
const SVG_ARROW_RIGHT = "M5 12h14M12 5l7 7-7 7";
const SVG_USERS = "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75";
const SVG_STAR = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 6.91-1.01L12 2z";

function IconBuilding({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SVG_BUILDING}/></svg>;
}
function IconZap({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SVG_ZAP}/></svg>;
}
function IconFileText({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d={SVG_FILETEXT}/></svg>;
}
function IconShield({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SVG_SHIELD}/></svg>;
}
function IconScale({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d={SVG_SCALE}/></svg>;
}
function IconBarChart({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SVG_BARCHART}/></svg>;
}
function IconArrowRight({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SVG_ARROW_RIGHT}/></svg>;
}
function IconUsers({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d={SVG_USERS}/></svg>;
}
function IconStar({ className, style }: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SVG_STAR}/></svg>;
}

interface FormData {
  name: string;
  email: string;
  contactPhone: string;
  company: string;
  enterpriseName: string;
  intendedUse: string;
  expectedScale: string;
  message: string;
}

interface FieldError {
  name?: string;
  email?: string;
  enterpriseName?: string;
  intendedUse?: string;
}

const SCALE_KEYS = ["scale1", "scale2", "scale3", "scale4", "scale5"] as const;

const USE_CASES = [
  { key: "useCaseMarketing", zh: "品牌营销与广告" },
  { key: "useCaseProduct", zh: "产品包装与设计" },
  { key: "useCaseContent", zh: "内容创作与媒体" },
  { key: "useCaseEcommerce", zh: "电商与零售" },
  { key: "useCaseEducation", zh: "教育培训" },
  { key: "useCaseAiTraining", zh: "AI模型训练" },
  { key: "useCaseOther", zh: "其他" },
] as const;

export default function EnterpriseContactPage() {
  const { t } = useLanguage();

  const [form, setForm] = useState<FormData>({
    name: "", email: "", contactPhone: "", company: "",
    enterpriseName: "", intendedUse: "", expectedScale: "", message: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = t.enterpriseContact.validationName;
    if (!form.email.trim()) e.email = t.enterpriseContact.validationEmail;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.enterpriseContact.validationEmailFormat;
    if (!form.enterpriseName.trim()) e.enterpriseName = t.enterpriseContact.validationEnterprise;
    if (!form.intendedUse.trim()) e.intendedUse = t.enterpriseContact.validationUse;
    else if (form.intendedUse.trim().length < 10) e.intendedUse = t.enterpriseContact.validationUseLen;
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
      if (json.success) { setSuccess(true); }
      else { setServerError(json.error ?? t.enterpriseContact.serverError); }
    } catch { setServerError(t.enterpriseContact.networkError); }
    finally { setSubmitting(false); }
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
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mx-auto mb-6 flex items-center justify-center">
            <IconBuilding className="w-9 h-9 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t.enterpriseContact.success}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            {t.enterpriseContact.successMsg}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              {t.enterpriseContact.backHome} <IconArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center">
              {t.enterpriseContact.backContact}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="nav-glass sticky top-0 z-30">
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">PortraitPay AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-10 mb-10 text-white flex items-center gap-8 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <IconBuilding className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-60">
            <h1 className="text-2xl font-bold mb-2 tracking-tight text-white">
              {t.enterpriseContact.title}
            </h1>
            <p className="text-sm opacity-85 leading-relaxed max-w-xl text-white/90">
              {t.enterpriseContact.subtitle}
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <IconZap className="w-5 h-5" />, label: t.enterpriseContact.trustFastResponse, sub: t.enterpriseContact.trustFastResponseSub },
            { icon: <IconFileText className="w-5 h-5" />, label: t.enterpriseContact.trustBulkLicense, sub: t.enterpriseContact.trustBulkLicenseSub },
            { icon: <IconShield className="w-5 h-5" />, label: t.enterpriseContact.trustCompliance, sub: t.enterpriseContact.trustComplianceSub },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid: form + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Form card */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-8">
              {t.enterpriseContact.formTitle}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">

              {/* Row: name + email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t.enterpriseContact.name} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder={t.enterpriseContact.namePlaceholder}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t.enterpriseContact.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder={t.enterpriseContact.emailPlaceholder}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border ${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Row: phone + dept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t.enterpriseContact.phone}
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => update("contactPhone", e.target.value)}
                    placeholder={t.enterpriseContact.phonePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t.enterpriseContact.company}
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                    placeholder={t.enterpriseContact.companyPlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Enterprise name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t.enterpriseContact.enterpriseName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.enterpriseName}
                  onChange={(e) => update("enterpriseName", e.target.value)}
                  placeholder={t.enterpriseContact.enterpriseNamePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border ${errors.enterpriseName ? "border-red-500" : "border-gray-300 dark:border-gray-600"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                />
                {errors.enterpriseName && <p className="text-xs text-red-500 mt-1">{errors.enterpriseName}</p>}
              </div>

              {/* Use case */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t.enterpriseContact.intendedUse} <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {USE_CASES.map((uc) => {
                    const label = t.enterpriseContact[uc.key as keyof typeof t.enterpriseContact] as string;
                    return (
                      <button
                        key={uc.key}
                        type="button"
                        onClick={() => update("intendedUse", label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          form.intendedUse === label
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={form.intendedUse}
                  onChange={(e) => update("intendedUse", e.target.value)}
                  placeholder={t.enterpriseContact.intendedUsePlaceholder}
                  rows={4}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border ${errors.intendedUse ? "border-red-500" : "border-gray-300 dark:border-gray-600"} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors`}
                />
                {errors.intendedUse && <p className="text-xs text-red-500 mt-1">{errors.intendedUse}</p>}
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t.enterpriseContact.scale}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SCALE_KEYS.map((opt) => {
                    const label = t.enterpriseContact[opt as keyof typeof t.enterpriseContact] as string;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("expectedScale", label)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                          form.expectedScale === label
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {t.enterpriseContact.message}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={t.enterpriseContact.messagePlaceholder}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                />
              </div>

              {serverError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.enterpriseContact.submitting}
                  </>
                ) : (
                  <>{t.enterpriseContact.submit} <IconArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Package includes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5">
                {t.enterpriseContact.packageIncludes}
              </h3>
              <ul className="flex flex-col gap-3.5">
                {[
                  { icon: <IconFileText className="w-4 h-4" />, key: "package1" },
                  { icon: <IconUsers className="w-4 h-4" />, key: "package2" },
                  { icon: <IconShield className="w-4 h-4" />, key: "package3" },
                  { icon: <IconScale className="w-4 h-4" />, key: "package4" },
                  { icon: <IconBarChart className="w-4 h-4" />, key: "package5" },
                  { icon: <IconScale className="w-4 h-4" />, key: "package6" },
                ].map((item) => (
                  <li key={item.key} className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">{item.icon}</span>
                    <span>{t.enterpriseContact[item.key as keyof typeof t.enterpriseContact]}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Case studies */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5">
                {t.enterpriseContact.caseStudies}
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { brandKey: "case1Brand", caseKey: "case1Desc", badge: "E-comm" },
                  { brandKey: "case2Brand", caseKey: "case2Desc", badge: "Film" },
                  { brandKey: "case3Brand", caseKey: "case3Desc", badge: "AI" },
                ].map((c) => (
                  <div key={c.brandKey} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <IconStar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {t.enterpriseContact[c.brandKey as keyof typeof t.enterpriseContact]}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        {c.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.enterpriseContact[c.caseKey as keyof typeof t.enterpriseContact]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent contact CTA */}
            <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                {t.enterpriseContact.urgentContact}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                {t.enterpriseContact.urgentContactSub}
              </p>
              <a href="mailto:contact@portraitpayai.com" className="text-xs text-blue-600 dark:text-blue-400 font-medium no-underline break-all">
                contact@portraitpayai.com
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-default)", padding: "24px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/logo.png" alt="PortraitPay AI Logo" className="logo-light" style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }} />
            <img src="/logo-dark.png" alt="PortraitPay AI Logo" className="logo-dark" style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>PortraitPay AI</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>{t.footer?.copyright ?? "© 2024 PortraitPay AI. All rights reserved."}</p>
        </div>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}