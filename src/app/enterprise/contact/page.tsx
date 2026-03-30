/**
 * /enterprise/contact — 企业入驻咨询页面
 */
"use client";

import { useState } from "react";
import Link from "next/link";

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

const SCALE_OPTIONS = [
  "1-10人",
  "11-50人",
  "51-200人",
  "201-1000人",
  "1000人以上",
];

const USE_CASES = [
  { value: "marketing", label: "品牌营销与广告" },
  { value: "product", label: "产品包装与设计" },
  { value: "content", label: "内容创作与媒体" },
  { value: "ecommerce", label: "电商与零售" },
  { value: "education", label: "教育培训" },
  { value: "ai_training", label: "AI 模型训练" },
  { value: "other", label: "其他" },
];

export default function EnterpriseContactPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    contactPhone: "",
    company: "",
    enterpriseName: "",
    intendedUse: "",
    expectedScale: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "请填写联系人姓名";
    if (!form.email.trim()) e.email = "请填写邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "邮箱格式不正确";
    if (!form.enterpriseName.trim()) e.enterpriseName = "请填写企业名称";
    if (!form.intendedUse.trim()) e.intendedUse = "请填写用途说明";
    else if (form.intendedUse.trim().length < 10) e.intendedUse = "请详细描述用途（至少10个字符）";
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
        setServerError(json.error ?? "提交失败，请稍后重试");
      }
    } catch {
      setServerError("网络错误，请检查网络连接");
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
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">咨询已提交！</h2>
          <p className="text-gray-500 mb-6">
            感谢您的企业入驻咨询，我们的商务团队会在 <strong>1-2 个工作日</strong>内与您联系，确认合作细节。
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="block w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition">
              返回首页
            </Link>
            <Link href="/contact" className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
              普通联系表单
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
          <Link href="/" className="text-xl font-bold text-purple-600">
            🎭 PortraitPay
          </Link>
          <div className="flex gap-4">
            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700 transition">
              普通联系
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
              ← 返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 mb-10 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🏢</div>
            <div>
              <h1 className="text-2xl font-bold mb-1">企业批量授权咨询</h1>
              <p className="text-purple-100 text-sm leading-relaxed">
                为您的企业获取官方授权，批量使用肖像数据进行营销、内容创作、AI训练等商业用途。
                我们的授权团队将根据您的需求提供定制化方案。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: "⚡", label: "快速响应", sub: "1-2个工作日联系" },
              { icon: "📋", label: "批量授权", sub: "支持大规模商业使用" },
              { icon: "🛡️", label: "合规保障", sub: "完整法律授权文件" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-xs text-purple-200">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">填写咨询表单</h2>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Contact row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      联系人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="张三"
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      工作邮箱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="business@company.com"
                      className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      联系电话 <span className="text-gray-400 font-normal">(可选)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value)}
                      placeholder="+86 138-0000-0000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      部门 / 公司 <span className="text-gray-400 font-normal">(可选)</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      placeholder="市场部 / XX公司"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Enterprise name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    企业名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.enterpriseName}
                    onChange={(e) => update("enterpriseName", e.target.value)}
                    placeholder="请填写公司全称"
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.enterpriseName ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.enterpriseName && <p className="mt-1 text-xs text-red-500">{errors.enterpriseName}</p>}
                </div>

                {/* Use case */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    用途说明 <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {USE_CASES.map((uc) => (
                      <button
                        key={uc.value}
                        type="button"
                        onClick={() => update("intendedUse", uc.label)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          form.intendedUse === uc.label
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {uc.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.intendedUse}
                    onChange={(e) => update("intendedUse", e.target.value)}
                    placeholder="详细描述您的使用场景，例如：计划用于品牌营销活动，预计覆盖1000万用户..."
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      errors.intendedUse ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.intendedUse && <p className="mt-1 text-xs text-red-500">{errors.intendedUse}</p>}
                </div>

                {/* Scale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    预期规模 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("expectedScale", opt)}
                        className={`px-4 py-2 rounded-lg text-sm border transition ${
                          form.expectedScale === opt
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    补充说明 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="任何其他需求或问题..."
                    rows={3}
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
                      提交中...
                    </>
                  ) : (
                    "提交企业入驻咨询"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* What you get */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">企业授权包含</h3>
              <ul className="space-y-3">
                {[
                  { icon: "📜", text: "区块链存证授权协议" },
                  { icon: "🏷️", text: "批量肖像数据使用许可" },
                  { icon: "📋", text: "完整合规资质文件" },
                  { icon: "🔄", text: "灵活的授权范围定制" },
                  { icon: "📊", text: "使用数据统计面板" },
                  { icon: "⚖️", text: "法律顾问支持" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Case studies */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">合作案例</h3>
              <div className="space-y-4">
                {[
                  { brand: "某头部电商平台", case: "品牌联名营销，覆盖用户 5000万+", badge: "电商" },
                  { brand: "知名影视公司", case: "艺人肖像授权用于衍生品开发", badge: "影视" },
                  { brand: "头部 AI 创业公司", case: "授权用于模型训练数据集", badge: "AI" },
                ].map((c) => (
                  <div key={c.brand} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{c.brand}</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{c.badge}</span>
                    </div>
                    <p className="text-xs text-gray-500">{c.case}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
              <p className="text-sm text-indigo-800 font-medium mb-2">需要紧急联系？</p>
              <p className="text-xs text-indigo-600 mb-3">
                如需快速沟通，可直接发送邮件至
              </p>
              <a href="mailto:enterprise@portraitpayai.com" className="text-sm text-purple-600 font-medium hover:underline break-all">
                enterprise@portraitpayai.com
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
