"use client";

/**
 * /admin/infringements/[id] — Admin Infringement Report Detail Page
 */
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface ReportDetail {
  id: string;
  status: string;
  type: string;
  description: string;
  detectedUrl?: string | null;
  evidenceUrls: string[];
  similarityScore?: number | null;
  resolution?: string | null;
  createdAt: string;
  reporter?: { id: string; displayName: string; email?: string | null };
  portrait?: {
    id: string;
    title: string;
    thumbnailUrl?: string | null;
    originalImageUrl?: string | null;
    ownerId: string;
  };
  lawyerCase?: {
    id: string;
    status: string;
    compensation: number | null;
    lawyerRegistration?: { companyName: string; contactName?: string | null };
  };
}

interface LawyerOption {
  id: string;
  companyName: string;
  region?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  VALIDATED: "bg-red-100 text-red-800",
  REJECTED: "bg-gray-100 text-gray-600",
  SETTLED: "bg-blue-100 text-blue-800",
  LEGAL_ACTION: "bg-purple-100 text-purple-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  VALIDATED: "Confirmed",
  REJECTED: "Rejected",
  SETTLED: "Settled",
  LEGAL_ACTION: "Legal Action",
};

export default function AdminInfringementDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState("");
  const [compensation, setCompensation] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [reviewForm, setReviewForm] = useState({ decision: "VALIDATED", resolution: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchReport();
    fetchLawyers();
  }, [id]);

  async function fetchReport() {
    try {
      const res = await fetch(`/api/infringements/${id}`);
      const json = await res.json();
      if (json.success) setReport(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchLawyers() {
    try {
      const res = await fetch("/api/admin/lawyers?status=APPROVED");
      const json = await res.json();
      if (json.success) {
        setLawyers(json.data.registrations.map((r: any) => ({
          id: r.id,
          companyName: r.companyName,
          region: r.region,
        })));
      }
    } catch {
      // ignore
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLawyer || !compensation) return;
    setAssigning(true);
    setAssignError("");
    setAssignSuccess(false);
    try {
      const res = await fetch("/api/lawyers/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          infringementReportId: id,
          lawyerRegistrationId: selectedLawyer,
          compensation: parseFloat(compensation),
        }),
      });
      const j = await res.json();
      if (j.success) {
        setAssignSuccess(true);
        fetchReport();
      } else {
        setAssignError(j.error || "Assignment failed");
      }
    } finally {
      setAssigning(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/infringements/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const json = await res.json();
      if (json.success) {
        fetchReport();
      } else {
        alert(json.error || "Review failed");
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Report not found</p>
          <Link href="/admin/infringements" className="text-blue-600 underline">← Back to Infringements</Link>
        </div>
      </div>
    );
  }

  const canReview = report.status === "PENDING_REVIEW";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/infringements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ← Back to Infringements
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Report header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[report.status] || "bg-gray-100"}`}>
              {STATUS_LABELS[report.status] || report.status}
            </span>
            {report.lawyerCase ? (
              <span className="text-xs text-green-600">✓ Lawyer assigned</span>
            ) : (
              <span className="text-xs text-yellow-600">⏳ Awaiting lawyer assignment</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Infringement Report #{report.id.slice(0, 8)}</h1>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Infringement Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2 text-gray-500">
              <span className="w-20 flex-shrink-0">Reporter:</span>
              <span className="text-gray-900">{report.reporter?.displayName || "—"}</span>
            </div>
            <div className="flex gap-2 text-gray-500">
              <span className="w-20 flex-shrink-0">Type:</span>
              <span className="text-gray-900">{report.type}</span>
            </div>
            <div className="flex gap-2 text-gray-500">
              <span className="w-20 flex-shrink-0">Description:</span>
              <span className="text-gray-900">{report.description || "—"}</span>
            </div>
            {report.detectedUrl && (
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">URL:</span>
                <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {report.detectedUrl}
                </a>
              </div>
            )}
            {report.similarityScore && (
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">Similarity:</span>
                <span className="text-red-600 font-medium">{(report.similarityScore * 100).toFixed(1)}%</span>
              </div>
            )}
            {report.evidenceUrls?.length > 0 && (
              <div className="flex gap-2 text-gray-500 items-start">
                <span className="w-20 flex-shrink-0">Evidence:</span>
                <div className="flex gap-2 flex-wrap">
                  {report.evidenceUrls.map((url: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Evidence ${i + 1}`}
                      className="h-20 rounded-lg border border-gray-200 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 text-gray-500">
              <span className="w-20 flex-shrink-0">Created:</span>
              <span className="text-gray-900">{new Date(report.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Portrait info */}
        {report.portrait && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Portrait</h2>
            <div className="flex items-center gap-4">
              {report.portrait.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.portrait.thumbnailUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
              )}
              <div>
                <p className="font-medium text-gray-900">{report.portrait.title}</p>
                <Link href={`/portraits/${report.portrait.id}`} className="text-sm text-blue-600 hover:underline">
                  View portrait →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Review form */}
        {canReview && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-t-4 border-blue-500">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Review Action</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div className="flex gap-4">
                {["VALIDATED", "REJECTED", "SETTLED"].map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value={d}
                      checked={reviewForm.decision === d}
                      onChange={(e) => setReviewForm((f) => ({ ...f, decision: e.target.value }))}
                      className="h-4 w-4"
                    />
                    {STATUS_LABELS[d] || d}
                  </label>
                ))}
              </div>
              <textarea
                placeholder="Enter resolution notes (optional)"
                value={reviewForm.resolution}
                onChange={(e) => setReviewForm((f) => ({ ...f, resolution: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        )}

        {/* Resolution */}
        {report.resolution && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Resolution</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.resolution}</p>
          </div>
        )}

        {/* Lawyer assignment — only when VALIDATED */}
        {report.status === "VALIDATED" && !report.lawyerCase && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-t-4 border-purple-500">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Assign Lawyer</h2>
            <form onSubmit={handleAssign} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Select Lawyer</label>
                <select
                  value={selectedLawyer}
                  onChange={(e) => setSelectedLawyer(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">— Select —</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName}{l.region ? ` (${l.region})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Compensation (USD)</label>
                <input
                  type="number"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {assignError && <p className="text-sm text-red-500">{assignError}</p>}
              {assignSuccess && <p className="text-sm text-green-600">Lawyer assigned successfully!</p>}
              <button
                type="submit"
                disabled={assigning || !selectedLawyer || !compensation}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
              >
                {assigning ? "Assigning..." : "Assign Lawyer"}
              </button>
            </form>
          </div>
        )}

        {/* Existing lawyer case */}
        {report.lawyerCase && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Assigned Lawyer</h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">Law Firm:</span>
                  <span className="text-gray-900">{report.lawyerCase.lawyerRegistration?.companyName || "—"}</span>
                </div>
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">Contact:</span>
                  <span className="text-gray-900">{report.lawyerCase.lawyerRegistration?.contactName || "—"}</span>
                </div>
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">Status:</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    report.lawyerCase.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                    report.lawyerCase.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    report.lawyerCase.status === "WON" ? "bg-green-100 text-green-800" :
                    report.lawyerCase.status === "LOST" ? "bg-red-100 text-red-800" :
                    report.lawyerCase.status === "CLOSED" ? "bg-gray-100 text-gray-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {report.lawyerCase.status}
                  </span>
                </div>
                {report.lawyerCase.compensation && (
                  <div className="flex gap-2 text-gray-500">
                    <span className="w-20 flex-shrink-0">Compensation:</span>
                    <span className="text-gray-900">${Number(report.lawyerCase.compensation).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href={`/lawyer/cases/${report.lawyerCase.id}`}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                View Lawyer Case →
              </Link>
            </div>
          </>
        )}

        {/* Meta */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Report ID: {report.id}</p>
          <p>Created: {new Date(report.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}