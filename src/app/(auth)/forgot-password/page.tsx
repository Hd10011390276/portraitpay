"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    // TODO: call /api/auth/forgot-password when implemented
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-purple-600">🎭 PortraitPay AI</Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">发送成功！</h2>
              <p className="text-gray-500 text-sm mb-6">
                如果该邮箱已注册，我们已发送密码重置链接到 <strong>{email}</strong>。请检查您的收件箱。
              </p>
              <Link href="/login" className="text-purple-600 text-sm font-medium hover:underline">
                返回登录
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">忘记密码？</h1>
              <p className="text-gray-500 text-sm mb-6">
                输入您的注册邮箱，我们会发送重置链接。
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱地址</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      发送中...
                    </>
                  ) : (
                    "发送重置链接"
                  )}
                </button>
                <div className="text-center">
                  <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition">
                    返回登录
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
