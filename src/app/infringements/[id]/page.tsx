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

const STATUS_CONFIG_EN: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
  VALIDATED:       { label: "Infringement Confirmed", color: "bg-red-100 text-red-800" },
  REJECTED:        { label: "Report Rejected", color: "bg-gray-100 text-gray-600" },
  SETTLED:         { label: "Settled", color: "bg-blue-100 text-blue-800" },
  LEGAL_ACTION:     { label: "Legal Action", color: "bg-purple-100 text-purple-800" },
};

const STATUS_CONFIG_ZH: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  VALIDATED:       { label: "已确认侵权", color: "bg-red-100 text-red-800" },
  REJECTED:       { label: "举报不成立", color: "bg-gray-100 text-gray-600" },
  SETTLED:        { label: "已和解", color: "bg-blue-100 text-blue-800" },
  LEGAL_ACTION:   { label: "法律程序中", color: "bg-purple-100 text-purple-800" },
};

const TYPE_CONFIG_EN: Record<string, string> = {
  UNAUTHORIZED_USE: "Unauthorized Use",
  EXPIRED_LICENSE: "License Expired",
  SCOPE_VIOLATION: "Scope Violation",
  RESALE: "Resale/Transfer",
  DEEPFAKE: "AI Deepfake",
};

const TYPE_CONFIG_ZH: Record<string, string> = {
  UNAUTHORIZED_USE: "未经授权使用",
  EXPIRED_LICENSE: "授权已过期",
  SCOPE_VIOLATION: "超范围使用",
  RESALE: "二次转售",
  DEEPFAKE: "AI换脸/深度合成",
};

