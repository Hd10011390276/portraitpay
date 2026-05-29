"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

interface FormData {
  portraitId:    string;
  portraitTitle: string;
  reporterEmail: string;
  reporterName:  string;
  type:          string;
  description:   string;
  detectedUrl:   string;
  evidenceUrls:  string;
  originalImageUrl: string;
}

export default function PublicReportPage() {
  const { t } = useLanguage();
  const tv = t.publicReport ?? {};
  const tReport = t.report ?? {};

  const INFRINGEMENT_TYPES = tReport.infringementTypes ?? [
    { value: "UNAUTHORIZED_USE", label: "Unauthorized Use" },
    { value: "EXPIRED_LICENSE", label: "Expired License" },
    { value: "SCOPE_VIOLATION", label: "Scope Violation" },
    { value: "RESALE", label: "Resale / Illegal Transfer" },
    { value: "DEEPFAKE", label: "Synthetic Media" },
  ];

  const [form, setForm] = useState<FormData>({
    portraitId:       "",
    portraitTitle:    "",
    reporterEmail:    "",
    reporterName:     "",
    type:             "UNAUTHORIZED_USE",
    description:       "",
    detectedUrl:      "",
    evidenceUrls:     "",
    originalImageUrl: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<{ title: string; desc: string } | null>(null);
  const [duplicate, setDuplicate]    = useState(false);

  const evidenceUrlList = form.evidenceUrls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const isValid =
    form.reporterEmail.trim().length > 0 &&
    /^[^@]+@[^@]+\.[^@]+$/.test(form.reporterEmail.trim()) &&
    form.type &&
    form.description.length >= 10 &&
    evidenceUrlList.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);
    setDuplicate(false);

    try {
      const res = await fetch("/api/public-report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitId:    form.portraitId.trim() || undefined,
          portraitTitle: form.portraitTitle.trim() || undefined,
          reporterEmail: form.reporterEmail.trim(),
          reporterName:  form.reporterName.trim() || undefined,
          type:          form.type,
          description:   form.description.trim(),
          detectedUrl:   form.detectedUrl.trim() || undefined,
          evidenceUrls:  evidenceUrlList,
          originalImageUrl: form.originalImageUrl.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok && res.status !== 200) {
        setError(json.error ?? tv.error ?? "Submission failed");
        return;
      }

      if (json.data?.duplicate) {
        setDuplicate(true);
        setSuccess({
          title: tv.duplicate ?? "Duplicate report detected",
          desc:  "",
        });
      } else {
        setSuccess({
          title: tv.successTitle ?? "Report Submitted!",
          desc:  tv.successDesc ?? "",
        });
      }
    } catch {
      setError(tv.networkError ?? "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Public Nav ── */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            PortraitPay AI
          </a>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {t.nav?.signIn ?? "Sign In"}
            </a>
            <a href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {t.nav?.getStarted ?? "Get Started"}
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>🔓</span>
            <span>{tv.banner ?? "No login required"}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {tv.title ?? "Public Infringement Report"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            {tv.subtitle ?? "Report unauthorized portrait use without an account"}
          </p>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6"
        >

          {/* Contact section */}
          <div className="pb-5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
              {tReport.reporterEmail ?? "Contact Information"}
            </p>

            {/* Reporter Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tv.reporterEmail ?? "Email"} <span className="text-red-500">*</span>
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{tv.reporterEmailHint}</p>
              <input
                type="email"
                value={form.reporterEmail}
                onChange={(e) => setForm((f) => ({ ...f, reporterEmail: e.target.value }))}
                placeholder={tv.reporterEmailPlaceholder ?? "your@email.com"}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Reporter Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tv.reporterName ?? "Name (optional)"}
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{tv.reporterNameHint}</p>
              <input
                type="text"
                value={form.reporterName}
                onChange={(e) => setForm((f) => ({ ...f, reporterName: e.target.value }))}
                placeholder={tv.reporterNamePlaceholder ?? "John Doe"}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Infringement section */}
          <div className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
              {tReport.detectedUrl ?? "Infringement Details"}
            </p>

            {/* Portrait ID */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tReport.portraitIdRequired ?? "Portrait ID"}
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                {tReport.portraitIdHint ?? "Enter the affected portrait ID if known"}
              </p>
              <input
                type="text"
                value={form.portraitId}
                onChange={(e) => setForm((f) => ({ ...f, portraitId: e.target.value }))}
                placeholder={tReport.portraitIdPlaceholder ?? "e.g., portrait_123"}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Portrait Title (if no ID) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tv.portraitTitle ?? "Portrait / Celebrity Name"}
              </label>
              <input
                type="text"
                value={form.portraitTitle}
                onChange={(e) => setForm((f) => ({ ...f, portraitTitle: e.target.value }))}
                placeholder={tv.portraitTitlePlaceholder ?? "e.g., Taylor Swift"}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Infringement Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tReport.infringementTypeRequired ?? "Infringement Type"} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INFRINGEMENT_TYPES.map((t_item: { value: string; label: string }) => (
                  <option key={t_item.value} value={t_item.value}>{t_item.label}</option>
                ))}
              </select>
            </div>

            {/* Detected URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tReport.detectedUrl ?? "Detected URL"}
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{tReport.detectedUrlHint}</p>
              <input
                type="url"
                value={form.detectedUrl}
                onChange={(e) => setForm((f) => ({ ...f, detectedUrl: e.target.value }))}
                placeholder="https://..."
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Evidence URLs */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tReport.evidenceUrlsRequired ?? "Evidence URLs"} <span className="text-red-500">*</span>
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{tReport.evidenceUrlsHint}</p>
              <textarea
                value={form.evidenceUrls}
                onChange={(e) => setForm((f) => ({ ...f, evidenceUrls: e.target.value }))}
                placeholder={tReport.evidenceUrlsPlaceholder ?? "https://...\nhttps://..."}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
              {evidenceUrlList.length > 0 && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  {String(tReport.evidenceCount ?? "").replace("{count}", String(evidenceUrlList.length))}
                </p>
              )}
            </div>

            {/* Original Image URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tReport.originalImageUrl ?? "Original Image URL"}
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{tReport.originalImageUrlHint}</p>
              <input
                type="url"
                value={form.originalImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, originalImageUrl: e.target.value }))}
                placeholder="https://..."
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tReport.description ?? "Description"} <span className="text-red-500">*</span>
              </label>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{tReport.descriptionHint}</p>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={tReport.descriptionPlaceholder ?? "Please describe the infringement in detail..."}
                rows={5}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className={`mt-1 text-xs ${form.description.length >= 10 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                {String(tReport.charCount ?? "{count} / 10").replace("{count}", String(form.description.length))}
              </p>
            </div>
          </div>

          {/* Error / Success / Duplicate */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              <p className="font-semibold mb-1">{success.title}</p>
              {success.desc && <p className="mt-1 opacity-80">{success.desc}</p>}
            </div>
          )}
          {duplicate && (
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/30 p-4 text-sm text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold">{tv.duplicate ?? "Duplicate report detected"}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 text-sm transition-colors"
          >
            {submitting
              ? (tReport.submitting ?? "Submitting...")
              : (tReport.submit ?? "Submit Report")}
          </button>

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {tReport.disclaimer ?? "Disclaimer"}:{" "}
            {tReport.infringementRules ?? "Infringement Rules"}
          </p>
        </form>

        {/* ── How it works ── */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {tReport.howTitle ?? "How It Works"}
          </h2>
          <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Fill in the form above — no account or login required</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Our team reviews the submission within 24 business hours</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>You receive an email notification once the report is processed</span>
            </li>
          </ol>
        </div>

        {/* ── Back to home ── */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ← {t.nav?.backHome ?? "Back to Home"}
          </a>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">PortraitPay AI — {new Date().getFullYear()}</p>
          <nav className="flex gap-6 text-sm text-gray-500">
            <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
            <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
