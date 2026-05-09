"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();

  const tc = t.forgotPassword || {};

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || tc.sendFailed);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error("[ForgotPassword] Error:", error);
      alert(tc.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Header */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <img src="/logo.png" alt="PortraitPay AI" className="h-10 w-10 rounded-lg" />
            <span className="text-2xl font-bold text-purple-600">PortraitPay AI</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {tc.successTitle}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {tc.successDesc}
              </p>
              <Link href="/login" className="text-purple-600 text-sm font-medium hover:underline">
                {tc.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {tc.pageTitle}
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {tc.pageSubtitle}
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {tc.emailLabel}
                  </label>
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
                      {tc.sending}
                    </>
                  ) : (
                    tc.sendButton
                  )}
                </button>
                <div className="text-center">
                  <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition">
                    {tc.backToLogin}
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