export default function InfringementDetailPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
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

  const STATUS_CONFIG = isZh ? STATUS_CONFIG_ZH : STATUS_CONFIG_EN;
  const TYPE_CONFIG = isZh ? TYPE_CONFIG_ZH : TYPE_CONFIG_EN;

  const tc = t.infringements?.detail || {};

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
        setNoticeSuccess(tc.noticeGenerated || (isZh ? "通知已生成！状态：DRAFT（请前往邮件系统发送）" : "Notice generated! Status: DRAFT (please send from your email system)"));
        setNoticeForm({ type: "TAKEDOWN", recipientName: "", recipientEmail: "", platformAddress: "" });
      } else {
        setNoticeError(json.error || (isZh ? "生成失败" : "Generation failed"));
      }
    } catch {
      setNoticeError(tc.networkError || (isZh ? "网络错误" : "Network error"));
    } finally {
      setSubmittingNotice(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">{tc.loading || (isZh ? "加载中..." : "Loading...")}</div>;
  if (!report) return <div className="p-10 text-center text-gray-500">{tc.notFound || (isZh ? "举报不存在" : "Report not found")}</div>;

  const statusInfo = STATUS_CONFIG[report.status] ?? { label: report.status, color: "bg-gray-100" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/infringements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ‹ {tc.backToInfringements || (isZh ? "返回侵权管理" : "Back to Infringements")}
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
                {tc.reportDetail || (isZh ? "侵权举报详情" : "Infringement Report Detail")}
              </h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-gray-400">{tc.source || (isZh ? "来源" : "Source")}：{report.source}</span>
            </div>
            <p className="text-sm text-gray-500">
              {tc.reportId || (isZh ? "举报编号" : "Report ID")}：{report.id} &nbsp;|&nbsp;
              {tc.submitTime || (isZh ? "提交时间" : "Submitted")}：{new Date(report.createdAt).toLocaleString(isZh ? "zh-CN" : "en-US")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{tc.basicInfo || (isZh ? "基本信息" : "Basic Information")}</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-gray-500">{tc.portraitInvolved || (isZh ? "涉及肖像" : "Portrait Involved")}</dt><dd className="font-medium">{report.portrait?.title}</dd></div>
                <div><dt className="text-gray-500">{tc.infringementType || (isZh ? "侵权类型" : "Infringement Type")}</dt><dd className="font-medium">{TYPE_CONFIG[report.type] ?? report.type}</dd></div>
                <div><dt className="text-gray-500">{tc.detectedUrl || (isZh ? "发现侵权链接" : "Detected URL")}
                  <dd className="font-medium">
                    {report.detectedUrl
                      ? <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{report.detectedUrl}</a>
                      : "—"}
                  </dd>
                </div>
                <div><dt className="text-gray-500">{tc.detectedAt || (isZh ? "发现时间" : "Detection Time")}</dt><dd className="font-medium">{report.detectedAt ? new Date(report.detectedAt).toLocaleString(isZh ? "zh-CN" : "en-US") : "—"}</dd></div>
              </dl>
            </div>

            {/* Description */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.infringementDesc || (isZh ? "侵权描述" : "Infringement Description")}</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Evidence */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.evidenceScreenshots || (isZh ? "证据截图" : "Evidence Screenshots")}</h2>
              {report.evidenceUrls?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {report.evidenceUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`${tc.evidence || (isZh ? "证据" : "Evidence")} ${i + 1}`}
                        className="w-full rounded-lg border border-gray-200 object-cover hover:opacity-80"
                        style={{ maxHeight: 200 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{tc.noScreenshots || (isZh ? "暂无截图" : "No screenshots")}</p>
              )}
              {report.evidenceHash && (
                <p className="mt-3 text-xs text-gray-400 break-all">
                  {tc.evidenceHash || (isZh ? "证据哈希（SHA-256）" : "Evidence Hash (SHA-256)")}：{report.evidenceHash}
                </p>
              )}
            </div>

            {/* Notices */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.sentNotices || (isZh ? "发出的通知" : "Sent Notices")}</h2>
              {report.notices?.length > 0 ? (
                <div className="space-y-3">
                  {report.notices.map((notice: any) => (
                    <div key={notice.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">{notice.type} — {notice.status}</p>
                        <p className="text-xs text-gray-500">
                          {notice.sentAt ? `${tc.sentAt || (isZh ? "发送于" : "Sent at")} ${new Date(notice.sentAt).toLocaleString(isZh ? "zh-CN" : "en-US")}` : (tc.draft || (isZh ? "草稿" : "Draft"))}
                          {notice.notarizationCert ? `${tc.notarizationCert || (isZh ? " | 公证编号" : " | Notarization #")}：${notice.notarizationCert}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{tc.noNotices || (isZh ? "暂无发出的通知" : "No sent notices")}</p>
              )}
            </div>

            {/* Resolution */}
            {report.resolution && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">{tc.resolutionOpinion || (isZh ? "处理意见" : "Resolution Opinion")}</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.resolution}</p>
                {report.verifiedAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    {tc.reviewTime || (isZh ? "审核时间" : "Review Time")}：{new Date(report.verifiedAt).toLocaleString(isZh ? "zh-CN" : "en-US")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portrait card */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{tc.involvedPortrait || (isZh ? "涉案肖像" : "Involved Portrait")}</h3>
              {report.portrait?.thumbnailUrl && (
                <img src={report.portrait.thumbnailUrl} alt={report.portrait.title}
                  className="mb-3 w-full rounded-lg object-cover" style={{ maxHeight: 160 }} />
              )}
              <p className="font-medium text-sm">{report.portrait?.title}</p>
              <Link href={`/portraits/${report.portrait?.id}`}
                className="mt-2 block text-xs text-blue-600 underline">
                {tc.viewPortraitDetail || (isZh ? "查看肖像详情" : "View Portrait Detail")}
              </Link>
            </div>

            {/* Reporter info */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{tc.reporter || (isZh ? "举报人" : "Reporter")}</h3>
              <p className="text-sm">{report.reporter?.displayName ?? "—"}</p>
              <p className="text-xs text-gray-500">{report.reporter?.email}</p>
            </div>

            {/* Send notice form */}
            {report.status === "VALIDATED" && (
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{tc.sendTakedownNotice || (isZh ? "发送下架通知" : "Send Takedown Notice")}</h3>
                <form onSubmit={sendNotice} className="space-y-3">
                  <select value={noticeForm.type}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="TAKEDOWN">{tc.takedownNotice || (isZh ? "下架通知" : "Takedown Notice")}</option>
                    <option value="WARNING">{tc.formalWarning || (isZh ? "正式警告函" : "Formal Warning")}</option>
                    <option value="LEGAL">{tc.lawyerLetter || (isZh ? "律师函" : "Lawyer Letter")}</option>
                  </select>
                  <input type="text" placeholder={tc.recipientNameLabel || (isZh ? "收件方名称 *" : "Recipient Name *")}
                    value={noticeForm.recipientName}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, recipientName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
                  <input type="email" placeholder={tc.recipientEmail || (isZh ? "收件方邮箱" : "Recipient Email")}
                    value={noticeForm.recipientEmail}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <textarea placeholder={tc.recipientAddress || (isZh ? "收件方邮寄地址" : "Recipient Mailing Address")}
                    value={noticeForm.platformAddress}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, platformAddress: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2} />
                  {noticeError && <p className="text-xs text-red-600">{noticeError}</p>}
                  {noticeSuccess && <p className="text-xs text-green-600">{noticeSuccess}</p>}
                  <button type="submit" disabled={submittingNotice || !noticeForm.recipientName}
                    className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300">
                    {submittingNotice ? (tc.generating || (isZh ? "生成中..." : "Generating...")) : (tc.generateNotice || (isZh ? "生成通知" : "Generate Notice"))}
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