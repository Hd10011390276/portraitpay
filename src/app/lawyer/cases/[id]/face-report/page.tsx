"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

interface FaceReportData {
  caseId: string;
  portraitTitle: string;
  portraitId: string;
  portraitOwnerName: string;
  idCardImageUrl: string;
  registeredPortraitUrl: string;
  infringementImageUrl: string;
  similarityScore: number;
  confidenceInterval: { lower: number; upper: number };
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  provider: string;
  threshold: number;
  comparedAt: string;
  infringementReportId: string;
  infringementDescription: string;
  algorithmInfo: { name: string; version: string; embeddingDims: number; threshold: number };
}

export default function FaceReportPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [report, setReport] = useState<FaceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/lawyer/cases/${id}/face-report`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => { if (j.success) setReport(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/lawyer/export-evidence?caseId=${id}&type=face`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PortraitPay_FaceReport_${id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ type: "success", title: "Face report exported" });
    } catch {
      toast({ type: "error", title: "Export failed" });
    } finally {
      setExporting(false);
    }
  };

  if (!loading && !report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href={`/lawyer/cases/${id}`} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">‹ Back to Case</Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">No face verification data available for this case.</p>
          <Link href={`/lawyer/cases/${id}`} className="mt-4 inline-block text-sm text-blue-500 hover:underline">← Back to Case</Link>
        </div>
      </div>
    );
  }

  const score = report?.similarityScore ?? 0;
  const pct = (score * 100).toFixed(1);
  const ci = report?.confidenceInterval;
  const ciLower = ci ? (ci.lower * 100).toFixed(1) : "—";
  const ciUpper = ci ? (ci.upper * 100).toFixed(1) : "—";
  const risk = report?.riskLevel ?? "UNKNOWN";
  const threshold = report?.threshold ?? 0.80;

  const riskColors: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    UNKNOWN: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/lawyer/cases/${id}`} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">‹ Back to Case</Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facial Identity Verification</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Case #{id.slice(0, 8)} — Expert Technical Report</p>
          </div>
          <button onClick={handleExport} disabled={exporting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : (
          <>
            {/* Risk Badge */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${riskColors[risk]}`}>{risk} RISK</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Face Comparison Assessment</span>
              </div>

              {/* Score + CI Display */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">Similarity Score</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">({score.toFixed(4)})</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide">95% Confidence Interval</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{ciLower}% — {ciUpper}%</p>
                  <p className="text-xs text-gray-400 mt-1">Wilson score interval</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Threshold</p>
                  <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{(threshold * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-400 mt-1">min cosine similarity</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full relative">
                  <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" style={{ width: pct }} />
                  <div className="absolute top-0 h-full w-0.5 bg-red-500" style={{ left: `${threshold * 100}%` }} title={`Threshold ${(threshold * 100).toFixed(0)}%`} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Similarity</span><span className="text-red-500">Red line = threshold</span>
                </div>
              </div>
            </div>

            {/* Expert Conclusion */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
              <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-3">Expert Conclusion</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                Based on facial recognition analysis using {report?.algorithmInfo?.name || "face comparison"} (v{report?.algorithmInfo?.version || "—"}, {report?.algorithmInfo?.embeddingDims || 128}-dimensional embedding),
                the submitted image returns a similarity score of {pct}% (95% CI: {ciLower}%–{ciUpper}%, threshold: {(threshold * 100).toFixed(0)}%).
                This score {score >= threshold ? "exceeds" : "does not exceed"} the verification threshold,
                indicating a <strong>{risk}</strong> likelihood of facial identity match. The 95% confidence interval accounts for
                {score >= threshold ? " possible variation in the comparison algorithm and image quality factors." : " the inherent uncertainty in single-comparison biometric analysis."}
              </p>
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                  <strong>Disclaimer:</strong> This report is generated for reference purposes and should be reviewed
                  by a qualified forensic facial identification expert before use in legal proceedings.
                  PortraitPay AI makes no representation as to the accuracy or completeness of this analysis.
                </p>
              </div>
            </div>

            {/* Technical Parameters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Technical Parameters</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Algorithm", report?.algorithmInfo?.name || "—"],
                  ["Version", report?.algorithmInfo?.version || "—"],
                  ["Embedding Dims", String(report?.algorithmInfo?.embeddingDims || "—")],
                  ["Similarity Metric", "Cosine"],
                  ["Threshold", `${(threshold * 100).toFixed(0)}%`],
                  ["Provider", report?.provider || "—"],
                  ["Compared At", report?.comparedAt ? new Date(report.comparedAt).toLocaleString() : "—"],
                  ["Case ID", id.slice(0, 8)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Images */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Source Images</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Registered Portrait</p>
                  {report?.registeredPortraitUrl ? (
                    <img src={report.registeredPortraitUrl} alt="Registered portrait" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">ID Card Photo</p>
                  {report?.idCardImageUrl ? (
                    <img src={report.idCardImageUrl} alt="ID card" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Infringing Image</p>
                  {report?.infringementImageUrl ? (
                    <img src={report.infringementImageUrl} alt="Infringing content" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
              </div>
            </div>

            {/* Methodology */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Methodology</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Face verification is performed using cloud-based facial recognition APIs. The system extracts
                a 128-dimensional embedding from each facial image and computes cosine similarity. A similarity
                score of 80% (0.80 cosine similarity) or above indicates the same individual with high confidence.
                The 95% confidence interval is computed using the Wilson score interval method, accounting for
                the uncertainty inherent in single-comparison biometric analysis. The interval widens appropriately
                when only a single comparison is available (n=1), as is the case here.
              </p>
            </div>

            {/* Case Context */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Case Context</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Case ID</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">#{id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Portrait</span>
                  <span className="text-gray-700 dark:text-gray-300">{report?.portraitTitle || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Portrait Owner</span>
                  <span className="text-gray-700 dark:text-gray-300">{report?.portraitOwnerName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Description</span>
                  <span className="text-gray-700 dark:text-gray-300">{report?.infringementDescription || "—"}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}