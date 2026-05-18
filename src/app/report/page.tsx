"use client";

/**
 * /report — Infringement Report Submission Page
 *
 * Allows authenticated users to submit an infringement report.
 * Reference: /consent-passport UX pattern (max-w-2xl card layout, dark mode)
 */

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

const INFRINGEMENT_TYPES = [
  { value: "AI_FACE_CLONE", label: "AI Face Clone / Digital Human" },
  { value: "VOICE_CLONE", label: "Voice Clone" },
  { value: "AI_SHORT_DRAMA", label: "AI Short Drama Infringement" },
  { value: "UNAUTHORIZED_USE", label: "Unauthorized Use" },
  { value: "DEEPFAKE", label: "Synthetic Media / Deepfake" },
  { value: "OTHER", label: "Other" },
];

const PLATFORMS = [
  { value: "youtube", label: "YouTube" },
  { value: "douyin", label: "Douyin" },
  { value: "kuaishou", label: "Kuaishou" },
  { value: "xiaohongshu", label: "Xiaohongshu" },
  { value: "bilibili", label: "Bilibili" },
  { value: "weibo", label: "Weibo" },
  { value: "toutiao", label: "Toutiao" },
  { value: "weixin", label: "WeChat Video" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

function makeReportNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 999999).toString().padStart(6, "0");
  return `PP-IR-${year}-${seq}`;
}

function typeLabel(v: string) {
  return INFRINGEMENT_TYPES.find((t) => t.value === v)?.label ?? v;
}
function platformLabel(v: string) {
  return PLATFORMS.find((p) => p.value === v)?.label ?? v;
}

