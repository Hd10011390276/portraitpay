"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface PortraitDetail {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  tags: string[];
  status: string;
  originalImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageHash?: string | null;
  blockchainTxHash?: string | null;
  ipfsCid?: string | null;
  certifiedAt?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditPortraitPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const isZh = false;
  const id = params.id as string;

  const [portrait, setPortrait] = useState<PortraitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    tags: "",
    isPublic: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/portraits/${id}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => {
        if (j.success) {
          const p = j.data;
          setPortrait(p);
          setForm({
            title: p.title ?? "",
            description: p.description ?? "",
            category: p.category ?? "general",
            tags: (p.tags ?? []).join(", "),
            isPublic: p.isPublic ?? false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = t.portraits?.detail?.titleIsRequired || t.upload?.titleIsRequired || "Title is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(`/api/portraits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          category: form.category,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          isPublic: form.isPublic,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveMsg(t.portraits?.detail?.savedSuccessfully || t.upload?.savedSuccessfully || "✅ Saved successfully");
        setTimeout(() => router.push(`/portraits/${id}`), 1500);
      } else {
        setSaveMsg(`❌ ${json.error}`);
      }
    } catch {
      setSaveMsg("❌ " + (t.portraits?.detail?.networkError || t.upload?.networkError || "Network error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!portrait) {
    return (
      <DashboardShell title={t.portraits?.detail?.portraitNotFound || t.upload?.portraitNotFound || "Portrait Not Found"} subtitle="">
        <div className="text-center py-24">
          <p className="text-gray-500">{t.portraits?.detail?.portraitNotFound || t.upload?.portraitNotFound || "Portrait not found."}</p>
          <Link href="/portraits" className="text-blue-600 hover:underline mt-4 inline-block">
            ← {t.portraits?.detail?.backToPortraits || t.upload?.backToPortraits || "Back to Portraits"}
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={t.portraits?.detail?.editTitle || t.upload?.editTitle || "Edit Portrait"}
      subtitle={t.portraits?.detail?.editSubtitle || t.upload?.editSubtitle || "Update portrait details"}
    >
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Current image preview */}
          {portrait.originalImageUrl && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {t.portraits?.detail?.currentImage || t.upload?.currentImage || "Current Image"}
              </p>
              <img
                src={portrait.originalImageUrl}
                alt={portrait.title}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-2">
                {t.portraits?.detail?.changeImageHint || t.upload?.changeImageHint || "To change the image, please archive this portrait and upload a new one."}
              </p>
            </div>
          )}

          {/* Title */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.portraits?.detail?.titleLabel || t.upload?.titleLabel || "Title"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.title ? "border-red-300" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                <p className="mt-0.5 text-xs text-gray-400 text-right">{form.title.length}/200</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.portraits?.detail?.descriptionLabel || t.upload?.descriptionLabel || "Description"}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.portraits?.detail?.categoryLabel || t.upload?.categoryLabel || "Category"}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="general">{t.upload?.categoryGeneral || "General"}</option>
                  <option value="celebrity">{t.upload?.categoryCelebrity || "Celebrity"}</option>
                  <option value="artist">{t.upload?.categoryArtist || "Artist"}</option>
                  <option value="athlete">{t.upload?.categoryAthlete || "Athlete"}</option>
                  <option value="business">{t.upload?.categoryBusiness || "Business"}</option>
                  <option value="political">{t.upload?.categoryPolitical || "Political"}</option>
                  <option value="other">{t.upload?.categoryOther || "Other"}</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.portraits?.detail?.tagsLabel || t.upload?.tagsLabel || "Tags"} <span className="text-xs text-gray-400">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder={t.portraits?.detail?.tagsPlaceholder || t.upload?.tagsPlaceholder || "portrait, official, 2024"}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* Public toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isPublic ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      form.isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.portraits?.detail?.publicListing || t.upload?.publicListing || "Public Listing"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.portraits?.detail?.publicListingDesc || t.upload?.publicListingDesc || "Allow others to find this portrait"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (t.portraits?.detail?.saving || t.upload?.saving || "Saving...") : (t.portraits?.detail?.saveChanges || t.upload?.saveChanges || "Save Changes")}
            </button>

            {saveMsg && (
              <span className="text-sm">{saveMsg}</span>
            )}

            <Link
              href={`/portraits/${id}`}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t.portraits?.detail?.cancel || t.upload?.cancel || "Cancel"}
            </Link>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}