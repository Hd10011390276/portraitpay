"use client";

import { useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

const REGIONS = [
  "华北地区（北京、天津、河北、山西、内蒙古）",
  "东北地区（辽宁、吉林、黑龙江）",
  "华东地区（上海、江苏、浙江、安徽、福建、江西、山东）",
  "华中地区（河南、湖北、湖南）",
  "华南地区（广东、广西、海南）",
  "西南地区（重庆、四川、贵州、云南、西藏）",
  "西北地区（陕西、甘肃、青海、宁夏、新疆）",
  "港澳台地区",
  "海外地区",
];

export default function LawyerRegistrationPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    companyName: "",
    region: "",
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
    if (!form.region) errs.region = "请选择地区";
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">申请已提交！</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            感谢您的入驻申请。我们的审核团队会在 <strong>3-5 个工作日</strong>内完成审核，并通过邮件通知您结果。
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            如需紧急处理，请联系平台客服。
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardShell
        title="律师楼入驻"
        subtitle="欢迎加入 PortraitPay 平台，为全球用户提供专业的肖像权保护服务"
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🏛️</span>
              <div>
                <h1 className="text-2xl font-bold">律师楼入驻申请</h1>
                <p className="text-blue-100 text-sm mt-1">Join PortraitPay as a Verified Law Firm</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm">
              入驻后，您的律所将作为平台授权的肖像权保护机构，为用户提供法律咨询、维权代理等服务。
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                ❌ {serverError}
              </div>
            )}

            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  律所/公司名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="例如：北京君合律师事务所"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyName ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  所属地区 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.region ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <option value="">请选择地区</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {errors.region && <p className="mt-1 text-xs text-red-500">{errors.region}</p>}
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  联系人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  placeholder="请输入联系人姓名"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contactName ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="lawfirm@example.com"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contactEmail ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="+86 10 1234 5678"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contactPhone ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {errors.contactPhone && <p className="mt-1 text-xs text-red-500">{errors.contactPhone}</p>}
                </div>
              </div>

              {/* License URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  资质证明链接 <span className="text-gray-400 text-xs">(选填)</span>
                </label>
                <input
                  type="url"
                  value={form.licenseUrl}
                  onChange={(e) => set("licenseUrl", e.target.value)}
                  placeholder="https:// 营业执照或资质证明的链接"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">可上传至云存储后粘贴链接，或留空后续补充</p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">入驻须知</h3>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
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
        </div>
      </DashboardShell>
    </div>
  );
}
