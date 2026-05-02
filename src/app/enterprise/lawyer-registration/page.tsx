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
  const isZh = locale === "zh-CN";

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
    if (!form.companyName.trim()) errs.companyName = isZh ? "请填写" + (form.lawyerType === "personal" ? "个人姓名" : "律所/公司名称") : (form.lawyerType === "personal" ? "Please enter your name" : "Please enter company name");
    if (!form.country) errs.country = isZh ? "请选择国家/地区" : "Please select a country/region";
    const selected = COUNTRIES.find(c => c.code === form.country);
    if (selected && !selected.available) {
      errs.country = isZh ? "该地区尚未开放，请选择其他地区" : "This region is not yet available. Please select another.";
    }
    if (!form.contactName.trim()) errs.contactName = isZh ? "请填写联系人姓名" : "Please enter contact name";
    if (!form.contactEmail.trim()) errs.contactEmail = isZh ? "请填写邮箱" : "Please enter email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = isZh ? "邮箱格式不正确" : "Invalid email format";
    if (!form.contactPhone.trim()) errs.contactPhone = isZh ? "请填写联系电话" : "Please enter phone number";
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
        setServerError(json.error || (isZh ? "提交失败，请重试" : "Submission failed, please try again"));
      }
    } catch {
      setServerError(isZh ? "网络错误，请检查连接后重试" : "Network error, please check your connection");
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
                {isZh ? "申请已提交！" : "Application Submitted!"}
              </h2>
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "32px" }}>
                {isZh
                  ? "感谢您的入驻申请。我们的审核团队会在 3-5 个工作日内完成审核，并通过邮件通知您结果。"
                  : "Thank you for your application. Our review team will complete the review within 3-5 business days and notify you via email."}
              </p>
              <Link href="/" className="btn btn-primary" style={{ padding: "12px 32px" }}>
                {isZh ? "返回首页" : "Back to Home"}
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
              {isZh ? "律师入驻申请" : "Lawyer Registration"}
            </h1>
            <p style={{ fontSize: "var(--text-body)", color: "rgba(255,255,255,0.75)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.65 }}>
              {isZh
                ? "选择\"入驻律师\"后，您的律所或个人将作为平台授权的肖像权保护机构，为用户提供法律咨询、维权代理等服务。所有用户授权通过平台统一管理，避免私下交易。"
                : "After joining, your firm or practice will act as a platform-authorized portrait rights protection agency, providing users with legal consulting, rights protection, and infringement handling services."}
            </p>
          </div>

          {/* ── Form Card ──────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="card" style={{ padding: "40px" }}>

            {/* Lawyer Type Selector */}
            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
                {isZh ? "入驻类型" : "Registration Type"}
                <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { value: "firm", labelZh: "律师楼", labelEn: "Law Firm", icon: "🏛️", desc: isZh ? "律师事务所、公司化运营" : "Law firm, incorporated" },
                  { value: "personal", labelZh: "个人律师", labelEn: "Personal Lawyer", icon: "⚖️", desc: isZh ? "独立执业律师" : "Solo practitioner" },
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
                        {isZh ? opt.labelZh : opt.labelEn}
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
                  {form.lawyerType === "personal" ? (isZh ? "个人姓名" : "Your Name") : (isZh ? "律所/公司名称" : "Law Firm / Company Name")}
                  <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder={form.lawyerType === "personal" ? (isZh ? "请输入您的姓名" : "Enter your full name") : (isZh ? "例如：Smith & Associates Law Firm" : "e.g. Smith & Associates Law Firm")}
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
                  {isZh ? "国家/地区" : "Country / Region"}
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
                    {isZh ? "请选择国家/地区" : "Select a country/region"}
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
                  {isZh ? "联系人姓名" : "Contact Person"}
                  <span style={{ color: "var(--error)", marginLeft: "2px" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  placeholder={isZh ? "请输入联系人姓名" : "Enter contact name"}
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
                    {isZh ? "邮箱" : "Email"}
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
                    {isZh ? "联系电话" : "Phone"}
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
                  {isZh ? "资质证明链接" : "License / Certificate Link"}
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: "var(--text-caption)", marginLeft: "6px" }}>
                    ({isZh ? "选填" : "Optional"})
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
                  {isZh ? "可上传至云存储后粘贴链接，或留空后续补充" : "Upload to cloud storage and paste the link, or leave blank to add later"}
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
                  {isZh ? "入驻须知" : "Notes"}
                </h3>
                <ul style={{ fontSize: "var(--text-body-sm)", color: "var(--text-secondary)", listStyle: "disc", listStylePosition: "inside", display: "flex", flexDirection: "column", gap: "6px", margin: 0, padding: 0 }}>
                  <li>{isZh ? "审核周期：3-5 个工作日" : "Review period: 3-5 business days"}</li>
                  <li>{isZh ? "需要提供有效的律师事务所营业执照" : "Valid law firm business license required"}</li>
                  <li>{isZh ? "入驻后可在平台接单，提供肖像权保护服务" : "After approval, you can receive orders on the platform"}</li>
                  <li>{isZh ? "平台收取一定比例的服务费，详情见协议" : "Platform charges a percentage service fee, see agreement for details"}</li>
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
                    {isZh ? "提交中..." : "Submitting..."}
                  </span>
                ) : (
                  isZh ? "提交入驻申请" : "Submit Application"
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
