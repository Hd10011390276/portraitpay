"use client";
/**
 * /lawyer/dashboard — Lawyer workbench
 * Primary action: Export court-ready evidence packages.
 * Secondary: Case management, quick stats.
 */
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  WON: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  REJECTED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  WON: "Won",
  LOST: "Lost",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

const SOURCE_LABELS: Record<string, string> = {
  LAWYER_SELF_REPORTED: "Self-Reported",
  MANUAL: "Client Report",
  AUTO: "Auto-Detected",
};

interface LawyerCase {
  id: string;
  status: string;
  createdAt: string;
  compensation?: number;
  lawyerFee?: number;
  infringementReport?: {
    description?: string;
    source?: string;
    reporter?: { displayName?: string; email?: string };
    portrait?: { title?: string };
  };
}

export default function LawyerDashboard() {
  const router = useRouter();
  const [cases, setCases] = useState<LawyerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lawyers/cases", { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(`Server error (${r.status})`); return r.json(); })
      .then((j) => { if (j.success) setCases(j.data); else setError(j.error || "Failed to load cases"); })
      .catch((err) => setError(err.message || "Network error — please try again"))
      .finally(() => setLoading(false));
  }, []);

  // Active = IN_PROGRESS or PENDING (cases the lawyer needs to act on)
  const activeCases = cases.filter((c) => c.status === "IN_PROGRESS" || c.status === "PENDING");
  const wonCases = cases.filter((c) => c.status === "WON");
  const totalPotentialCompensation = activeCases.reduce((s, c) => s + Number(c.compensation || 0), 0);
  const totalWonCompensation = wonCases.reduce((s, c) => s + Number(c.compensation || 0), 0);

  const handleExport = async (caseId: string) => {
    setExportingId(caseId);
    try {
      const res = await fetch(`/api/lawyer/export-evidence?caseId=${caseId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      a.download = match?.[1] || "PortraitPay_Evidence.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Export failed");
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (caseId: string) => {
    if (!confirm("Permanently delete this case and all associated records?")) return;
    setDeletingId(caseId);
    try {
      const res = await fetch(`/api/lawyers/cases/${caseId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardShell
      title="Lawyer Workbench"
      subtitle="Evidence Export & Case Management"
    >
      {/* Hero: Evidence Export */}
      <div className="bg-gradient-to-r from-[#244169] to-[#1a3354] rounded-xl p-6 sm:p-8 mb-6 text-white">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Export Court-Ready Evidence Package</h1>
            <p className="text-blue-200 text-sm max-w-lg leading-relaxed">
              Generate a structured evidence PDF with case caption, affidavit, chain of custody,
              technical analysis report, and exhibits — formatted for U.S. federal and California courts.
              Each package includes a SHA-256 record hash and IPFS-based verification.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/lawyer/cases/new"
              className="px-5 py-2.5 text-sm font-medium text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl transition-colors"
            >
              + New Case
            </Link>
            <Link
              href="/lawyer/evidence"
              className="px-5 py-2.5 text-sm font-bold bg-white text-[#244169] hover:bg-blue-50 rounded-xl transition-colors"
            >
              Export Evidence
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Cases</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeCases.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Needs action</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Won / Settled</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{wonCases.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">${totalWonCompensation.toFixed(0)} recovered</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Potential Recovery</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">${totalPotentialCompensation.toFixed(0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">From active cases</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Cases</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{cases.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">All time</p>
        </div>
      </div>

      {/* Active Cases List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Active Cases ({activeCases.length})
          </h2>
          <div className="flex items-center gap-3">
            <Link href="/lawyer/available-cases" className="text-xs text-blue-500 hover:text-blue-600 font-medium">
              Browse Available Cases →
            </Link>
            <Link href="/lawyer/cases" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium">
              View All →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-400 mt-3">Loading cases...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : activeCases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No active cases</p>
              <p className="text-xs text-gray-400 mt-1">
                Create a new case or browse available cases to get started.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Link
                  href="/lawyer/cases/new"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Create New Case
                </Link>
                <Link
                  href="/lawyer/available-cases"
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Browse Available
                </Link>
              </div>
            </div>
          ) : (
            activeCases.map((c) => (
              <div key={c.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                      {c.infringementReport?.source && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                          {SOURCE_LABELS[c.infringementReport.source] || c.infringementReport.source}
                        </span>
                      )}
                      <span className="text-xs font-mono text-gray-400">#{c.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {c.infringementReport?.portrait?.title || "Infringement Case"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {c.infringementReport?.reporter?.displayName || "Self-reported"}
                      {" · "}{new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ${Number(c.compensation || 0).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-400">comp.</p>
                    </div>
                    <button
                      onClick={() => handleExport(c.id)}
                      disabled={exportingId === c.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#244169] hover:bg-[#1a3354] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {exportingId === c.id ? "Exporting..." : "Export"}
                    </button>
                    <Link
                      href={`/lawyer/cases/${c.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === c.id ? "..." : "Del"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Cases", href: "/lawyer/cases", desc: "All assigned cases" },
          { label: "Case Discovery", href: "/lawyer/available-cases", desc: "Browse & apply" },
          { label: "Evidence Hub", href: "/lawyer/evidence", desc: "Export packages" },
          { label: "Voice Reports", href: "/lawyer/voice-reports", desc: "Biometric data" },
          { label: "Clients", href: "/lawyer/clients", desc: "Client directory" },
          { label: "Earnings", href: "/lawyer/earnings", desc: "Fees & payouts" },
          { label: "Inbox", href: "/inbox", desc: "Messages" },
          { label: "API Keys", href: "/lawyer/api-keys", desc: "Agent integration" },
          { label: "Settings", href: "/settings", desc: "Account & profile" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">{link.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
