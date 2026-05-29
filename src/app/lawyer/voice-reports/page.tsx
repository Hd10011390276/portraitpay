"use client";
/**
 * /lawyer/voice-reports — List of all cases with voice ID data
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface LawyerCase {
  id: string;
  status: string;
  createdAt: string;
  infringementReport?: {
    portrait?: { title?: string };
    type?: string;
  };
  infringementReportQuick?: {
    voiceSimilarityScore: number;
    voiceSimilarityRisk: string;
  };
}

export default function LawyerVoiceReportsPage() {
  const [cases, setCases] = useState<LawyerCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lawyers/cases", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const all = (j.data || []) as LawyerCase[];
          const withVoice = all.filter((c) => c.infringementReportQuick?.voiceSimilarityScore != null);
          setCases(withVoice);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const riskColors: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    UNKNOWN: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voice ID Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Expert voice verification reports for cases involving voice clone infringement
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Federal Court Standard:</strong> Each voice ID report includes ECAPA-TDNN 192-dimensional
            vector embeddings, cosine similarity scores, confidence intervals, and a clear verification conclusion
            — suitable for expert witness testimony.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No voice verification reports yet.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Voice ID reports are generated when a case involves voice clone infringement.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Case</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Similarity</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Risk</th>
                  <th className="text-right px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {cases.map((c) => {
                  const voice = c.infringementReportQuick;
                  const pct = ((voice?.voiceSimilarityScore || 0) * 100).toFixed(1);
                  const risk = voice?.voiceSimilarityRisk || "UNKNOWN";
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {c.infringementReport?.portrait?.title || "Voice Case"}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">#{c.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {c.infringementReport?.type?.replace("_", " ") || "VOICE_CLONE"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">{pct}%</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${riskColors[risk]}`}>
                          {risk}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/lawyer/cases/${c.id}/voice-report`}
                          className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}