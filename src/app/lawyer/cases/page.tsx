"use client";
/**
 * /lawyer/cases — Lawyer cases list page
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

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

export default function LawyerCasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/lawyers/cases")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j) => {
        if (j.success) setCases(j.data);
        else if (j.error === "Not an approved lawyer" || j.error === "Unauthorized") {
          router.replace("/lawyer/dashboard");
        } else {
          setError(j.error || "Failed to load");
        }
      })
      .catch(() => setError("Please sign in to view your cases"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (caseId: string) => {
    if (!confirm("Permanently delete this case and all associated records?")) return;
    setDeletingId(caseId);
    try {
      const res = await fetch(`/api/lawyers/cases/${caseId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setCases((prev) => prev.filter((c) => c.id !== caseId));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(caseId); return next; });
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cases.map((c) => c.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.size} selected cases and all associated records?`)) return;
    setBatchDeleting(true);
    try {
      const res = await fetch("/api/lawyers/cases/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (json.success) {
        setCases((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
      } else {
        alert(json.error || "Batch delete failed");
      }
    } catch (err: any) {
      alert(err.message || "Batch delete failed");
    } finally {
      setBatchDeleting(false);
    }
  };

  const isAllSelected = cases.length > 0 && selectedIds.size === cases.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Back to Lawyer Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Cases</h1>
          <Link
            href="/lawyer/cases/new"
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            + New Case
          </Link>
        </div>

        {/* Batch toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBatchDelete}
              disabled={batchDeleting}
              className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {batchDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 dark:text-red-400">{error}</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No cases yet</p>
            <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">Cases will appear here when assigned</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select all */}
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isAllSelected ? "Deselect all" : "Select all"} ({cases.length} cases)
              </span>
            </div>

            {cases.map((c: any) => (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100 dark:bg-gray-800"}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                      {c.platformConfirmed ? (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ Platform Confirmed</span>
                      ) : (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">⏳ Awaiting Platform Confirmation</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {c.infringementReport?.portrait?.title || "Infringement Case"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {c.infringementReport?.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>Compensation: ${Number(c.compensation || 0).toFixed(2)}</span>
                      <span>Lawyer Fee: ${Number(c.lawyerFee || 0).toFixed(2)}</span>
                      <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/lawyer/cases/${c.id}`}
                      className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === c.id ? "..." : "Del"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
