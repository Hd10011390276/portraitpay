"use client";
/**
 * 管理员 - 侵权举报审核页面
 * /admin/infringements
 * 审核侵权举报
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

const BASE_STATUS_CONFIG: Record<string, { color: string }> = {
  PENDING_REVIEW: { color: "bg-yellow-100 text-yellow-800" },
  VALIDATED: { color: "bg-red-100 text-red-800" },
  REJECTED: { color: "bg-gray-100 text-gray-600" },
  SETTLED: { color: "bg-blue-100 text-blue-800" },
  LEGAL_ACTION: { color: "bg-purple-100 text-purple-800" },
};

function buildStatusConfig(ti: Record<string, string>) {
  return {
    PENDING_REVIEW: { label: ti.PENDING_REVIEW || "Pending Review", color: BASE_STATUS_CONFIG.PENDING_REVIEW.color },
    VALIDATED: { label: ti.VALIDATED || "Confirmed", color: BASE_STATUS_CONFIG.VALIDATED.color },
    REJECTED: { label: ti.REJECTED || "Rejected", color: BASE_STATUS_CONFIG.REJECTED.color },
    SETTLED: { label: ti.SETTLED || "Settled", color: BASE_STATUS_CONFIG.SETTLED.color },
    LEGAL_ACTION: { label: ti.LEGAL_ACTION || "Legal Action", color: BASE_STATUS_CONFIG.LEGAL_ACTION.color },
  };
}

function buildTypeConfig(ti: Record<string, string>) {
  return {
    UNAUTHORIZED_USE: ti.UNAUTHORIZED_USE || "Unauthorized Use",
    EXPIRED_LICENSE: ti.EXPIRED_LICENSE || "License Expired",
    SCOPE_VIOLATION: ti.SCOPE_VIOLATION || "Scope Violation",
    RESALE: ti.RESALE || "Resale",
    DEEPFAKE: ti.DEEPFAKE || "AI Deepfake",
  };
}

export default function AdminInfringementsPage() {
  const { t, locale } = useLanguage();
  const ti = t.infringements || {};
  const tc = t.infringements?.detail || {};
  const STATUS_CONFIG = buildStatusConfig(ti);
  const TYPE_CONFIG = buildTypeConfig(ti);

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING_REVIEW");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ decision: "VALIDATED", resolution: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchReports(); }, [filter]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, limit: "50" });
      const res = await fetch(`/api/infringements?${params}`);
      const json = await res.json();
      if (json.success) setReports(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(reportId: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/infringements/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedId(null);
        fetchReports();
      } else {
        alert(json.error ?? (tc.reviewFailed || "Review failed"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">← {tc.backToInfringements || "Back to Infringements"}</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tc.reportDetail || "Infringement Report Review"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {tc.pageSubtitle || "For platform admin / verifier only"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
          <button key={key}
            onClick={() => { setFilter(key); setSelectedId(null); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Report list */}
        <div className="col-span-2 space-y-3">
          {loading ? (
            <p className="text-center text-gray-500 py-10">{tc.loading || "Loading..."}</p>
          ) : reports.length === 0 ? (
            <div className="rounded-lg bg-white py-12 text-center text-gray-500 text-sm">
              {tc.noReports || "No pending reports"}
            </div>
          ) : (
            reports.map((r) => {
              const s = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? { label: r.status, color: "bg-gray-100" };
              return (
                <div key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`cursor-pointer rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md ${
                    selectedId === r.id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-gray-400">{r.source}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{r.portrait?.title}</p>
                  <p className="text-xs text-gray-500">{TYPE_CONFIG[r.type as keyof typeof TYPE_CONFIG] ?? r.type}</p>
                  <p className="mt-1 text-xs text-gray-400 truncate">{r.reporter?.displayName}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Detail + Review panel */}
        <div className="col-span-3">
          {selectedId ? (
            <ReportDetailPanel
              report={reports.find((r) => r.id === selectedId)}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              onSubmit={() => submitReview(selectedId)}
              submitting={submitting}
              tc={tc}
              locale={(tc as any).locale || "en-US"}
              TYPE_CONFIG={TYPE_CONFIG}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl bg-white p-12 text-gray-400 text-sm">
              {tc.clickToReview || "Click a report card on the left to view details and review"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportDetailPanel({
  report,
  reviewForm,
  setReviewForm,
  onSubmit,
  submitting,
  tc,
  locale,
  TYPE_CONFIG,
}: {
  report: any;
  reviewForm: { decision: string; resolution: string };
  setReviewForm: (f: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  tc: any;
  locale: string;
  TYPE_CONFIG: Record<string, string>;
}) {
  if (!report) return null;

  const canReview = report.status === "PENDING_REVIEW";

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{report.portrait?.title}</h2>
          <p className="text-sm text-gray-500">{tc.reportId || "Report ID"}：{report.id}</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(report.createdAt).toLocaleString(locale)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-gray-500">{tc.reporter || "Reporter"}</dt><dd className="font-medium">{report.reporter?.displayName}</dd></div>
        <div><dt className="text-gray-500">{tc.infringementType || "Type"}</dt><dd className="font-medium">{(tc[report.type as keyof typeof tc] || TYPE_CONFIG[report.type as keyof typeof TYPE_CONFIG]) ?? report.type}</dd></div>
        <div className="col-span-2"><dt className="text-gray-500">{tc.detectedUrl || "Detected URL"}</dt>
          <dd>{report.detectedUrl
            ? <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">{report.detectedUrl}</a>
            : "—"}</dd>
        </div>
        {report.similarityScore && (
          <div className="col-span-2"><dt className="text-gray-500">{tc.similarityScore || "Similarity Score"}</dt>
            <dd className="font-medium text-red-600">{(report.similarityScore * 100).toFixed(1)}%</dd>
          </div>
        )}
      </dl>

      <div>
        <h3 className="mb-1 text-sm font-medium text-gray-700">{tc.infringementDesc || "Description"}</h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.description}</p>
      </div>

      {report.evidenceUrls?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">{tc.evidenceScreenshots || "Evidence"}</h3>
          <div className="flex gap-2 overflow-x-auto">
            {report.evidenceUrls.map((url: string, i: number) => (
              <img key={i} src={url} alt={`${tc.evidence || "Evidence"} ${i + 1}`}
                className="h-24 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ))}
          </div>
        </div>
      )}

      {/* Review action (only if PENDING_REVIEW) */}
      {canReview && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">{tc.reviewAction || "Review Action"}</h3>
          <div className="flex gap-2">
            {[
              { d: "VALIDATED", label: tc.confirmInfringement || "Confirm Infringement" },
              { d: "REJECTED", label: tc.notEstablished || "Not Established" },
              { d: "SETTLED", label: tc.settled || "Settled" },
            ].map(({ d, label }) => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="decision" value={d}
                  checked={reviewForm.decision === d}
                  onChange={(e) => setReviewForm((f: any) => ({ ...f, decision: e.target.value }))}
                  className="h-4 w-4" />
                {label}
              </label>
            ))}
          </div>
          <textarea
            placeholder={tc.resolutionPlaceholder || "Enter resolution notes (optional)"}
            value={reviewForm.resolution}
            onChange={(e) => setReviewForm((f: any) => ({ ...f, resolution: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {submitting ? (tc.submitting || "Submitting...") : (tc.confirmReview || "Confirm Review")}
          </button>
        </div>
      )}

      {report.resolution && (
        <div className="border-t pt-4">
          <h3 className="mb-1 text-sm font-medium text-gray-700">{tc.resolutionOpinion || "Resolution"}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.resolution}</p>
        </div>
      )}
    </div>
  );
}