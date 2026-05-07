/**
 * /lawyer/dashboard - Enhanced lawyer dashboard with real case fetching
 */
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface Case {
  id: string;
  plaintiffName: string;
  defendantName: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  description: string;
}

interface LawyerCase {
  id: string;
  status: string;
  createdAt: string;
  infringementReport?: {
    id: string;
    description?: string;
    reporter?: {
      displayName?: string;
      email?: string;
    };
    targetUrl?: string;
  };
}

function StatCard({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color }}>{value}{suffix ?? ""}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    PENDING: { label: "", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    IN_PROGRESS: { label: "", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    RESOLVED: { label: "", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    REJECTED: { label: "", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  };
  const c = config[status] || { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${c.color}`}>{c.label}</span>
  );
}

function getStatusLabel(status: string, t: any): string {
  const map: Record<string, string> = {
    PENDING: t.lawyerDashboard?.statusPending || "Pending",
    IN_PROGRESS: t.lawyerDashboard?.statusInProgress || "In Progress",
    RESOLVED: t.lawyerDashboard?.statusResolved || "Resolved",
    REJECTED: t.lawyerDashboard?.statusRejected || "Rejected",
  };
  return map[status] || status;
}

export default function LawyerDashboard() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const [cases, setCases] = useState<LawyerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const td = t.lawyerDashboard || {};

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch("/api/lawyers/cases");
        const json = await res.json();
        if (json.success) {
          setCases(json.data || []);
        } else {
          setError(json.error || td.loadFailed || "Failed to load cases");
        }
      } catch {
        setError(td.loadFailed);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [isZh, td.loadFailed]);

  const pendingCount = cases.filter((c) => c.status === "PENDING").length;
  const inProgressCount = cases.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = cases.filter((c) => c.status === "RESOLVED").length;

  return (
    <DashboardShell
      title={td.title || "Lawyer Dashboard"}
      subtitle={td.subtitle || "Manage your portrait rights protection cases"}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label={td.pendingCases || "Pending Cases"}
          value={pendingCount}
          color="#f59e0b"
        />
        <StatCard
          label={td.inProgressCases || "In Progress"}
          value={inProgressCount}
          color="#3b82f6"
        />
        <StatCard
          label={td.resolvedCases || "Resolved"}
          value={resolvedCount}
          color="#22c55e"
        />
        <StatCard
          label={td.earnings || "Earnings"}
          value={0}
          color="#7c3aed"
          suffix=" USD"
        />
        <StatCard
          label={td.totalCases || "Total Cases"}
          value={cases.length}
          color="#1e293b"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <a
          href="/lawyer/cases"
          className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{td.allCases || "All Cases"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{cases.length} {td.casesCount || "cases"}</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          href="/report"
          className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{td.infringementReports || "Infringement Reports"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{td.viewInfringementReports || "View submitted reports"}</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a
          href="/lawyer/apply"
          className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{td.myProfile || "My Profile"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{td.viewProfile || "View lawyer profile"}</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Cases list */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {td.caseList || "Cases List"}
          </h2>
          <span className="text-xs text-gray-400">{cases.length} {td.casesCount || "cases"}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{td.loading || "Loading..."}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              {td.retry || "Retry"}
            </button>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{td.noCasesYet || "No cases yet"}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              {td.noCasesDesc || "Cases will appear here when users submit infringement reports and select you as their assigned lawyer."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {cases.map((c) => (
              <div key={c.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">#{c.id.slice(0, 8)}</span>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        c.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        c.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        c.status === "RESOLVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {getStatusLabel(c.status, t)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                      {c.infringementReport?.description || td.noDescription || "No description"}
                    </p>
                    {c.infringementReport?.targetUrl && (
                      <a
                        href={c.infringementReport.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {c.infringementReport.targetUrl.slice(0, 50)}...
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(c.createdAt).toLocaleDateString(locale, { timeZone: "Asia/Shanghai" })}
                      {c.infringementReport?.reporter?.displayName && (
                        <span> · {c.infringementReport.reporter.displayName}</span>
                      )}
                    </p>
                  </div>
                  <a
                    href={`/lawyer/cases/${c.id}`}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    {td.view || "View"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}