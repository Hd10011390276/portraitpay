"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/auth/Input";
import { Button } from "@/components/auth/Button";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

type Tab = "email" | "phone";
type LoginAs = "user" | "lawyer" | "agency";

export default function LoginPage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [tab] = useState<Tab>("email"); // phone login disabled — email only
  const [loginAs, setLoginAs] = useState<LoginAs>("user");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const isZh = false;

  const validateEmailForm = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = t.login.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.login.errors.invalidEmail;
    if (!password) errs.password = t.login.errors.passwordRequired;
    setEmailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePhoneForm = () => {
    const errs: Record<string, string> = {};
    if (!/^1[3-9]\d{9}$/.test(phone)) errs.phone = t.login.errors.invalidPhone;
    if (!otpSent) errs.phone = t.login.errors.sendOtpFirst;
    if (!code || !/^\d{6}$/.test(code)) errs.code = t.login.errors.invalidCode;
    setPhoneErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async () => {
    const errs: Record<string, string> = {};
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      errs.phone = t.login.errors.invalidPhone;
      setPhoneErrors(errs);
      return;
    }

    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.message || t.login.errors.sendFailed);
        return;
      }
      setOtpSent(true);
      setOtpSentTo(phone);
      setOtpCode(data.data?.code || "");
      setOtpCountdown(60);
      const timer = setInterval(() => {
        setOtpCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setGlobalError(t.login.errors.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    if (tab === "email") {
      if (!validateEmailForm()) return;
    } else {
      if (!validatePhoneForm()) return;
    }

    setLoading(true);
    try {
      const endpoint = tab === "email" ? "/api/auth/login" : "/api/auth/otp/verify";
      const body =
        tab === "email"
          ? { email, password, loginAs }
          : { phone, code, loginAs };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.message || t.login.errors.loginFailed);
        return;
      }

      if (data.data?.accessToken) {
        localStorage.setItem("pp_access_token", data.data.accessToken);
        localStorage.setItem("pp_refresh_token", data.data.refreshToken);
        localStorage.setItem("pp_user", JSON.stringify(data.data.user));
        localStorage.removeItem("pp_effective_role");
      }

      // Redirect based on loginAs tab selection
      const destination = data.data.redirectTo;
      if (destination) {
        router.push(destination);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setGlobalError(t.login.errors.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-8 sm:py-12">
      {/* Top bar with theme and language toggles - mobile optimized */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo / Header */}
        <div className="text-center px-2">
          <Link href="/" className="inline-block">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 hover:opacity-80 transition-opacity">
              PortraitPay AI
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t.login.welcomeBack}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.login.signInToContinue}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { key: "email", label: t.login.emailLogin },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => { setGlobalError(""); setEmailErrors({}); setPhoneErrors({}); }}
                className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors
                  ${tab === t.key
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* User Type Selector */}
          <div className="px-4 sm:px-6 pt-4">
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginAs("user")}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  loginAs === "user"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                }`}
              >
                👤 {t.login.userLabel}
              </button>
              <button
                type="button"
                onClick={() => setLoginAs("lawyer")}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  loginAs === "lawyer"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                }`}
              >
                ⚖️ {t.login.lawyerLabel}
              </button>
              <button
                type="button"
                onClick={() => setLoginAs("agency")}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  loginAs === "agency"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                }`}
              >
                🏢 {t.login.agencyLabel ?? "Agency"}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {globalError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
                {globalError}
              </div>
            )}

            {/* ── Email Login ─────────────────────────── */}
            {tab === "email" && (
              <>
                <Input
                  label={t.login.email}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailErrors((prev) => ({ ...prev, email: "" })); }}
                  error={emailErrors.email}
                  autoComplete="email"
                />
                <Input
                  label={t.login.password}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setEmailErrors((prev) => ({ ...prev, password: "" })); }}
                  error={emailErrors.password}
                  autoComplete="current-password"
                />
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    {t.login.forgotPassword}
                  </Link>
                </div>
              </>
            )}

            {/* ── Phone Login ─────────────────────────── */}
            {tab === "phone" && (
              <>
                <Input
                  label={t.login.phone}
                  type="tel"
                  placeholder={t.login.enterChineseMobile}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneErrors((prev) => ({ ...prev, phone: "" })); setOtpSent(false); }}
                  error={phoneErrors.phone}
                  autoComplete="tel"
                />

                {otpSent && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400">
                      ✅ {t.login.verificationCodeSent} <strong>{otpSentTo}</strong>
                      {process.env.NODE_ENV === "development" && otpCode && (
                        <span className="ml-2 font-mono bg-green-200 dark:bg-green-800 px-1 rounded">
                          {otpCode}
                        </span>
                      )}
                    </div>
                    <Input
                      label={t.login.verificationCode}
                      type="text"
                      placeholder={t.login.enter6DigitCode}
                      maxLength={6}
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setPhoneErrors((prev) => ({ ...prev, code: "" })); }}
                      error={phoneErrors.code}
                      inputMode="numeric"
                    />
                  </>
                )}

                <div className="flex gap-3">
                  {otpSent ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={otpCountdown > 0}
                      onClick={handleSendOtp}
                    >
                      {otpCountdown > 0 ? `${otpCountdown}s ${t.login.resendIn}` : t.login.resend}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="flex-1"
                      onClick={handleSendOtp}
                      loading={loading}
                    >
                      {t.login.sendCode}
                    </Button>
                  )}
                </div>
              </>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {t.login.signIn}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
          {t.login.noAccount}{" "}
          <Link href="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {t.login.registerNow}
          </Link>
        </p>
      </div>
    </div>
  );
}
