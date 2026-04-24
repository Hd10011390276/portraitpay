/**
 * /contact — 联系表单页面
 * UI风格与主页一致，支持日间/夜间模式和中英文切换
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
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
    if (!form.name.trim()) e.name = t.contact.validation.nameRequired || "请填写姓名";
    if (!form.email.trim()) e.email = t.contact.validation.emailRequired || "请填写邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t.contact.validation.emailInvalid || "邮箱格式不正确";
    if (!form.message.trim()) e.message = t.contact.validation.messageRequired || "请填写留言内容";
    else if (form.message.trim().length < 10) e.message = t.contact.validation.messageTooShort || "留言至少10个字符";
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
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{
          maxWidth: "480px",
          width: "100%",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            {t.contact.success?.title || "提交成功！"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            {t.contact.success?.message || "感谢您的留言，我们的团队会在 1-3 个工作日内与您联系。"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link
              href="/"
              style={{
                display: "block",
                width: "100%",
                padding: "12px",
                background: "var(--accent-primary)",
                color: "#fff",
                borderRadius: "var(--radius-lg)",
                fontWeight: 500,
                textAlign: "center",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              {t.contact.success?.backHome || "返回首页"}
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setForm({ name: "", email: "", company: "", subject: "", message: "" });
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-lg)",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t.contact.success?.continue || "继续留言"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header - 与主页一致 */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--bg-secondary)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          padding: "0 24px",
          maxWidth: "1152px",
          margin: "0 auto",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>PortraitPay AI</span>
          </Link>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/" style={{ fontSize: "14px", color: "var(--text-secondary)", textDecoration: "none" }}>
              ← {t.contact.home || "返回首页"}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "768px", margin: "0 auto", padding: "48px 24px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "30px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            {t.contact.title || "联系我们"}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {t.contact.subtitle || "有任何问题或建议？欢迎填写表单，我们的团队会在 1-3 个工作日内与您联系。"}
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <Link
              href="/enterprise/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "var(--accent-light)",
                color: "var(--accent-primary)",
                borderRadius: "var(--radius-lg)",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              🏢 {t.contact.enterpriseContact || "企业入驻咨询"} →
            </Link>
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border-color)",
          padding: "32px",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Name + Email row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                  {t.contact.form?.name || "姓名"} <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={t.contact.form?.namePlaceholder || "您的姓名"}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${errors.name ? "#ef4444" : "var(--border-color)"}`,
                    borderRadius: "var(--radius-lg)",
                    fontSize: "14px",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                {errors.name && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.name}</p>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                  {t.contact.form?.email || "邮箱"} <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${errors.email ? "#ef4444" : "var(--border-color)"}`,
                    borderRadius: "var(--radius-lg)",
                    fontSize: "14px",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                {errors.email && <p style={{ marginTop: "4px", fontSize: "12px", color: "#ef4444" }}>{errors.email}</p>}
              </div>
            </div>

            {/* Company */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                {t.contact.form?.company || "公司 / 组织"} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({t.common?.optional || "可选"})</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder={t.contact.form?.companyPlaceholder || "您所属的公司或组织"}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "14px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>

            {/* Subject */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                {t.contact.form?.subject || "主题"} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({t.common?.optional || "可选"})</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder={t.contact.form?.subjectPlaceholder || "简要描述您的问题"}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  fontSize: "14px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "6px" }}>
                {t.contact.form?.message || "留言内容"} <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder={t.contact.form?.messagePlaceholder || "请详细描述您的问题或建议..."}
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${errors.message ? "#ef4444" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-lg)",
                  fontSize: "14px",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                {errors.message ? (
                  <p style={{ fontSize: "12px", color: "#ef4444" }}>{errors.message}</p>
                ) : <span />}
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{form.message.length}/5000</span>
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div style={{
                padding: "16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-lg)",
                fontSize: "14px",
                color: "#dc2626",
              }}>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--accent-primary)",
                color: "#fff",
                borderRadius: "var(--radius-lg)",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s",
              }}
            >
              {submitting ? (
                <>
                  <span style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  {t.contact.form?.submitting || "提交中..."}
                </>
              ) : (
                t.contact.form?.submit || "提交留言"
              )}
            </button>

            <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
              {t.contact.form?.privacy || "提交即表示您同意我们的"}{" "}
              <a href="/privacy" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
                {t.contact.form?.privacyPolicy || "隐私政策"}
              </a>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}