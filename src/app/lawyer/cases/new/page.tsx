"use client";
/**
 * /lawyer/cases/new — Lawyer self-reported infringement case creation
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

const INFRINGEMENT_TYPES = [
  { value: "UNAUTHORIZED_USE", label: "Unauthorized Use" },
  { value: "DEEPFAKE", label: "Deepfake / AI Synthesis" },
  { value: "EXPIRED_LICENSE", label: "Expired License" },
  { value: "SCOPE_VIOLATION", label: "Scope Violation" },
  { value: "RESALE", label: "Resale without Permission" },
];

export default function NewCasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    portraitTitle: "",
    portraitId: "",
    type: "UNAUTHORIZED_USE",
    description: "",
    detectedUrl: "",
    evidenceUrls: "",
    reporterName: "",
    reporterEmail: "",
    compensation: "",
    voiceSimilarityScore: "",
    voiceSimilarityRisk: "UNKNOWN",
    faceComparisonScore: "",
    faceImageUrl: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 1) return form.portraitTitle.length > 0;
    if (step === 2) return form.type.length > 0 && form.description.length >= 20;
    if (step === 3) return form.evidenceUrls.split("\n").filter((u) => u.trim().length > 0).length > 0;
    return true;
  };

  const buildPayload = () => {
    const evidenceUrls = form.evidenceUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    const payload: Record<string, unknown> = {
      portraitTitle: form.portraitTitle,
      type: form.type,
      description: form.description,
      evidenceUrls,
      compensation: form.compensation ? parseFloat(form.compensation) : 0,
    };
    // Only include portraitId if not empty and not self-reported
    if (form.portraitId && !form.portraitId.startsWith("self-reported-")) {
      payload.portraitId = form.portraitId;
    }
    // Optional fields — only include if non-empty
    if (form.detectedUrl) payload.detectedUrl = form.detectedUrl;
    if (form.reporterName) payload.reporterName = form.reporterName;
    if (form.reporterEmail) payload.reporterEmail = form.reporterEmail;
    if (form.voiceSimilarityScore) {
      payload.voiceSimilarityScore = parseFloat(form.voiceSimilarityScore);
      payload.voiceSimilarityRisk = form.voiceSimilarityRisk;
    }
    if (form.faceComparisonScore) {
      payload.faceComparisonScore = parseFloat(form.faceComparisonScore);
    }
    if (form.faceImageUrl) payload.faceImageUrl = form.faceImageUrl;
    return payload;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/lawyer/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        let errMsg = `Server error (${res.status})`;
        if (res.status === 401) {
          toast({ type: "error", title: "Session expired — redirecting to login..." });
          setTimeout(() => router.push("/login"), 1500);
          return;
        }
        try {
          const errJson = await res.json();
          if (errJson?.error) errMsg = errJson.error;
          if (errJson?.details?.fieldErrors) {
            const msgs = Object.entries(errJson.details.fieldErrors)
              .flatMap(([field, errs]) => (errs as string[]).map((e) => `${field}: ${e}`))
              .join(", ");
            errMsg = msgs || errMsg;
          }
        } catch {}
        toast({ type: "error", title: errMsg });
        return;
      }
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Case created successfully" });
        router.push(`/lawyer/cases/${json.data.caseId}`);
      } else {
        // Show field-level validation errors
        if (json.details?.fieldErrors) {
          const msgs = Object.entries(json.details.fieldErrors)
            .flatMap(([field, errs]) => (errs as string[]).map((e) => `${field}: ${e}`))
            .join(", ");
          toast({ type: "error", title: msgs.slice(0, 200) || json.error || "Failed to create case" });
        } else {
          toast({ type: "error", title: json.error || "Failed to create case" });
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        toast({ type: "error", title: "Network error — check your connection" });
      } else if (msg.includes("JSON")) {
        toast({ type: "error", title: "Server returned an invalid response. Check console for details." });
      } else {
        toast({ type: "error", title: msg.slice(0, 200) || "Failed to create case" });
      }
      console.error("[NewCase] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Cancel
          </Link>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Step {step} of 3</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create New Case</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">File an infringement case on behalf of your client</p>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portrait Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portrait Title *</label>
                <input
                  type="text"
                  value={form.portraitTitle}
                  onChange={(e) => update("portraitTitle", e.target.value)}
                  placeholder="e.g., Acting Headshot Series A"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portrait ID (optional)</label>
                <input
                  type="text"
                  value={form.portraitId}
                  onChange={(e) => update("portraitId", e.target.value)}
                  placeholder="Leave empty for self-reported"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Infringement Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {INFRINGEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description * (min 20 chars)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the infringement in detail — where it was found, how it was discovered, what specific content is affected..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">{form.description.length} / 20 min</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detected URL (optional)</label>
                <input
                  type="url"
                  value={form.detectedUrl}
                  onChange={(e) => update("detectedUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Evidence URLs</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter one URL per line — screenshots, links to infringing content</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidence URLs * (one per line)</label>
                <textarea
                  value={form.evidenceUrls}
                  onChange={(e) => update("evidenceUrls", e.target.value)}
                  placeholder="https://example.com/infringing-content
https://example.com/screenshot-2"
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name (optional)</label>
                  <input
                    type="text"
                    value={form.reporterName}
                    onChange={(e) => update("reporterName", e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Email (optional)</label>
                  <input
                    type="email"
                    value={form.reporterEmail}
                    onChange={(e) => update("reporterEmail", e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Compensation (USD, optional)</label>
                <input
                  type="number"
                  value={form.compensation}
                  onChange={(e) => update("compensation", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Biometric Evidence (optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice Similarity Score (0–1)</label>
                    <input
                      type="number"
                      value={form.voiceSimilarityScore}
                      onChange={(e) => update("voiceSimilarityScore", e.target.value)}
                      placeholder="e.g., 0.847"
                      min="0"
                      max="1"
                      step="0.001"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice Risk Level</label>
                    <select
                      value={form.voiceSimilarityRisk}
                      onChange={(e) => update("voiceSimilarityRisk", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UNKNOWN">Unknown</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Face Comparison Score (0–1)</label>
                    <input
                      type="number"
                      value={form.faceComparisonScore}
                      onChange={(e) => update("faceComparisonScore", e.target.value)}
                      placeholder="e.g., 0.923"
                      min="0"
                      max="1"
                      step="0.001"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Face Image URL</label>
                    <input
                      type="url"
                      value={form.faceImageUrl}
                      onChange={(e) => update("faceImageUrl", e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Enter biometric scores from forensic analysis tools. Scores are stored in the evidence chain.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                ← Back
              </button>
            ) : <span />}
            {step < 3 ? (
              <button
                onClick={() => canProceed() && setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Submit Case"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}