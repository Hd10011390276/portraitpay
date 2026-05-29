"use client";

/**
 * /report — Infringement Report Submission Page
 *
 * Allows authenticated users to submit an infringement report.
 * Reference: /consent-passport UX pattern (max-w-2xl card layout, dark mode)
 */
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
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
  // Voice comparison state
  const [voiceCompareResult, setVoiceCompareResult] = useState<{similarity: number; risk: string} | null>(null);
  const [voiceCompareLoading, setVoiceCompareLoading] = useState(false);
  const [voiceCompareError, setVoiceCompareError] = useState("");
  const [voiceCompareNoRegister, setVoiceCompareNoRegister] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [copied, setCopied] = useState(false);
  // IP Member selection for agency users — evidence chain
  const [ipMembers, setIpMembers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isAgency, setIsAgency] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Fetch IP Members for agency users
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data?.availableRoles?.includes("AGENCY")) {
          setIsAgency(true);
          return fetch("/api/v1/agent/members", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.success) setIpMembers(d.data || []);
            });
        }
      })
      .catch(() => {});
  }, []);

  const evidenceUrls = form.evidenceUrls.split("\n").map((u) => u.trim()).filter(Boolean);

  async function handleVoiceFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoiceCompareError("");
    setVoiceCompareNoRegister(false);
    setVoiceCompareLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/report/voice-compare", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setVoiceCompareResult(json.data);
      } else if (json.code === "NO_VOICE_REGISTERED") {
        setVoiceCompareNoRegister(true);
        setVoiceCompareError(json.message);
      } else {
        setVoiceCompareError(json.message || "Failed to compare voice.");
      }
    } catch {
      setVoiceCompareError("Network error. Please try again.");
    } finally {
      setVoiceCompareLoading(false);
    }
  }

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
          voiceSimilarityScore: voiceCompareResult?.similarity ?? null,
          voiceSimilarityRisk: voiceCompareResult?.risk ?? null,
          ipMemberId: selectedMemberId || undefined,
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
      ...(selectedMemberId ? [
        "",
        "--- EVIDENCE CHAIN (For Lawyer Review) ---",
        `IP Member ID: ${selectedMemberId}`,
        `IP Member Name: ${ipMembers.find((m) => m.id === selectedMemberId)?.name || "N/A"}`,
        "Note: This report is prepared as evidence for legal counsel.",
      ] : []),
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
                {voiceCompareResult && (
                  <div className="col-span-2 mt-2 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎤</span>
                      <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">Voice Comparison Result</span>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${voiceCompareResult.risk === "HIGH" ? "bg-red-500" : voiceCompareResult.risk === "MEDIUM" ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${Math.round(voiceCompareResult.similarity * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200 min-w-[48px] text-right">
                        {Math.round(voiceCompareResult.similarity * 100)}%
                      </span>
                    </div>
                    <p className={`text-xs font-medium ${
                      voiceCompareResult.risk === "HIGH" ? "text-red-600 dark:text-red-400" :
                      voiceCompareResult.risk === "MEDIUM" ? "text-amber-600 dark:text-amber-400" :
                      "text-green-600 dark:text-green-400"
                    }`}>
                      Risk Level: {voiceCompareResult.risk}
                      {voiceCompareResult.risk === "HIGH" ? " — Strong indication of voice clone" :
                       voiceCompareResult.risk === "MEDIUM" ? " — Review additional evidence recommended" :
                       " — May not be the same speaker"}
                    </p>
                  </div>
                )}
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

          {/* Who this tool is for */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-5 text-left space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Who this tool is for:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              PortraitPay AI assists with commercial and civil likeness violations — including unauthorized use of your face or voice in AI-generated advertising, social media content, or commercial productions.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Not sure if your case qualifies? If your likeness was used to make money or promote something without your consent, this tool is for you.
            </p>
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                For intimate image abuse or criminal matters, please contact:{" "}
                <a href="https://cybercivilrights.org" target="_blank" rel="noopener noreferrer" className="underline">Cyber Civil Rights Initiative</a>
                {" "}— cybercivilrights.org or 844-878-2274
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">

          {/* IP Member selector — agency evidence chain mode */}
          {isAgency && ipMembers.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔗</span>
                <div>
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">Evidence Chain for Lawyer</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Select the IP member whose rights have been infringed</p>
                </div>
              </div>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="">-- Select IP Member --</option>
                {ipMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.email ? ` (${m.email})` : ""}</option>
                ))}
              </select>
            </div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Voice Clone Verification — only show when VOICE_CLONE is selected */}
              {form.infringementType === "VOICE_CLONE" && (
                <div className="col-span-2 rounded-xl border border-teal-200 dark:border-teal-800 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎤</span>
                    <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-300">Voice Clone Verification</h3>
                  </div>

                  {!voiceCompareResult && !voiceCompareNoRegister && !voiceCompareError && !voiceCompareLoading && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload the suspected audio or video clip (2-60 seconds of speech) to compare against your registered voice fingerprint.
                    </p>
                  )}

                  {!voiceCompareResult && !voiceCompareLoading && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="px-4 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition cursor-pointer flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Upload Audio / Video Clip
                        <input
                          type="file"
                          accept="audio/*,video/*,.wav,.mp3,.webm,.ogg,.m4a,.mp4"
                          className="hidden"
                          onChange={handleVoiceFileChange}
                        />
                      </label>
                      <span className="text-xs text-gray-400 dark:text-gray-500 self-center">WAV, MP3, WebM, M4A, MP4 — 2-60 seconds</span>
                    </div>
                  )}

                  {voiceCompareLoading && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Analyzing voice...</span>
                    </div>
                  )}

                  {voiceCompareNoRegister && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                      <div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Voice not registered yet.</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Go to <a href="/dashboard" className="underline">Dashboard</a> → Voice ID to register your voice first. You can still submit the report without verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {voiceCompareError && !voiceCompareNoRegister && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <span className="text-red-500 text-base">✗</span>
                      <p className="text-sm text-red-700 dark:text-red-300">{voiceCompareError}</p>
                    </div>
                  )}

                  {voiceCompareResult && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Similarity Score</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                          voiceCompareResult.risk === "HIGH" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          voiceCompareResult.risk === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        }`}>
                          {voiceCompareResult.risk} RISK
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              voiceCompareResult.risk === "HIGH" ? "bg-red-500" :
                              voiceCompareResult.risk === "MEDIUM" ? "bg-amber-500" :
                              "bg-green-500"
                            }`}
                            style={{ width: `${Math.round(voiceCompareResult.similarity * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 min-w-[52px] text-right">
                          {Math.round(voiceCompareResult.similarity * 100)}%
                        </span>
                      </div>
                      <p className={`text-xs ${
                        voiceCompareResult.risk === "HIGH" ? "text-red-600 dark:text-red-400" :
                        voiceCompareResult.risk === "MEDIUM" ? "text-amber-600 dark:text-amber-400" :
                        "text-green-600 dark:text-green-400"
                      }`}>
                        {voiceCompareResult.risk === "HIGH"
                          ? "High similarity to your registered voice. Strong indication of voice clone."
                          : voiceCompareResult.risk === "MEDIUM"
                          ? "Moderate similarity. Consider reviewing additional evidence."
                          : "Low similarity to your registered voice. May not be the same speaker."}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setVoiceCompareResult(null); setVoiceCompareError(""); }}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Re-upload a different clip
                      </button>
                    </div>
                  )}
                </div>
              )}

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