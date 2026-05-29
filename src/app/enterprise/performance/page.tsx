/**
 * /enterprise/performance — Performance Approval Workflow
 * Draft → Submitted → Under Review → Approved/Rejected
 */
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

// ============================================================
// Types
// ============================================================

type ApplicationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

interface PerformanceApplication {
  id: string;
  eventName: string;
  eventDate: string | null;
  artistName: string | null;
  artistUserId: string | null;
  description: string | null;
  deadline: string | null;
  status: ApplicationStatus;
  reviewerId: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  agencyId: string;
}

interface NewApplicationForm {
  eventName: string;
  eventDate: string;
  artistName: string;
  description: string;
  deadline: string;
}

// ============================================================
// Status Config
// ============================================================

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; badge: string; textColor: string; borderColor: string }> = {
  DRAFT: {
    label: "Draft",
    color: "bg-gray-50 dark:bg-gray-800",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    textColor: "text-gray-600 dark:text-gray-300",
    borderColor: "border-gray-200 dark:border-gray-700",
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-blue-50 dark:bg-blue-900/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-amber-50 dark:bg-amber-900/20",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-50 dark:bg-green-900/20",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    textColor: "text-green-700 dark:text-green-300",
    borderColor: "border-green-200 dark:border-green-800",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-50 dark:bg-red-900/20",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-200 dark:bg-red-900/20",
  },
};

const ALL_STATUSES: ApplicationStatus[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];

// ============================================================
// Utility
// ============================================================

function isDeadlineSoon(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffDays = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 3;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================
// Application Card
// ============================================================

function ApplicationCard({
  app,
  onStatusChange,
  onDelete,
}: {
  app: PerformanceApplication;
  onStatusChange: (id: string, status: ApplicationStatus, reviewNotes?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  const td = t.performanceApproval || {};
  const cfg = STATUS_CONFIG[app.status];
  const isUrgent = isDeadlineSoon(app.deadline);
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const handleAction = async (status: ApplicationStatus, notes?: string) => {
    setLoading(true);
    try {
      await onStatusChange(app.id, status, notes);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border ${cfg.borderColor} ${cfg.color} p-4 transition-colors`}>
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{app.eventName}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${cfg.badge}`}>{cfg.label}</span>
            {isUrgent && app.status !== "APPROVED" && app.status !== "REJECTED" && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 font-medium">
                Deadline: {formatDate(app.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Applicant: </span>
          <span className="text-gray-700 dark:text-gray-200">{td.triumphAgency || "Triumph Agency"}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Artist: </span>
          <span className="text-gray-700 dark:text-gray-200">{app.artistName || "—"}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Event Date: </span>
          <span className="text-gray-700 dark:text-gray-200">{formatDate(app.eventDate)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Deadline: </span>
          <span className={`${isUrgent && app.status !== "APPROVED" && app.status !== "REJECTED" ? "text-red-600 font-medium" : "text-gray-700 dark:text-gray-200"}`}>
            {formatDate(app.deadline)}
          </span>
        </div>
      </div>

      {/* Description */}
      {app.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{app.description}</p>
      )}

      {/* Review Notes */}
      {app.reviewNotes && (
        <div className="mb-3 text-xs bg-gray-100 dark:bg-gray-800 rounded p-2">
          <span className="text-gray-500 dark:text-gray-400">Review Notes: </span>
          <span className="text-gray-700 dark:text-gray-200">{app.reviewNotes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {app.status === "DRAFT" && (
          <>
            <button
              onClick={() => handleAction("SUBMITTED")}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Submit for Approval"}
            </button>
            <button
              onClick={() => onDelete(app.id)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </>
        )}

        {app.status === "UNDER_REVIEW" && (
          <>
            <button
              onClick={() => handleAction("APPROVED")}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Approve"}
            </button>
            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 transition-colors"
              >
                Reject
              </button>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Rejection reason..."
                  className="w-full text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                  rows={2}
                />
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      if (!rejectNotes.trim()) return;
                      await handleAction("REJECTED", rejectNotes);
                      setShowRejectForm(false);
                    }}
                    disabled={loading || !rejectNotes.trim()}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectNotes("");
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// New Application Modal
// ============================================================

function NewApplicationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: NewApplicationForm) => Promise<void>;
}) {
  const [form, setForm] = useState<NewApplicationForm>({
    eventName: "",
    eventDate: "",
    artistName: "",
    description: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventName.trim()) {
      setError("Event name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Performance Application</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Event Name *</label>
            <input
              type="text"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              placeholder="e.g. Jay Chou Digital Concert"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Artist Name</label>
            <input
              type="text"
              value={form.artistName}
              onChange={(e) => setForm({ ...form, artistName: e.target.value })}
              placeholder="e.g. MJ Digital"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the performance event..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function PerformanceApprovalPage() {
  const { t } = useLanguage();
  const td = t.performanceApproval || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<PerformanceApplication[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/v1/agency/performance", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setApplications(data.applications || []);
      }
    } catch {
      // silently fail on refresh
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchApplications();
      setLoading(false);
    }
    init();
  }, []);

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const handleCreate = async (form: NewApplicationForm) => {
    const res = await fetch("/api/v1/agency/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error("Failed to create application");
    await fetchApplications();
    setShowModal(false);
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus, reviewNotes?: string) => {
    const res = await fetch(`/api/v1/agency/performance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, reviewNotes }),
    });
    if (!res.ok) throw new Error("Failed to update application");
    await fetchApplications();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    // API only supports PATCH for status changes, so we'll mark as DRAFT then delete via a custom approach
    // For now, use PATCH to set a deleted status — but since there's no delete endpoint,
    // we handle this by setting status to REJECTED with reviewNotes="deleted" as a soft delete
    await handleStatusChange(id, "REJECTED", "Deleted by applicant");
    await fetchApplications();
  };

  return (
    <DashboardShell>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Performance Approvals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Offline performance event approval workflow</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Application
            </button>
          </div>
        </div>

        {/* Status Kanban */}
        <div className="grid grid-cols-5 gap-3">
          {ALL_STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div
                key={status}
                className={`rounded-xl border ${cfg.borderColor} ${cfg.color} p-4 text-center`}
              >
                <div className={`text-2xl font-bold ${cfg.textColor}`}>{counts[status]}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{cfg.label}</div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Application Cards */}
        {!loading && applications.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-3">🎭</div>
            <p className="text-gray-500 dark:text-gray-400">No performance applications yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Create First Application
            </button>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        {!loading && applications.length > 0 && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              New Application
            </button>
            <button
              onClick={() => alert("Export report — feature coming soon")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Export Report
            </button>
            <button
              onClick={() => alert("History view — feature coming soon")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              View All History
            </button>
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {showModal && (
        <NewApplicationModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </DashboardShell>
  );
}