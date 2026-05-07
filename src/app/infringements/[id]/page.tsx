"use client";
/**
 * Infringement Report Detail Page
 * Route: /infringements/[id]
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  VALIDATED: "bg-red-100 text-red-800",
  REJECTED: "bg-gray-100 text-gray-600",
  SETTLED: "bg-blue-100 text-blue-800",
  LEGAL_ACTION: "bg-purple-100 text-purple-800",
};

export default function InfringementDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noticeForm, setNoticeForm] = useState({
    type: "TAKEDOWN",
    recipientName: "",
    recipientEmail: "",
    platformAddress: "",
  });
  const [submittingNotice, setSubmittingNotice] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);

  const id = params.id as string;
  const ti = t.infringements || {};
  const tc = ti.detail || {};

  useEffect(() => {
    if (!id) return;
    fetch(`/api/infringements/${id}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setReport(j.data); })
      .finally(() => setLoading(false));
  }, [id]);

  async function sendNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeForm.recipientName) return;
    setSubmittingNotice(true);
    setNoticeError(null);
    setNoticeSuccess(null);
    try {
      const res = await fetch(`/api/infringements/${id}/notice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticeForm),
      });
      const json = await res.json();
      if (json.success) {
        setNoticeSuccess(tc.noticeGenerated);
        setNoticeForm({ type: "TAKEDOWN", recipientName: "", recipientEmail: "", platformAddress: "" });
      } else {
        setNoticeError(json.error || tc.generationFailed);
      }
    } catch {
      setNoticeError(tc.networkError);
    } finally {
      setSubmittingNotice(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">{tc.loading}</div>;
  if (!report) return <div className="p-10 text-center text-gray-500">{tc.notFound}</div>;

  const statusInfo = { label: ti[report.status] || report.status, color: STATUS_COLORS[report.status] || "bg-gray-100" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/infringements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ‹ {tc.backToInfringements}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Report Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {tc.reportDetail}
              </h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-gray-400">{tc.source}：{report.source}</span>
            </div>
            <p className="text-sm text-gray-500">
              {tc.reportId}：{report.id} &nbsp;|&nbsp;
              {tc.submitted}：{new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{tc.basicInfo}</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-gray-500">{tc.portraitInvolved}</dt><dd className="font-medium">{report.portrait?.title}</dd></div>
                <div><dt className="text-gray-500">{tc.infringementType}</dt><dd className="font-medium">{tc[report.type] || report.type}</dd></div>
                <div><dt className="text-gray-500">{tc.detectedUrl}</dt>
                  <dd className="font-medium">
                    {report.detectedUrl
                      ? <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{report.detectedUrl}</a>
                      : "—"}
                  </dd>
                </div>
                <div><dt className="text-gray-500">{tc.detectedAt}</dt><dd className="font-medium">{report.detectedAt ? new Date(report.detectedAt).toLocaleString() : "—"}</dd></div>
              </dl>
            </div>

            {/* Description */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.infringementDesc}</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Evidence */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.evidenceScreenshots}</h2>
              {report.evidenceUrls?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {report.evidenceUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`${tc.evidence || "Evidence"} ${i + 1}`}
                        className="w-full rounded-lg border border-gray-200 object-cover hover:opacity-80"
                        style={{ maxHeight: 200 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{tc.noScreenshots}</p>
              )}
              {report.evidenceHash && (
                <p className="mt-3 text-xs text-gray-400 break-all">
                  {tc.evidenceHash}：{report.evidenceHash}
                </p>
              )}
            </div>

            {/* Notices */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.sentNotices}</h2>
              {report.notices?.length > 0 ? (
                <div className="space-y-3">
                  {report.notices.map((notice: any) => (
                    <div key={notice.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">{notice.type} — {notice.status}</p>
                        <p className="text-xs text-gray-500">
                          {notice.sentAt ? `${tc.sentAt} ${new Date(notice.sentAt).toLocaleString()}` : tc.draft}
                          {notice.notarizationCert ? `${tc.notarizationCert}：${notice.notarizationCert}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{tc.noNotices}</p>
              )}
            </div>

            {/* Resolution */}
            {report.resolution && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.resolutionOpinion}</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.resolution}</p>
                {report.verifiedAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    {tc.reviewTime}：{new Date(report.verifiedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portrait card */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{tc.involvedPortrait}</h3>
              {report.portrait?.thumbnailUrl && (
                <img src={report.portrait.thumbnailUrl} alt={report.portrait.title}
                  className="mb-3 w-full rounded-lg object-cover" style={{ maxHeight: 160 }} />
              )}
              <p className="font-medium text-sm">{report.portrait?.title}</p>
              <Link href={`/portraits/${report.portrait?.id}`}
                className="mt-2 block text-xs text-blue-600 underline">
                {tc.viewPortraitDetail}
              </Link>
            </div>

            {/* Reporter info */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{tc.reporter}</h3>
              <p className="text-sm">{report.reporter?.displayName ?? "—"}</p>
              <p className="text-xs text-gray-500">{report.reporter?.email}</p>
            </div>

            {/* Send notice form */}
            {report.status === "VALIDATED" && (
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{tc.sendTakedownNotice}</h3>
                <form onSubmit={sendNotice} className="space-y-3">
                  <select value={noticeForm.type}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="TAKEDOWN">{tc.takedownNotice}</option>
                    <option value="WARNING">{tc.formalWarning}</option>
                    <option value="LEGAL">{tc.lawyerLetter}</option>
                  </select>
                  <input type="text" placeholder={tc.recipientNameLabel}
                    value={noticeForm.recipientName}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, recipientName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
                  <input type="email" placeholder={tc.recipientEmail}
                    value={noticeForm.recipientEmail}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <textarea placeholder={tc.recipientAddress}
                    value={noticeForm.platformAddress}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, platformAddress: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2} />
                  {noticeError && <p className="text-xs text-red-600">{noticeError}</p>}
                  {noticeSuccess && <p className="text-xs text-green-600">{noticeSuccess}</p>}
                  <button type="submit" disabled={submittingNotice || !noticeForm.recipientName}
                    className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300">
                    {submittingNotice ? tc.generating : tc.generateNotice}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}