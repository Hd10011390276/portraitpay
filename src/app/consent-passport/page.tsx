/**
 * /consent-passport — Public Consent Passport Generator
 *
 * Any person (actor/celebrity) can fill out this form to create
 * a publicly verifiable consent declaration record.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

const ALLOWED_USE_OPTIONS = [
  { value: "VIDEO_GENERATION", label: "Video Generation" },
  { value: "VOICE_CLONE", label: "Voice Clone" },
  { value: "DIGITAL_AVATAR", label: "Digital Avatar" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "FILM", label: "Film / Animation" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "EDUCATION", label: "Education" },
  { value: "OTHER", label: "Other" },
];

const PROHIBITED_USE_OPTIONS = [
  { value: "ADULT", label: "Adult content" },
  { value: "POLITICAL", label: "Political endorsement" },
  { value: "VIOLENCE", label: "Violence / Illegal" },
  { value: "HATE", label: "Hate speech / Discrimination" },
  { value: "FRAUD", label: "Fraud / Scam" },
  { value: "WEAPONS", label: "Weapons promotion" },
  { value: "ILLEGAL", label: "Illegal activities" },
];

export default function ConsentPassportPage() {
  const { t } = useLanguage();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    contactInfo: "",
    additionalTerms: "",
    threeViewFront: "",
    threeViewSide: "",
    threeViewTop: "",
  });
  const [allowedUses, setAllowedUses] = useState<string[]>([]);
  const [prohibitedUses, setProhibitedUses] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  function toggleUse(set: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) {
    if (set.includes(value)) {
      setter(set.filter((v) => v !== value));
    } else {
      setter([...set, value]);
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/consent-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          allowedUses,
          prohibitedUses,
          contactInfo: form.contactInfo.trim() || undefined,
          additionalTerms: form.additionalTerms.trim() || undefined,
          threeViewFront: form.threeViewFront.trim() || undefined,
          threeViewSide: form.threeViewSide.trim() || undefined,
          threeViewTop: form.threeViewTop.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShareUrl(json.data.shareUrl);
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">← Back</Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🪪</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Consent Passport is Ready
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Share this link with anyone who needs to verify your consent preferences.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 break-all">
              <p className="text-xs text-gray-400 mb-1">Shareable link</p>
              <p className="text-sm font-mono text-blue-600 dark:text-blue-400">{window.location.origin}{shareUrl}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(window.location.origin + shareUrl)}
                className="flex-1 px-4 py-2.5 bg-[#244169] hover:bg-[#1a3354] text-white font-medium rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <Link
                href={shareUrl}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-center font-medium transition-colors"
              >
                Preview
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">← Back</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>🪪</span>
            <span>Consent Passport</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Consent Passport
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Generate a verifiable record of your portrait usage consent. Share it with creators, brands, and platforms.
          </p>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
            Not just for actors — anyone whose face or voice has commercial value can create a Consent Passport.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="As shown on official ID"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.fullName ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Allowed Uses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ✅ I ALLOW the following uses of my portrait
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALLOWED_USE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                    allowedUses.includes(opt.value)
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={allowedUses.includes(opt.value)}
                    onChange={() => toggleUse(allowedUses, setAllowedUses, opt.value)}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    allowedUses.includes(opt.value) ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {allowedUses.includes(opt.value) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prohibited Uses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ❌ I DO NOT ALLOW the following uses of my portrait
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROHIBITED_USE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                    prohibitedUses.includes(opt.value)
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={prohibitedUses.includes(opt.value)}
                    onChange={() => toggleUse(prohibitedUses, setProhibitedUses, opt.value)}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    prohibitedUses.includes(opt.value) ? "bg-red-500 border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {prohibitedUses.includes(opt.value) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contact / Agent Info <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => setForm((p) => ({ ...p, contactInfo: e.target.value }))}
              placeholder="e.g. agent@agency.com or +1 555 000 0000"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Additional Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Additional Terms <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.additionalTerms}
              onChange={(e) => setForm((p) => ({ ...p, additionalTerms: e.target.value }))}
              placeholder="Any additional conditions or notes..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Three-View Materials */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📁 Three-View Materials <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {(["Front", "Side", "Top"] as const).map((view) => (
                <div key={view}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {view} View
                  </label>
                  <input
                    type="text"
                    value={form[`threeView${view}` as keyof typeof form] as string}
                    onChange={(e) => setForm((p) => ({ ...p, [`threeView${view}` as keyof typeof form]: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#244169] hover:bg-[#1a3354] disabled:opacity-60 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>🪪</span>
                Generate Consent Passport
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            This record is publicly verifiable on the platform. No login required.
          </p>
        </form>
      </main>
    </div>
  );
}
