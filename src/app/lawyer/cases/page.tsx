"use client";
/**
 * /lawyer/cases — Lawyer cases list page
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  CLOSED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-gray-100 text-gray-500",
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
  const { t } = useLanguage();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/lawyers/cases")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCases(j.data);
        else setError(j.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ‹ Back to Lawyer Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lawyer Cases</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No cases yet</p>
            <p className="text-sm text-gray-400 mt-1">Cases will appear here when assigned</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((c: any) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                      {c.platformConfirmed ? (
                        <span className="text-xs text-green-600">✓ Platform Confirmed</span>
                      ) : (
                        <span className="text-xs text-yellow-600">⏳ Awaiting Platform Confirmation</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 mb-1">
                      {c.infringementReport?.portrait?.title || "Infringement Case"}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {c.infringementReport?.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Compensation: ${Number(c.compensation || 0).toFixed(2)}</span>
                      <span>Lawyer Fee: ${Number(c.lawyerFee || 0).toFixed(2)}</span>
                      <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link
                    href={`/lawyer/cases/${c.id}`}
                    className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}