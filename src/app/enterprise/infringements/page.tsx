/**
 * /enterprise/infringements - Full Infringement Alerts List
 * "use client"
 */
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

// ============================================================
// Types
// ============================================================
type AlertStatus = "PENDING" | "CONFIRMED" | "RESOLVED";

interface InfringementAlert {
  id: string;
  sourceName: string;
  sourceUrl: string;
  description: string;
  status: AlertStatus;
  createdAt: string;
  evidenceUrl?: string;
  screenshotUrl?: string;
}

// ============================================================
// Status Badge
// ============================================================
function StatusBadge({ status }: { status: AlertStatus }) {
  const config: Record<AlertStatus, { label: string; className: string }> = {
    PENDING: {
      label: "PENDING",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    CONFIRMED: {
      label: "CONFIRMED",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    RESOLVED: {
      label: "RESOLVED",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
  };
  const { label, className } = config[status] || config.PENDING;
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${className}`}>
      {label}
    </span>
  );
}

// ============================================================
// Detail Modal
// ============================================================
function DetailModal({ alert, onClose, onMarkResolved }: { alert: InfringementAlert; onClose: () => void; onMarkResolved: (id: string) => void }) {
  const { t } = useLanguage();
  const td = t.infringements || {};

  const [takedownLoading, setTakedownLoading] = useState(false);
  const [takedownDone, setTakedownDone] = useState(false);

  async function handleTakedown() {
    setTakedownLoading(true);
    try {
      const res = await fetch(`/api/v1/agency/alerts/${alert.id}/takedown`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) setTakedownDone(true);
    } finally {
      setTakedownLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Infringement Detail</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status + Source */}
          <div className="flex items-center justify-between">
            <StatusBadge status={alert.status} />
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 truncate max-w-[200px]"
            >
              {alert.sourceUrl}
            </a>
          </div>

          {/* Source Name */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{td.source || "Source"}</div>
            <div className="text-gray-900 dark:text-white font-medium">{alert.sourceName}</div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{td.description || "Description"}</div>
            <div className="text-gray-900 dark:text-white">{alert.description}</div>
          </div>

          {/* Date */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{td.reportedOn || "Reported On"}</div>
            <div className="text-gray-900 dark:text-white">
              {new Date(alert.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          {/* Evidence URL */}
          {alert.evidenceUrl && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{td.evidence || "Evidence"}</div>
              <a
                href={alert.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 break-all"
              >
                {alert.evidenceUrl}
              </a>
            </div>
          )}

          {/* Screenshot Preview */}
          {alert.screenshotUrl && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{td.screenshot || "Screenshot"}</div>
              <img
                src={alert.screenshotUrl}
                alt="Evidence screenshot"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
          <button
            onClick={handleTakedown}
            disabled={takedownLoading || takedownDone || alert.status === "RESOLVED"}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {takedownDone ? "Takedown Requested" : takedownLoading ? "Sending..." : "Request Takedown"}
          </button>

          <button
            onClick={() => window.open(`mailto:?subject=Infringement Report - ${alert.sourceName}&body=Source: ${alert.sourceUrl}%0ADescription: ${alert.description}`)}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Contact Lawyer
          </button>

          <button
            onClick={() => { onMarkResolved(alert.id); onClose(); }}
            disabled={alert.status === "RESOLVED"}
            className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
function EmptyState() {
  const { t } = useLanguage();
  const td = t.infringements || {};
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="text-5xl mb-4">&#128269;</div>
      <p className="text-gray-500 dark:text-gray-400">{td.noAlerts || "No infringement alerts found"}</p>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function InfringementsPage() {
  const { t } = useLanguage();
  const td = t.infringements || {};

  const [alerts, setAlerts] = useState<InfringementAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<InfringementAlert | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState<string>("All");

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/v1/agency/alerts", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        } else {
          setError("Failed to load alerts");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  // Derived filter options
  const sourceOptions = ["All", ...Array.from(new Set(alerts.map((a: InfringementAlert) => {
    try {
      const u = new URL(a.sourceUrl);
      return u.hostname.replace("www.", "");
    } catch {
      return a.sourceUrl;
    }
  })))];

  // Filter logic
  const filtered = alerts.filter((alert: InfringementAlert) => {
    if (statusFilter !== "All" && alert.status !== statusFilter) return false;

    if (sourceFilter !== "All") {
      try {
        const u = new URL(alert.sourceUrl);
        const host = u.hostname.replace("www.", "");
        if (host !== sourceFilter) return false;
      } catch {
        if (alert.sourceUrl !== sourceFilter) return false;
      }
    }

    if (dateRange !== "All") {
      const d = new Date(alert.createdAt);
      const now = new Date();
      if (dateRange === "7d") {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (d < cutoff) return false;
      } else if (dateRange === "30d") {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (d < cutoff) return false;
      } else if (dateRange === "90d") {
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (d < cutoff) return false;
      }
    }

    return true;
  });

  async function markResolved(id: string) {
    try {
      const res = await fetch(`/api/v1/agency/alerts/${id}/resolve`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setAlerts((prev: InfringementAlert[]) =>
          prev.map((a: InfringementAlert) => a.id === id ? { ...a, status: "RESOLVED" } : a)
        );
      }
    } catch {
      // silent fail
    }
  }

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {td.title || "Infringement Alerts"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {td.subtitle || "Monitor and manage intellectual property infringement reports"}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">{td.status || "Status"}:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">{td.all || "All Status"}</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">{td.source || "Source"}:</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sourceOptions.map((src: string) => (
                <option key={src} value={src}>{src === "All" ? td.allSources || "All Sources" : src}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">{td.dateRange || "Date Range"}:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">{td.allTime || "All Time"}</option>
              <option value="7d">{td.last7Days || "Last 7 Days"}</option>
              <option value="30d">{td.last30Days || "Last 30 Days"}</option>
              <option value="90d">{td.last90Days || "Last 90 Days"}</option>
            </select>
          </div>

          {/* Result count */}
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} {filtered.length === 1 ? "alert" : "alerts"}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i: number) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          /* Alert List */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((alert: InfringementAlert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <StatusBadge status={alert.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {alert.sourceName}
                    </div>
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 truncate block"
                    >
                      {alert.sourceUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                      {alert.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600 text-lg">&raquo;</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedAlert && (
        <DetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onMarkResolved={markResolved}
        />
      )}
    </DashboardShell>
  );
}