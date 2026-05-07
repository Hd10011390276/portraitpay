"use client";
/**
 * /reset-password — Reset password page (after clicking reset link)
 * Receives token from URL ?token=xxx
 */
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const token = searchParams.get("token") ?? "";

  const tc = t.resetPassword || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  function validateForm() {
    let valid = true;
    setPasswordError("");
    setConfirmError("");

    if (!password) {
      setPasswordError(tc.passwordRequired);
      valid = false;
    } else if (password.length < 8) {
      setPasswordError(tc.passwordMinLength);
      valid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError(tc.passwordUppercase);
      valid = false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError(tc.passwordNumber);
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError(tc.confirmRequired);
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError(tc.confirmMismatch);
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    if (!token) {
      setError(tc.invalidToken);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? tc.resetFailed);
        return;
      }
      setSuccess(true);
    } catch {
      setError(tc.networkError);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tc.invalidToken}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {tc.invalidTokenDesc}
            </p>
            <Link href="/forgot-password" className="text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">
              {tc.requestNewReset}
            </Link>
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                ← {tc.backToLogin}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tc.resetSuccess}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {tc.resetSuccessDesc}
            </p>
            <Link href="/login" className="inline-block w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
              {tc.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="PortraitPay AI" className="h-8 w-8 rounded-lg" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">PortraitPay AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
              <h1 className="text-2xl font-bold text-white">{tc.pageTitle}</h1>
              <p className="text-purple-200 text-sm mt-1">
                {tc.pageSubtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {tc.newPasswordLabel}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                  placeholder={tc.newPasswordPlaceholder}
                  autoComplete="new-password"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    passwordError
                      ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  }`}
                />
                {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {tc.passwordHint}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {tc.confirmPasswordLabel}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
                  placeholder={tc.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    confirmError
                      ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  }`}
                />
                {confirmError && <p className="mt-1 text-xs text-red-500">{confirmError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {tc.resetting}
                  </>
                ) : (
                  tc.confirmButton
                )}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ← {tc.backToLogin}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
