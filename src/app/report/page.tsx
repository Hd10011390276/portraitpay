"use client";

/**
 * Infringement Report Submission Page
 * Route: /report
 *
 * Allows any authenticated user to submit an infringement report.
 * Validates portrait ownership and required evidence before submission.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

const INFRINGEMENT_TYPES = t.report.infringementTypes || [
  { value: "UNAUTHORIZED_USE", label: "Unauthorized Use" },
  { value: "EXPIRED_LICENSE", label: "License Expired" },
  { value: "SCOPE_VIOLATION", label: "Scope Violation" },
  { value: "RESALE", label: "Resale/Illegal Transfer" },
  { value: "DEEPFAKE", label: "Deepfake" },
];

interface FormData {
  portraitId: string;
  type: string;
  description: string;
  detectedUrl: string;
  evidenceUrls: string;
  originalImageUrl: string;
}

export default function ReportPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState<FormData>({
    portraitId: "",
    type: "UNAUTHORIZED_USE",
    description: "",
    detectedUrl: "",
    evidenceUrls: "",
    originalImageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const evidenceUrls = form.evidenceUrls
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const isValid = form.portraitId && form.type && form.description.length >= 10 && evidenceUrls.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/infringements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitId: form.portraitId,
          type: form.type,
          description: form.description,
          detectedUrl: form.detectedUrl,
          evidenceUrls,
          originalImageUrl: form.originalImageUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? t.report.error);
        return;
      }

      setSuccess(`${t.report.submitSuccess.replace("{id}", json.data.id)}`);
      setTimeout(() => router.push(`/infringements/${json.data.id}`), 2000);
    } catch {
      setError(t.report.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell
      title={t.report.title}
      subtitle={t.report.subtitle}
    >
      <div className="max-w-2xl mx-auto">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-sm">
          {/* Portrait ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.report.portraitIdRequired} <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              {t.report.portraitIdHint}
            </p>
            <input
              type="text"
              value={form.portraitId}
              onChange={(e) => setForm((f) => ({ ...f, portraitId: e.target.value }))}
              placeholder={t.report.portraitIdPlaceholder}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Infringement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.report.infringementTypeRequired} <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {INFRINGEMENT_TYPES.map((t_item) => (
                <option key={t_item.value} value={t_item.value}>{t_item.label}</option>
              ))}
            </select>
          </div>

          {/* Infringing URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.report.detectedUrl}
            </label>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t.report.detectedUrlHint}</p>
            <input
              type="url"
              value={form.detectedUrl}
              onChange={(e) => setForm((f) => ({ ...f, detectedUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.report.evidenceUrlsRequired} <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              {t.report.evidenceUrlsHint}
            </p>
            <textarea
              value={form.evidenceUrls}
              onChange={(e) => setForm((f) => ({ ...f, evidenceUrls: e.target.value }))}
              placeholder={t.report.evidenceUrlsPlaceholder}
              rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
            {evidenceUrls.length > 0 && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                {t.report.evidenceCount?.replace("{count}", String(evidenceUrls.length))}
              </p>
            )}
          </div>

          {/* Original Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.report.originalImageUrl}
            </label>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t.report.originalImageUrlHint}</p>
            <input
              type="url"
              value={form.originalImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, originalImageUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.report.descriptionRequired} <span className="text-red-500">*</span>
            </label>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{t.report.descriptionHint}</p>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t.report.descriptionPlaceholder}
              rows={5}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
            <p className={`mt-1 text-xs ${form.description.length >= 10 ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
              {(t.report.charCount || "{count} / 10 characters (minimum required)").replace("{count}", String(form.description.length))}
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4 text-sm text-green-700 dark:text-green-400">{success}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {submitting ? t.report.submitting : t.report.submit}
          </button>
        </form>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {t.report.disclaimer}{" "}
          <a href="/terms" className="underline">
            {t.report.infringementRules}
          </a>
          。
        </p>
      </div>
    </DashboardShell>
  );
}
