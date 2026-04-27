"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/auth/Input";
import { Button } from "@/components/auth/Button";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { UsagePreferences } from "@/components/auth/UsagePreferences";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    role: "",
  });
  const [allowLicensing, setAllowLicensing] = useState(true);
  const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
  const [prohibitedContent, setProhibitedContent] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setGlobalError("");
  };

  const formRef = useRef(form);
  formRef.current = form;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const currentForm = formRef.current;

    if (!currentForm.name.trim()) errs.name = t.register.errors.nameRequired;
    if (!currentForm.email) errs.email = t.register.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.email)) errs.email = t.register.errors.invalidEmail;
    if (!currentForm.password) errs.password = t.register.errors.passwordRequired;
    else if (currentForm.password.length < 8) errs.password = t.register.errors.passwordTooShort;
    else {
      if (!/[A-Z]/.test(currentForm.password)) errs.password = t.register.errors.passwordNeedUppercase;
      else if (!/[0-9]/.test(currentForm.password)) errs.password = t.register.errors.passwordNeedNumber;
    }
    if (!currentForm.confirmPassword) errs.confirmPassword = t.register.errors.confirmPasswordRequired;
    else if (currentForm.password !== currentForm.confirmPassword) errs.confirmPassword = t.register.errors.passwordsMismatch;
    if (!currentForm.role) errs.role = t.register.errors.selectRole;

    // Always clear all errors first, then set only the new ones
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          name: form.name,
          phone: form.phone || undefined,
          role: form.role,
          allowLicensing,
          allowedScopes,
          prohibitedContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors((prev) => ({ ...prev, ...data.errors }));
        } else {
          setGlobalError(data.message || t.register.errors.registrationFailed);
        }
        return;
      }

      if (data.data?.accessToken) {
        localStorage.setItem("pp_access_token", data.data.accessToken);
        localStorage.setItem("pp_refresh_token", data.data.refreshToken);
        localStorage.setItem("pp_user", JSON.stringify(data.data.user));
      }

      router.push("/dashboard");
    } catch {
      setGlobalError(t.register.errors.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-6 sm:py-12">
      {/* Top bar with theme and language toggles - mobile optimized */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 sm:gap-3 z-50">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="w-full max-w-lg space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center px-2">
          <Link href="/" className="inline-block">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 hover:opacity-80 transition-opacity">
              PortraitPay AI
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t.register.createAccount}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.register.joinPortraitPay}
          </p>
        </div>

        {/* card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4 sm:space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {globalError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
                {globalError}
              </div>
            )}

            <Input
              label={t.register.name}
              type="text"
              placeholder={t.register.enterRealName}
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              autoComplete="name"
            />

            <Input
              label={t.register.email}
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              autoComplete="email"
            />

            <Input
              label={t.register.phoneOptional}
              type="tel"
              placeholder={t.register.phoneCanAddLater}
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              autoComplete="tel"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label={t.register.password}
                type="password"
                placeholder={t.register.passwordPlaceholder}
                value={form.password}
                onChange={set("password")}
                error={errors.password}
                autoComplete="new-password"
              />
              <Input
                label={t.register.confirmPassword}
                type="password"
                placeholder={t.register.reEnterPassword}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <RoleSelector
              value={form.role}
              onChange={(val) => { setForm((prev) => ({ ...prev, role: val })); setErrors((prev) => ({ ...prev, role: "" })); }}
              error={errors.role}
            />

            <UsagePreferences
              allowLicensing={allowLicensing}
              allowedScopes={allowedScopes}
              prohibitedContent={prohibitedContent}
              onAllowLicensingChange={setAllowLicensing}
              onAllowedScopesChange={setAllowedScopes}
              onProhibitedContentChange={setProhibitedContent}
            />

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {t.register.register}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            {t.register.agreeToTerms}{" "}
            <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t.register.terms}
            </a>{" "}
            {t.register.and}{" "}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t.register.privacy}
            </a>
          </p>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
          {t.register.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {t.register.signInNow}
          </Link>
        </p>
      </div>
    </div>
  );
}
