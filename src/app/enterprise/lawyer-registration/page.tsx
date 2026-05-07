"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

const COUNTRIES = [
  { code: "US", name: "🇺🇸 United States", available: true },
  { code: "GB", name: "🇬🇧 United Kingdom", available: true },
  { code: "CA", name: "🇨🇦 Canada", available: true },
  { code: "AU", name: "🇦🇺 Australia", available: true },
  { code: "JP", name: "🇯🇵 Japan", available: true },
  { code: "KR", name: "🇰🇷 South Korea", available: true },
  { code: "SG", name: "🇸🇬 Singapore", available: true },
  { code: "HK", name: "🇭🇰 Hong Kong", available: true },
  { code: "TW", name: "🇹🇼 Taiwan", available: true },
  { code: "DE", name: "🇩🇪 Germany", available: true },
  { code: "FR", name: "🇫🇷 France", available: true },
  { code: "IT", name: "🇮🇹 Italy", available: true },
  { code: "ES", name: "🇪🇸 Spain", available: true },
  { code: "NL", name: "🇳🇱 Netherlands", available: true },
  { code: "CH", name: "🇨🇭 Switzerland", available: true },
  { code: "SE", name: "🇸🇪 Sweden", available: true },
  { code: "NO", name: "🇳🇴 Norway", available: true },
  { code: "DK", name: "🇩🇰 Denmark", available: true },
  { code: "FI", name: "🇫🇮 Finland", available: true },
  { code: "NZ", name: "🇳🇿 New Zealand", available: true },
  { code: "AE", name: "🇦🇪 UAE", available: true },
  { code: "SA", name: "🇸🇦 Saudi Arabia", available: true },
  { code: "IN", name: "🇮🇳 India", available: true },
  { code: "BR", name: "🇧🇷 Brazil", available: true },
  { code: "MX", name: "🇲🇽 Mexico", available: true },
  { code: "OTHER", name: "🌍 Other (Contact us)", available: true },
];