export default function ReportPage() {
  const { t } = useLanguage();

  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    infringerName: "",
    infringerEmail: "",
    infringementType: "AI_FACE_CLONE",
    platformName: "",
    platformUrl: "",
    description: "",
    evidenceUrls: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportNumber, setReportNumber] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const evidenceUrls = form.evidenceUrls.split("\n").map((u) => u.trim()).filter(Boolean);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.reporterName.trim()) errs.reporterName = "Your name is required";
    if (!form.reporterEmail.trim()) errs.reporterEmail = "Your email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporterEmail)) errs.reporterEmail = "Invalid email address";
    if (!form.infringerName.trim()) errs.infringerName = "Infringer name is required";
    if (!form.infringerEmail.trim()) errs.infringerEmail = "Infringer email is required";
    if (!form.description.trim() || form.description.length < 10) errs.description = "Please describe in at least 10 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/report/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: form.reporterName.trim(),
          reporterEmail: form.reporterEmail.trim(),
          reporterPhone: form.reporterPhone.trim() || undefined,
          infringerName: form.infringerName.trim(),
          infringerEmail: form.infringerEmail.trim(),
          infringementType: form.infringementType,
          platformName: form.platformName || undefined,
          platformUrl: form.platformUrl.trim() || undefined,
          description: form.description.trim() || undefined,
          evidenceUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrors({ submit: json.error || "Submission failed, please try again" });
        return;
      }
      setReportNumber(json.data.reportNumber);
      setReportUrl(json.data.reportUrl || "");
      setSuccess(true);
    } catch {
      setErrors({ submit: "Network error, please check your connection" });
    } finally {
      setLoading(false);
    }
  }

  function buildReportText() {
    const lines = [
      "INFRINGEMENT REPORT",
      "====================",
      "",
      `Report ID: ${reportNumber}`,
      `Generated: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" })}`,
      "",
      "--- REPORTER INFORMATION ---",
      `Reporter Name: ${form.reporterName}`,
      `Reporter Email: ${form.reporterEmail}`,
      form.reporterPhone ? `Reporter Phone: ${form.reporterPhone}` : null,
      "",
      "--- INFRINGER INFORMATION ---",
      `Infringer Name: ${form.infringerName}`,
      `Infringer Email: ${form.infringerEmail}`,
      "",
      "--- INFRINGEMENT DETAILS ---",
      `Infringement Type: ${typeLabel(form.infringementType)}`,
      `Platform Found On: ${platformLabel(form.platformName) || "Not specified"}`,
      form.platformUrl ? `Content URL: ${form.platformUrl}` : null,
      evidenceUrls.length > 0 ? `Evidence URLs: ${evidenceUrls.join(", ")}` : null,
      "",
      "--- DESCRIPTION ---",
      form.description || "(No description provided)",
      "",
      "--- LEGAL DISCLAIMER ---",
      "This report is generated by PortraitPay AI for reference only.",
      "It does not constitute legal advice.",
      "For formal legal action, consult a licensed attorney or file a police report.",
      "",
      "Issued by PortraitPay AI — www.portraitpayai.com",
    ];
    return lines.filter(Boolean).join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildReportText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (success) {
    const reportText = buildReportText();
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">← Back</Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Your Infringement Report is Ready
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Report ID: <span className="font-mono font-semibold text-purple-600">{reportNumber}</span>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 border-b border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-purple-700 dark:text-purple-300">Report Summary</h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {copied ? (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Report</>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reporter</p>
                  <p className="font-medium text-gray-900 dark:text-white">{form.reporterName}</p>
                  <p className="text-xs text-gray-500">{form.reporterEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Infringer</p>
                  <p className="font-medium text-gray-900 dark:text-white">{form.infringerName}</p>
                  <p className="text-xs text-gray-500">{form.infringerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{typeLabel(form.infringementType)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Platform</p>
                  <p className="font-medium text-gray-900 dark:text-white">{platformLabel(form.platformName) || "—"}</p>
                </div>
              </div>
              {form.description && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{form.description}</p>
                </div>
              )}
              {evidenceUrls.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Evidence ({evidenceUrls.length})</p>
                  {evidenceUrls.map((u, i) => (
                    <p key={i} className="text-xs font-mono text-purple-600 dark:text-purple-400 truncate">{u}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Full Report Text — Copy & Paste Below</h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
              >
                {copied ? "Copied!" : "Copy All"}
              </button>
            </div>
            <textarea
              readOnly
              value={reportText}
              rows={20}
              className="w-full text-xs font-mono bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 p-4 resize-none"
            />
          </div>

          {reportUrl && (
            <div className="mt-4 text-center">
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:underline font-medium"
              >
                View Report Online →
              </a>
            </div>
          )}

          <p className="text-xs text-center text-gray-400 mt-6">
            This report is for reference only and does not constitute legal advice.
            For formal legal action, consult a licensed attorney or file a police report.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">← Back</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>📋</span>
            <span>Infringement Report</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Submit Infringement Report
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            AI face clone, voice clone, or unauthorized use? Fill out the form below to generate a formal report for your legal complaint or attorney review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.reporterName}
              onChange={(e) => set("reporterName", e.target.value)}
              placeholder="Your full name"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.reporterName ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`}
            />
            {errors.reporterName && <p className="text-red-500 text-xs mt-1">{errors.reporterName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Your Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.reporterEmail}
                onChange={(e) => set("reporterEmail", e.target.value)}
                placeholder="your@email.com"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.reporterEmail ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`}
              />
              {errors.reporterEmail && <p className="text-red-500 text-xs mt-1">{errors.reporterEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.reporterPhone}
                onChange={(e) => set("reporterPhone", e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Infringer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Infringer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.infringerName}
                  onChange={(e) => set("infringerName", e.target.value)}
                  placeholder="Name or nickname of the infringer"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.infringerName ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`}
                />
                {errors.infringerName && <p className="text-red-500 text-xs mt-1">{errors.infringerName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Infringer Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.infringerEmail}
                  onChange={(e) => set("infringerEmail", e.target.value)}
                  placeholder="Infringer contact email"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.infringerEmail ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`}
                />
                {errors.infringerEmail && <p className="text-red-500 text-xs mt-1">{errors.infringerEmail}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Infringement Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Infringement Type
                </label>
                <select
                  value={form.infringementType}
                  onChange={(e) => set("infringementType", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {INFRINGEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Platform Found On
                </label>
                <select
                  value={form.platformName}
                  onChange={(e) => set("platformName", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select platform</option>
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Content URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.platformUrl}
                  onChange={(e) => set("platformUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Describe the infringement in detail..."
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.description ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none`}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Evidence URLs <span className="text-gray-400 font-normal">(one per line, optional)</span>
                </label>
                <textarea
                  value={form.evidenceUrls}
                  onChange={(e) => set("evidenceUrls", e.target.value)}
                  rows={3}
                  placeholder="https://... (one link per line)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
                {evidenceUrls.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{evidenceUrls.length} evidence link(s) entered</p>
                )}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{errors.submit}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <span>📋</span>
                Generate Infringement Report
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            This report is for reference only. No login required beyond this page. For legal action, consult an attorney.
          </p>
        </form>
      </main>
    </div>
  );
}