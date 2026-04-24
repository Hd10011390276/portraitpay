"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

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
    if (!form.companyName.trim()) errs.companyName = "请填写公司名称";
    if (!form.country) errs.country = "请选择国家/地区";
    const selected = COUNTRIES.find(c => c.code === form.country);
    if (selected && !selected.available) {
      errs.country = "该地区尚未开放，请选择其他地区";
    }
    if (!form.contactName.trim()) errs.contactName = "请填写联系人姓名";
    if (!form.contactEmail.trim()) errs.contactEmail = "请填写邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = "邮箱格式不正确";
    if (!form.contactPhone.trim()) errs.contactPhone = "请填写联系电话";
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
        setServerError(json.error || "提交失败，请重试");
      }
    } catch {
      setServerError("网络错误，请检查连接后重试");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">申请已提交！</h2>
          <p className="text-gray-600 mb-6">
            感谢您的入驻申请。我们的审核团队会在 <strong>3-5 个工作日</strong>内完成审核，并通过邮件通知您结果。
          </p>
          <a href="/" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - always white */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">PortraitPay</Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Header Card - blue gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🏛️</span>
            <div>
              <h1 className="text-2xl font-bold">律师楼入驻申请</h1>
              <p className="text-blue-100 text-sm mt-1">Join PortraitPay as a Verified Law Firm</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm">
            入驻后，您的律所将作为平台授权的肖像权保护机构，为用户提供法律咨询、维权代理等服务。所有用户授权通过平台统一管理，避免私下交易。
          </p>
        </div>

        {/* Form - always white bg */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ❌ {serverError}
            </div>
          )}

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                律所/公司名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="例如：Smith & Associates Law Firm"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? "border-red-500" : "border-gray-200"}`}
              />
              {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                国家/地区 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country ? "border-red-500" : "border-gray-200"}`}
              >
                <option value="">请选择国家/地区</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                联系人姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="请输入联系人姓名"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactName ? "border-red-500" : "border-gray-200"}`}
              />
              {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  placeholder="lawfirm@example.com"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactEmail ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  placeholder="+1 555 123 4567"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPhone ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
              </div>
            </div>

            {/* License URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                资质证明链接 <span className="text-gray-400 text-xs">(选填)</span>
              </label>
              <input
                type="url"
                value={form.licenseUrl}
                onChange={(e) => set("licenseUrl", e.target.value)}
                placeholder="https:// 营业执照或资质证明的链接"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">可上传至云存储后粘贴链接，或留空后续补充</p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">入驻须知</h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>审核周期：3-5 个工作日</li>
                <li>需要提供有效的律师事务所营业执照</li>
                <li>入驻后可在平台接单，提供肖像权保护服务</li>
                <li>平台收取一定比例的服务费，详情见协议</li>
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
                  提交中...
                </>
              ) : (
                "提交入驻申请"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
