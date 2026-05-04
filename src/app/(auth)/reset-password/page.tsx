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
  const { locale, t } = useLanguage();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const isZh = locale === "zh-CN" || locale === "zh-Hant";

  function validateForm() {
    let valid = true;
    setPasswordError("");
    setConfirmError("");

    if (!password) {
      setPasswordError(isZh ? "请输入新密码" : "Please enter a new password");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError(isZh ? "密码至少8位" : "Password must be at least 8 characters");
      valid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError(isZh ? "密码需包含至少一个大写字母" : "Password must contain at least one uppercase letter");
      valid = false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError(isZh ? "密码需包含至少一个数字" : "Password must contain at least one number");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError(isZh ? "请确认密码" : "Please confirm your password");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError(isZh ? "两次密码不一致" : "Passwords do not match");
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    if (!token) {
      setError(isZh ? "重置链接无效或已过期" : "Reset link is invalid or expired");
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
        setError(json.error ?? (isZh ? "重置失败，请稍后重试" : "Reset failed, please try again"));
        return;
      }
      setSuccess(true);
    } catch {
      setError(isZh ? "网络错误，请检查网络连接" : "Network error, please check your connection");
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
              {isZh ? "重置链接无效" : "Invalid Reset Link"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {isZh ? "重置密码链接无效或已过期，请重新申请" : "The reset link is invalid or expired. Please request a new one."}
            </p>
            <Link href="/forgot-password" className="text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">
              {isZh ? "重新申请重置密码" : "Request a new password reset"}
            </Link>
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                ← {isZh ? "返回登录" : "Back to login"}
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
              {isZh ? "密码重置成功！" : "Password Reset Successful!"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {isZh ? "你的密码已成功更新，请使用新密码登录" : "Your password has been updated. Please login with your new password."}
            </p>
            <Link href="/login" className="inline-block w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors">
              {isZh ? "前往登录" : "Go to Login"}
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
              <h1 className="text-2xl font-bold text-white">{isZh ? "设置新密码" : "Set New Password"}</h1>
              <p className="text-purple-200 text-sm mt-1">
                {isZh ? "请输入你的新密码" : "Please enter your new password"}
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
                  {isZh ? "新密码" : "New Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                  placeholder={isZh ? "输入新密码" : "Enter new password"}
                  autoComplete="new-password"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    passwordError
                      ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  }`}
                />
                {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {isZh ? "至少8位，包含大写字母和数字" : "At least 8 characters, with uppercase letter and number"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {isZh ? "确认新密码" : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
                  placeholder={isZh ? "再次输入新密码" : "Re-enter new password"}
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
                    {isZh ? "重置中..." : "Resetting..."}
                  </>
                ) : (
                  isZh ? "确认重置密码" : "Confirm Password Reset"
                )}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  ← {isZh ? "返回登录" : "Back to login"}
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
