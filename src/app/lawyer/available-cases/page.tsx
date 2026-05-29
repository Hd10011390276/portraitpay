"use client";
/**
 * /lawyer/available-cases — Browse and apply to represent validated infringement reports
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

interface AvailableReport {
  id: string;
  type: string;
  description: string;
  detectedUrl: string | null;
  evidenceUrls: string[];
  verifiedAt: string;
  portrait: { id: string; title: string; thumbnailUrl: string | null };
  reporter: { displayName: string; email: string };
}

export default function AvailableCasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState<AvailableReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, [search, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/infringements/available?${params}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setReports(json.data || []);
      }
    } catch {
      toast({ type: "error", title: "Failed to load available cases" });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (reportId: string) => {
    setApplying(reportId);
    try {
      const res = await fetch("/api/lawyers/cases/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reportId }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Case assigned! Redirecting..." });
        router.push(`/lawyer/cases/${json.data.caseId}`);
      } else {
        toast({ type: "error", title: json.error || "Failed to apply" });
        fetchReports(); // refresh list
      }
    } catch {
      toast({ type: "error", title: "Network error" });
    } finally {
      setApplying(null);
    }
  };

  const typeColors: Record<string, string> = {
    UNAUTHORIZED_USE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    DEEPFAKE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    EXPIRED_LICENSE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    SCOPE_VIOLATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    RESALE: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Cases</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {reports.length} case{reports.length !== 1 ? "s" : ""} waiting for legal representation
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by portrait title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[160px]"
          >
            <option value="all">All Types</option>
            <option value="UNAUTHORIZED_USE">Unauthorized Use</option>
            <option value="DEEPFAKE">Deepfake</option>
            <option value="EXPIRED_LICENSE">Expired License</option>
            <option value="SCOPE_VIOLATION">Scope Violation</option>
            <option value="RESALE">Resale</option>
          </select>
        </div>

        {/* Cases List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No available cases at the moment.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later or adjust your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {reports.map((report) => (
                <div key={report.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[report.type] || "bg-gray-100"}`}>
                          {report.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          Verified {new Date(report.verifiedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {report.portrait.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {report.description}
                      </p>
                      {report.detectedUrl && (
                        <a
                          href={report.detectedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-1 inline-block truncate max-w-[400px]"
                        >
                          {report.detectedUrl}
                        </a>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Reported by {report.reporter.displayName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApply(report.id)}
                      disabled={applying === report.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      {applying === report.id ? "Applying..." : "Apply to Represent"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}