export default function LawyerRegistrationPage() {
  const { t, locale } = useLanguage();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [form, setForm] = useState({
    lawyerType: "firm", // "firm" = 律师楼, "personal" = 个人律师
    companyName: "",
    country: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    licenseUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "dark" : "light");

    // Subscribe to theme changes from ThemeToggle
    const handleThemeChange = (e: Event) => {
      setTheme((e as CustomEvent<{ theme: "light" | "dark" }>).detail.theme);
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    const lr = t.lawyerRegistration || {};
    if (!form.companyName.trim()) errs.companyName = form.lawyerType === "personal" ? t.lawyerRegistration.companyNamePersonalRequired : t.lawyerRegistration.companyNameRequired;
    if (!form.country) errs.country = t.lawyerRegistration.countryRequired;
    const selected = COUNTRIES.find(c => c.code === form.country);
    if (selected && !selected.available) {
      errs.country = t.lawyerRegistration.countryNotAvailable;
    }
    if (!form.contactName.trim()) errs.contactName = t.lawyerRegistration.contactNameRequired;
    if (!form.contactEmail.trim()) errs.contactEmail = t.lawyerRegistration.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = t.lawyerRegistration.emailInvalid;
    if (!form.contactPhone.trim()) errs.contactPhone = t.lawyerRegistration.phoneRequired;
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
        setServerError(json.error || t.lawyerRegistration.submitError || "Submission failed, please try again");
      }
    } catch {
      setServerError(t.lawyerRegistration.networkError || "Network error, please check your connection");
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
      <>
        {/* ── Header ──────────────────────────────────────── */}
        <header className="nav-glass" style={{ position: "sticky", top: 0, zIndex: 100 }}>
          <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* ── Success Content ──────────────────────────────── */}
        <main style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - var(--header-height))", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div className="container" style={{ maxWidth: "560px", width: "100%" }}>
            <div className="card" style={{ textAlign: "center", padding: "48px 40px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏛️</div>
              <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "12px" }}>
                {t.lawyerRegistration.successTitle}
              </h2>
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "32px" }}>
                {t.lawyerRegistration.successDesc}
              </p>
              <Link href="/" className="btn btn-primary" style={{ padding: "12px 32px" }}>
                {t.lawyerRegistration.backToHome}
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="nav-glass" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - var(--header-height))", paddingBottom: "64px" }}>
        <div className="container" style={{ maxWidth: "640px" }}>

          {/* ── Hero Banner ────────────────────────────────── */}
          <div style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1a3a5c 100%)",
            padding: "48px 32px",
            borderRadius: "var(--radius-xl)",
            textAlign: "center",
            marginTop: "40px",
            marginBottom: "40px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏛️</div>
            <h1 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "white", letterSpacing: "-0.02em", marginBottom: "12px" }}>
              {t.lawyerRegistration.pageTitle}
            </h1>
            <p style={{ fontSize: "var(--text-body)", color: "rgba(255,255,255,0.75)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              {t.lawyerRegistration.pageSubtitle}
            </p>
          </div>

          {/* ── Form Card ──────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="card" style={{ padding: "40px" }}>

            {/* Lawyer Type Selector */}
            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
                {t.lawyerRegistration.registrationType}
                <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { value: "firm", labelZh: t.lawyerRegistration.lawFirm, labelEn: t.lawyerRegistration.lawFirm, icon: "🏛️", desc: t.lawyerRegistration.lawFirmDesc },
                  { value: "personal", labelZh: t.lawyerRegistration.personalLawyer, labelEn: t.lawyerRegistration.personalLawyer, icon: "⚖️", desc: t.lawyerRegistration.personalLawyerDesc },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, lawyerType: opt.value }))}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${form.lawyerType === opt.value ? "var(--accent-primary)" : "var(--border-default)"}`,
                      background: form.lawyerType === opt.value ? "var(--accent-light)" : "var(--surface)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 150ms ease-out",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "20px" }}>{opt.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-body)", color: "var(--text-primary)" }}>
                        {opt.labelZh}
                      </span>
                    </div>
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--text-secondary)", margin: 0 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {serverError && (
              <div style={{
                marginBottom: "24px",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--error-light)",
                border: "1px solid var(--error)",
                fontSize: "var(--text-body-sm)",
                color: "var(--error)",
              }}>
                ❌ {serverError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Company Name */}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {form.lawyerType === "personal" ? t.lawyerRegistration.companyNamePersonal : t.lawyerRegistration.companyName}
                  <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder={form.lawyerType === "personal" ? t.lawyerRegistration.companyNamePersonal : "e.g. Smith & Associates Law Firm"}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px",
                    background: "var(--surface)",
                    border: `1px solid ${errors.companyName ? "var(--error)" : "var(--border-default)"}`,
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-body)",
                    color: "var(--text-primary)",
                    transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "var(--shadow-focus)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.companyName ? "var(--error)" : "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {errors.companyName && (
                  <p style={{ marginTop: "6px", fontSize: "var(--text-caption)", color: "var(--error)" }}>{errors.companyName}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {t.lawyerRegistration.selectCountry}
                  <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                </label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px",
                    background: "var(--surface)",
                    border: `1px solid ${errors.country ? "var(--error)" : "var(--border-default)"}`,
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-body)",
                    color: "var(--text-primary)",
                    transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "var(--shadow-focus)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.country ? "var(--error)" : "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <option value="" style={{ color: "var(--text-tertiary)" }}>
                    {t.lawyerRegistration.selectCountry}
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} disabled={!c.available} style={{ color: "var(--text-primary)" }}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p style={{ marginTop: "6px", fontSize: "var(--text-caption)", color: "var(--error)" }}>{errors.country}</p>
                )}
              </div>

              {/* Contact Name */}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {t.lawyerRegistration.contactName}
                  <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  placeholder={t.lawyerRegistration.contactNameRequired}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px",
                    background: "var(--surface)",
                    border: `1px solid ${errors.contactName ? "var(--error)" : "var(--border-default)"}`,
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-body)",
                    color: "var(--text-primary)",
                    transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "var(--shadow-focus)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.contactName ? "var(--error)" : "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {errors.contactName && (
                  <p style={{ marginTop: "6px", fontSize: "var(--text-caption)", color: "var(--error)" }}>{errors.contactName}</p>
                )}
              </div>

              {/* Email & Phone Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                    {t.lawyerRegistration.email}
                    <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="lawfirm@example.com"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 16px",
                      background: "var(--surface)",
                      border: `1px solid ${errors.contactEmail ? "var(--error)" : "var(--border-default)"}`,
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--text-body)",
                      color: "var(--text-primary)",
                      transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
                      outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "var(--shadow-focus)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors.contactEmail ? "var(--error)" : "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {errors.contactEmail && (
                    <p style={{ marginTop: "6px", fontSize: "var(--text-caption)", color: "var(--error)" }}>{errors.contactEmail}</p>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                    {t.lawyerRegistration.phone}
                    <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="+1 555 123 4567"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 16px",
                      background: "var(--surface)",
                      border: `1px solid ${errors.contactPhone ? "var(--error)" : "var(--border-default)"}`,
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--text-body)",
                      color: "var(--text-primary)",
                      transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
                      outline: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "var(--shadow-focus)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors.contactPhone ? "var(--error)" : "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {errors.contactPhone && (
                    <p style={{ marginTop: "6px", fontSize: "var(--text-caption)", color: "var(--error)" }}>{errors.contactPhone}</p>
                  )}
                </div>
              </div>

              {/* License URL */}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {t.lawyerRegistration.licenseUrl}
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: "var(--text-caption)", marginLeft: "6px" }}>
                    ({t.lawyerRegistration.licenseUrlOptional})
                  </span>
                </label>
                <input
                  type="url"
                  value={form.licenseUrl}
                  onChange={(e) => set("licenseUrl", e.target.value)}
                  placeholder="https://"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px",
                    background: "var(--surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-body)",
                    color: "var(--text-primary)",
                    transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "var(--shadow-focus)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <p style={{ marginTop: "6px", fontSize: "var(--text-caption)", color: "var(--text-tertiary)" }}>
                  {t.lawyerRegistration.licenseUrlHint}
                </p>
              </div>

              {/* Info Box */}
              <div style={{
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                background: "var(--accent-light)",
                border: "1px solid var(--accent-primary)",
              }}>
                <h3 style={{ fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--accent-primary)", marginBottom: "10px" }}>
                  {t.lawyerRegistration.notes}
                </h3>
                <ul style={{ fontSize: "var(--text-body-sm)", color: "var(--text-secondary)", listStyle: "disc", listStylePosition: "inside", display: "flex", flexDirection: "column", gap: "6px", margin: 0, padding: 0 }}>
                  <li>{t.lawyerRegistration.note1}</li>
                  <li>{t.lawyerRegistration.note2}</li>
                  <li>{t.lawyerRegistration.note3}</li>
                  <li>{t.lawyerRegistration.note4}</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", height: "48px", fontSize: "var(--text-body)", marginTop: "8px" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    {t.lawyerRegistration.submitting}
                  </span>
                ) : (
                  t.lawyerRegistration.submit
                )}
              </button>

            </div>
          </form>

        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
