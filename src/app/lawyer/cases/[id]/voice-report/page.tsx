"use client";
/**
 * /lawyer/cases/[id]/voice-report — Voice ID expert witness technical report
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

interface LawyerCase {
  id: string;
  status: string;
  createdAt: string;
  infringementReport?: {
    id: string;
    type: string;
    description: string;
    portrait?: { title: string };
    reporter?: { displayName: string; email: string };
  };
  infringementReportQuick?: {
    id: string;
    voiceSimilarityScore: number;
    voiceSimilarityRisk: string;
    voiceComparedAt: string;
    infringementType: string;
  };
}

export default function VoiceReportPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [lawyerCase, setLawyerCase] = useState<LawyerCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/lawyers/cases/${id}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => { if (j.success) setLawyerCase(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const voice = lawyerCase?.infringementReportQuick;
  if (!loading && (!voice || voice.voiceSimilarityScore == null)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href={`/lawyer/cases/${id}`} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              ‹ Back to Case
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">No voice verification data available for this case.</p>
          <Link href={`/lawyer/cases/${id}`} className="mt-4 inline-block text-sm text-blue-500 hover:underline">
            ← Back to Case
          </Link>
        </div>
      </div>
    );
  }

  const score = voice?.voiceSimilarityScore ?? 0;
  const pct = (score * 100).toFixed(1);
  const risk = voice?.voiceSimilarityRisk ?? "UNKNOWN";
  const riskColors: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    UNKNOWN: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/lawyer/export-evidence?caseId=${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PortraitPay_VoiceReport_${id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ type: "success", title: "Voice report exported" });
    } catch {
      toast({ type: "error", title: "Export failed" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/lawyer/cases/${id}`} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Back to Case
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voice ID Verification</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Case #{id.slice(0, 8)} — Expert Technical Report
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {/* Risk Badge */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${riskColors[risk]}`}>
                  {risk} RISK
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Voice Clone Assessment</span>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">Similarity Score</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">({score.toFixed(4)})</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Threshold</p>
                  <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">80%</p>
                  <p className="text-xs text-gray-400 mt-1">0.80 cosine similarity</p>
                </div>
              </div>

              {/* Technical Parameters */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Technical Parameters</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Model", "ECAPA-TDNN (x-vector)"],
                    ["Dimensions", "192"],
                    ["Similarity Metric", "Cosine"],
                    ["Threshold", "0.80"],
                    ["Compared At", voice?.voiceComparedAt ? new Date(voice.voiceComparedAt).toLocaleString() : "—"],
                    ["Report Type", voice?.infringementType || "VOICE_CLONE"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expert Conclusion */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
              <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3">Expert Conclusion</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                Based on acoustic analysis using ECAPA-TDNN voice verification (192-dimensional vector, cosine similarity),
                the submitted audio returns a similarity score of {score.toFixed(4)} (threshold: 0.80).
                This score {score >= 0.80 ? "exceeds" : "does not exceed"} the verification threshold,
                indicating {risk} likelihood of voice identity match.
              </p>
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                  <strong>Disclaimer:</strong> This report is generated for reference purposes and should be reviewed
                  by a qualified forensic audio expert before use in legal proceedings.
                  PortraitPay AI makes no representation as to the accuracy or completeness of this analysis.
                </p>
              </div>
            </div>

            {/* Methodology */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Methodology</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Voice verification is performed using ECAPA-TDNN (Emphasized Channel Attention, Probability
                Distribution and Delay) speaker embeddings. The system extracts 192-dimensional x-vector
                embeddings from the audio sample and computes cosine similarity against the registered
                voiceprint. A similarity score of 0.80 or above indicates the same speaker with high confidence.
              </p>
            </div>

            {/* Case Context */}
            {lawyerCase?.infringementReport && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Case Context</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Case ID</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">#{id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Portrait</span>
                    <span className="text-gray-700 dark:text-gray-300">{lawyerCase.infringementReport.portrait?.title || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reporter</span>
                    <span className="text-gray-700 dark:text-gray-300">{lawyerCase.infringementReport.reporter?.displayName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Violation Type</span>
                    <span className="text-gray-700 dark:text-gray-300">{lawyerCase.infringementReport.type || "VOICE_CLONE"}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}