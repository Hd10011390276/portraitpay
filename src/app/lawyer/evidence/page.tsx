"use client";
/**
 * /lawyer/evidence — Lawyer evidence package export hub
 * Export court-admissible evidence PDFs with optional court info.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

interface LawyerCase {
  id: string;
  status: string;
  compensation: string;
  lawyerFee: string;
  createdAt: string;
  infringementReport?: {
    description?: string;
    portrait?: { title?: string };
    type?: string;
    reporter?: { displayName?: string; email?: string };
  };
}

interface CourtInfo {
  courtName: string;
  caseNumber: string;
  plaintiffName: string;
  defendantName: string;
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

export default function LawyerEvidencePage() {
  const { toast } = useToast();
  const [cases, setCases] = useState<LawyerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showCourtForm, setShowCourtForm] = useState<string | null>(null); // caseId of form to show
  const [courtInfo, setCourtInfo] = useState<CourtInfo>({
    courtName: "United States District Court",
    caseNumber: "",
    plaintiffName: "",
    defendantName: "",
  });

  useEffect(() => {
    fetch("/api/lawyers/cases", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setCases(j.data || []); })
      .catch(() => toast({ type: "error", title: "Failed to load cases" }))
      .finally(() => setLoading(false));
  }, []);

  const handleQuickExport = async (caseId: string) => {
    setExporting(caseId);
    try {
      const res = await fetch(`/api/lawyer/export-evidence?caseId=${caseId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      downloadBlob(res);
      toast({ type: "success", title: "Evidence package exported" });
    } catch {
      toast({ type: "error", title: "Export failed" });
    } finally {
      setExporting(null);
    }
  };

  const handleCourtExport = async (caseId: string) => {
    setExporting(caseId);
    try {
      const params = new URLSearchParams({ caseId });
      if (courtInfo.courtName) params.set("courtName", courtInfo.courtName);
      if (courtInfo.caseNumber) params.set("caseNumber", courtInfo.caseNumber);
      if (courtInfo.plaintiffName) params.set("plaintiffName", courtInfo.plaintiffName);
      if (courtInfo.defendantName) params.set("defendantName", courtInfo.defendantName);

      const res = await fetch(`/api/lawyer/export-evidence?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      downloadBlob(res);
      setShowCourtForm(null);
      toast({ type: "success", title: "Court-ready evidence package exported" });
    } catch {
      toast({ type: "error", title: "Export failed" });
    } finally {
      setExporting(null);
    }
  };

  const downloadBlob = async (res: Response) => {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?(.+?)"?$/);
    a.download = match?.[1] || `PortraitPay_Evidence_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evidence Packages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Export court-admissible evidence packages — formatted for U.S. federal and California courts
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-[#244169] text-white rounded-xl p-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="font-bold text-lg mb-1 text-white">Court-Ready Evidence Export</h2>
              <p className="text-sm text-blue-200 leading-relaxed max-w-2xl">
                Each package includes: Case Caption, Sworn Affidavit, Chain of Custody log with SHA-256 hashes,
                Technical Analysis Report (biometric data), Party Information, and numbered Exhibits.
                Compliant with Federal Rules of Evidence Art. VIII and California Evidence Code §§ 1400-1454.
              </p>
            </div>
          </div>
        </div>

        {/* Cases table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No cases yet.</p>
              <Link href="/lawyer/cases/new" className="mt-4 inline-block text-sm text-blue-500 hover:underline">
                Create your first case →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Case</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Created</th>
                  <th className="text-right px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {c.infringementReport?.portrait?.title || "Infringement Case"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{c.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400 text-xs">
                      {c.infringementReport?.type?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 dark:text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickExport(c.id)}
                          disabled={exporting === c.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {exporting === c.id && showCourtForm !== c.id ? "Exporting..." : "Quick Export"}
                        </button>
                        <button
                          onClick={() => {
                            setShowCourtForm(showCourtForm === c.id ? null : c.id);
                            setCourtInfo({
                              courtName: "United States District Court",
                              caseNumber: "",
                              plaintiffName: c.infringementReport?.reporter?.displayName || "",
                              defendantName: "",
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-[#244169] border border-[#244169]/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          {showCourtForm === c.id ? "Cancel" : "Court Export"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Court Info Form (expandable) */}
        {showCourtForm && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#244169]/30 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Court Information — Case #{showCourtForm.slice(0, 8)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the court details below. The evidence PDF will include a formal case caption page
              with plaintiff, defendant, court name, and case number.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Court Name</label>
                <input
                  type="text"
                  value={courtInfo.courtName}
                  onChange={(e) => setCourtInfo({ ...courtInfo, courtName: e.target.value })}
                  placeholder="United States District Court"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Number</label>
                <input
                  type="text"
                  value={courtInfo.caseNumber}
                  onChange={(e) => setCourtInfo({ ...courtInfo, caseNumber: e.target.value })}
                  placeholder="e.g., 2:25-cv-01234"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plaintiff Name</label>
                <input
                  type="text"
                  value={courtInfo.plaintiffName}
                  onChange={(e) => setCourtInfo({ ...courtInfo, plaintiffName: e.target.value })}
                  placeholder="Portrait rights holder"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Defendant Name</label>
                <input
                  type="text"
                  value={courtInfo.defendantName}
                  onChange={(e) => setCourtInfo({ ...courtInfo, defendantName: e.target.value })}
                  placeholder="Alleged infringer"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCourtForm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCourtExport(showCourtForm)}
                disabled={exporting === showCourtForm}
                className="px-6 py-2 text-sm font-bold text-white bg-[#244169] hover:bg-[#1a3354] rounded-lg transition-colors disabled:opacity-50"
              >
                {exporting === showCourtForm ? "Generating..." : "Generate Court-Ready PDF"}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <Link
            href="/lawyer/cases/new"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            + New Case
          </Link>
          <Link
            href="/lawyer/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Back to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
