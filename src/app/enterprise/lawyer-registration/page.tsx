"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

const COUNTRIES = [
  { code: "US", name: "🇺🇸 United States", available: true },
  { code: "GB", name: "🇬🇧 United Kingdom", available: true },
  { code: "CA", name: "🇨🇦 Canada", available: true },
  { code: "AU", name: "🇦🇺 Australia", available: true },
  { code: "JP", name: "🇯🇵 Japan", available: true },
  { code: "KR", name: "🇰🇷 South Korea", available: true },
  { code: "SG", name: "🇸🇬 Singapore", available: true },
  { code: "HK", name: "🇭🇰 Hong Kong", available: true },
  { code: "TW", name: "🇹🇼 Taiwan", available: true },
  { code: "DE", name: "🇩🇪 Germany", available: true },
  { code: "FR", name: "🇫🇷 France", available: true },
  { code: "IT", name: "🇮🇹 Italy", available: true },
  { code: "ES", name: "🇪🇸 Spain", available: true },
  { code: "NL", name: "🇳🇱 Netherlands", available: true },
  { code: "CH", name: "🇨🇭 Switzerland", available: true },
  { code: "SE", name: "🇸🇪 Sweden", available: true },
  { code: "NO", name: "🇳🇴 Norway", available: true },
  { code: "DK", name: "🇩🇰 Denmark", available: true },
  { code: "FI", name: "🇫🇮 Finland", available: true },
  { code: "NZ", name: "🇳🇿 New Zealand", available: true },
  { code: "AE", name: "🇦🇪 UAE", available: true },
  { code: "SA", name: "🇸🇦 Saudi Arabia", available: true },
  { code: "IN", name: "🇮🇳 India", available: true },
  { code: "BR", name: "🇧🇷 Brazil", available: true },
  { code: "MX", name: "🇲🇽 Mexico", available: true },
  { code: "OTHER", name: "🌍 Other (Contact us)", available: true },
  { code: "CN", name: "🇨🇳 China (待开发)", available: false },
];

export default function LawyerRegistrationPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN";

  const [form, setForm] = useState({
    companyName: "",
    country: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    licenseUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.companyName.trim()) errs.companyName = isZh ? "请填写公司名称" : "Please enter company name";
    if (!form.country) errs.country = isZh ? "请选择国家/地区" : "Please select a country/region";
    const selected = COUNTRIES.find(c => c.code === form.country);
    if (selected && !selected.available) {
      errs.country = isZh ? "该地区尚未开放，请选择其他地区" : "This region is not yet available. Please select another.";
    }
    if (!form.contactName.trim()) errs.contactName = isZh ? "请填写联系人姓名" : "Please enter contact name";
    if (!form.contactEmail.trim()) errs.contactEmail = isZh ? "请填写邮箱" : "Please enter email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = isZh ? "邮箱格式不正确" : "Invalid email format";
    if (!form.contactPhone.trim()) errs.contactPhone = isZh ? "请填写联系电话" : "Please enter phone number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/lawyers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setServerError(json.error || (isZh ? "提交失败，请重试" : "Submission failed, please try again"));
      }
    } catch {
      setServerError(isZh ? "网络错误，请检查连接后重试" : "Network error, please check your connection");
    } finally {
      setLoading(false);
    }
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  if (success) {
    return (
      <DashboardShell
        title={isZh ? "律师楼入驻" : "Law Firm Registration"}
        subtitle={isZh ? "PortraitPay AI 律师楼入驻申请" : "PortraitPay AI Law Firm Registration"}
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isZh ? "申请已提交！" : "Application Submitted!"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isZh
                ? "感谢您的入驻申请。我们的审核团队会在 3-5 个工作日内完成审核，并通过邮件通知您结果。"
                : "Thank you for your application. Our review team will complete the review within 3-5 business days and notify you via email."}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isZh ? "返回首页" : "Back to Home"}
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={isZh ? "律师楼入驻" : "Law Firm Registration"}
      subtitle={isZh ? "PortraitPay AI 律师楼入驻申请" : "PortraitPay AI Law Firm Registration"}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🏛️</span>
            <div>
              <h1 className="text-2xl font-bold">
                {isZh ? "律师楼入驻申请" : "Law Firm Registration"}
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                {isZh ? "Join PortraitPay as a Verified Law Firm" : "Join PortraitPay as a Verified Law Firm"}
              </p>
            </div>
          </div>
          <p className="text-blue-100 text-sm">
            {isZh
              ? "入驻后，您的律所将作为平台授权的肖像权保护机构，为用户提供法律咨询、维权代理等服务。所有用户授权通过平台统一管理，避免私下交易。"
              : "After joining, your firm will act as a platform-authorized portrait rights protection agency, providing users with legal consulting, rights protection, and infringement handling services. All user authorizations are managed through the platform to prevent private transactions."}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
        >
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              ❌ {serverError}
            </div>
          )}

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {isZh ? "律所/公司名称" : "Law Firm / Company Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder={isZh ? "例如：Smith & Associates Law Firm" : "e.g. Smith & Associates Law Firm"}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
              />
              {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {isZh ? "国家/地区" : "Country / Region"} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
              >
                <option value="">
                  {isZh ? "请选择国家/地区" : "Select a country/region"}
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} disabled={!c.available}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {isZh ? "联系人姓名" : "Contact Person"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder={isZh ? "请输入联系人姓名" : "Enter contact name"}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactName ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
              />
              {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {isZh ? "邮箱" : "Email"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  placeholder="lawfirm@example.com"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactEmail ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {isZh ? "联系电话" : "Phone"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  placeholder={isZh ? "+1 555 123 4567" : "+1 555 123 4567"}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPhone ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                />
                {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
              </div>
            </div>

            {/* License URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {isZh ? "资质证明链接" : "License / Certificate Link"} <span className="text-gray-400 text-xs">({isZh ? "选填" : "Optional"})</span>
              </label>
              <input
                type="url"
                value={form.licenseUrl}
                onChange={(e) => set("licenseUrl", e.target.value)}
                placeholder="https://"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                {isZh ? "可上传至云存储后粘贴链接，或留空后续补充" : "Upload to cloud storage and paste the link, or leave blank to add later"}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                {isZh ? "入驻须知" : "Notes"}
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>{isZh ? "审核周期：3-5 个工作日" : "Review period: 3-5 business days"}</li>
                <li>{isZh ? "需要提供有效的律师事务所营业执照" : "Valid law firm business license required"}</li>
                <li>{isZh ? "入驻后可在平台接单，提供肖像权保护服务" : "After approval, you can receive orders on the platform"}</li>
                <li>{isZh ? "平台收取一定比例的服务费，详情见协议" : "Platform charges a percentage service fee, see agreement for details"}</li>
              </ul>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {isZh ? "提交中..." : "Submitting..."}
                </>
              ) : (
                isZh ? "提交入驻申请" : "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
