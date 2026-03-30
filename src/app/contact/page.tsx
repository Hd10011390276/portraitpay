/**
 * /contact — 联系表单页面
 */
"use client";

import { useState } from "react";
import Link from "next/link";

interface FormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

interface FieldError {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "请填写姓名";
    if (!form.email.trim()) e.email = "请填写邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "邮箱格式不正确";
    if (!form.message.trim()) e.message = "请填写留言内容";
    else if (form.message.trim().length < 10) e.message = "留言至少10个字符";
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
        body: JSON.stringify({ ...form, type: "GENERAL" }),
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
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功！</h2>
          <p className="text-gray-500 mb-6">
            感谢您的留言，我们的团队会在 <strong>1-3 个工作日</strong>内与您联系。
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="block w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
            >
              返回首页
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setForm({ name: "", email: "", company: "", subject: "", message: "" });
              }}
              className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              继续留言
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-purple-600">
            🎭 PortraitPay
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition">
            ← 返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">联系我们</h1>
          <p className="text-gray-500">
            有任何问题或建议？欢迎填写表单，我们的团队会在 1-3 个工作日内与您联系。
          </p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/enterprise/contact"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
            >
              🏢 企业入驻咨询 →
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="您的姓名"
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.email ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                公司 / 组织 <span className="text-gray-400 font-normal">(可选)</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="您所属的公司或组织"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                主题 <span className="text-gray-400 font-normal">(可选)</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="简要描述您的问题"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                留言内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="请详细描述您的问题或建议..."
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                  errors.message ? "border-red-400 bg-red-50" : "border-gray-200"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.message ? (
                  <p className="text-xs text-red-500">{errors.message}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">{form.message.length}/5000</span>
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* Submit */}
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
                "提交留言"
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              提交即表示您同意我们的{" "}
              <a href="/privacy" className="text-purple-600 hover:underline">隐私政策</a>
            </p>
          </form>
        </div>

        {/* FAQ / alternative contact */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "📧", title: "邮件联系", desc: "hi@portraitpayai.com" },
            { icon: "💬", title: "微信客服", desc: "PortraitPay_AI" },
            { icon: "📖", title: "帮助中心", desc: "常见问题解答" },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-5 border border-gray-100 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
