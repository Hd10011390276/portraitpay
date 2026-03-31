/**
 * /celebrity — 艺人入驻申请页面
 */
"use client";

import { useState } from "react";
import Link from "next/link";

interface FormData {
  name: string;
  email: string;
  contactPhone: string;
  // 艺名 / stage name
  stageName: string;
  // 艺人类型: 明星 | 演员 | 歌手 | 网红 | 运动员 | 艺术家 | 其他
  category: string;
  // 社交媒体
  socialMedia: string;
  // 所属机构
  agency: string;
  message: string;
}

interface FieldError {
  name?: string;
  email?: string;
  stageName?: string;
  category?: string;
}

const CATEGORY_OPTIONS = [
  { value: "明星", label: "明星", icon: "⭐" },
  { value: "演员", label: "演员", icon: "🎬" },
  { value: "歌手", label: "歌手", icon: "🎤" },
  { value: "网红", label: "网红/KOL", icon: "📱" },
  { value: "运动员", label: "运动员", icon: "🏆" },
  { value: "艺术家", label: "艺术家", icon: "🎨" },
  { value: "其他", label: "其他", icon: "🌟" },
];

export default function CelebrityPage() {
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
    if (!form.name.trim()) e.name = "请填写真实姓名";
    if (!form.email.trim()) e.email = "请填写邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "邮箱格式不正确";
    if (!form.stageName.trim()) e.stageName = "请填写艺名/舞台名";
    if (!form.category) e.category = "请选择艺人类型";
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
        body: JSON.stringify({
          type: "CELEBRITY",
          name: form.name,
          email: form.email,
          contactPhone: form.contactPhone,
          subject: form.stageName,
          enterpriseName: form.category,
          intendedUse: form.socialMedia,
          company: form.agency,
          message: form.message,
        }),
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
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">申请已提交！</h2>
          <p className="text-gray-500 mb-6">
            感谢您的入驻申请，我们的艺人经纪团队会在 <strong>1-3 个工作日</strong>内与您联系，确认合作细节。
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="block w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
            >
              返回首页
            </Link>
            <Link
              href="/contact"
              className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              其他咨询
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
            <Link href="/enterprise/contact" className="text-sm text-gray-500 hover:text-gray-700 transition">
              企业入驻
            </Link>
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
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 mb-10 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🌟</div>
            <div>
              <h1 className="text-2xl font-bold mb-1">艺人肖像权入驻申请</h1>
              <p className="text-purple-100 text-sm leading-relaxed">
                无论是顶流明星、演员、歌手、网红还是新锐艺术家，PortraitPay 为您提供区块链存证的
                肖像权保护与商业化授权服务。让您的形象价值安全可控地被合法使用。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: "🔐", label: "肖像权保护", sub: "区块链存证，永久溯源" },
              { icon: "💰", label: "商业化变现", sub: "授权收益透明分账" },
              { icon: "🤝", label: "合规授权", sub: "智能合约保障权益" },
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
              <h2 className="text-lg font-bold text-gray-900 mb-6">填写入驻申请</h2>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      真实姓名 <span className="text-red-500">*</span>
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

                {/* Stage name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    艺名 / 舞台名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.stageName}
                    onChange={(e) => update("stageName", e.target.value)}
                    placeholder="请填写您的艺名或广为人知的名字"
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.stageName ? "border-red-400 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {errors.stageName && <p className="mt-1 text-xs text-red-500">{errors.stageName}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    艺人类型 <span className="text-red-500">*</span>
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
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>

                {/* Social media */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    社交媒体主页 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={form.socialMedia}
                    onChange={(e) => update("socialMedia", e.target.value)}
                    placeholder="微博 @xxx / 抖音 @xxx / 小红书 @xxx 等"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">提供社交媒体主页有助于加快审核</p>
                </div>

                {/* Agency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    所属经纪公司 / 工作室 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={form.agency}
                    onChange={(e) => update("agency", e.target.value)}
                    placeholder="如：XX娱乐、XX工作室、独立艺人"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    补充说明 <span className="text-gray-400 font-normal">(可选)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="介绍一下您的代表作品、粉丝量级、合作期望等..."
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
                      提交中...
                    </>
                  ) : (
                    "提交艺人入驻申请"
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  提交即表示您同意我们的{" "}
                  <a href="/privacy" className="text-purple-600 hover:underline">隐私政策</a>
                </p>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* What you get */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">艺人入驻权益</h3>
              <ul className="space-y-3">
                {[
                  { icon: "🔐", text: "区块链肖像权存证" },
                  { icon: "💰", text: "授权收益透明分账" },
                  { icon: "🛡️", text: "侵权监测与自动维权" },
                  { icon: "📊", text: "授权数据实时面板" },
                  { icon: "📜", text: "官方授权协议文件" },
                  { icon: "🤝", text: "企业授权对接服务" },
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
              <h3 className="font-bold text-gray-900 mb-4">入驻流程</h3>
              <ol className="space-y-3">
                {[
                  { step: "1", text: "提交入驻申请表单" },
                  { step: "2", text: "经纪团队 1-3 个工作日联系" },
                  { step: "3", text: "提交身份认证材料" },
                  { step: "4", text: "完成 KYC 实名认证" },
                  { step: "5", text: "签署授权协议，正式入驻" },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                    <span className="pt-0.5">{item.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA */}
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
              <p className="text-sm text-purple-800 font-medium mb-2">已经是入驻艺人？</p>
              <p className="text-xs text-purple-600 mb-3">
                登录管理后台，管理您的肖像权和授权业务
              </p>
              <Link
                href="/login"
                className="block w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium text-center hover:bg-purple-700 transition"
              >
                艺人登录 →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
