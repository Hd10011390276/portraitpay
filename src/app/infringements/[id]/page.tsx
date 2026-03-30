"use client";

/**
 * Infringement Report Detail Page
 * Route: /infringements/[id]
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  VALIDATED:     { label: "已确认侵权", color: "bg-red-100 text-red-800" },
  REJECTED:       { label: "举报不成立", color: "bg-gray-100 text-gray-600" },
  SETTLED:        { label: "已和解", color: "bg-blue-100 text-blue-800" },
  LEGAL_ACTION:   { label: "法律程序中", color: "bg-purple-100 text-purple-800" },
};

const TYPE_LABELS: Record<string, string> = {
  UNAUTHORIZED_USE: "未经授权使用",
  EXPIRED_LICENSE: "授权已过期",
  SCOPE_VIOLATION: "超范围使用",
  RESALE: "二次转售",
  DEEPFAKE: "AI换脸/深度合成",
};

export default function InfringementDetailPage() {
  const params = useParams();
  const router = useRouter();
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
        setNoticeSuccess("通知已生成！状态：DRAFT（请前往邮件系统发送）");
        setNoticeForm({ type: "TAKEDOWN", recipientName: "", recipientEmail: "", platformAddress: "" });
      } else {
        setNoticeError(json.error ?? "生成失败");
      }
    } catch {
      setNoticeError("网络错误");
    } finally {
      setSubmittingNotice(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">加载中...</div>;
  if (!report) return <div className="p-10 text-center text-gray-500">举报不存在</div>;

  const statusInfo = STATUS_LABELS[report.status] ?? { label: report.status, color: "bg-gray-100" };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back */}
        <Link href="/infringements" className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
          ‹ 返回侵权管理
        </Link>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                侵权举报详情
              </h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-gray-400">来源：{report.source}</span>
            </div>
            <p className="text-sm text-gray-500">
              举报编号：{report.id} &nbsp;|&nbsp;
              提交时间：{new Date(report.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">基本信息</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-gray-500">涉及肖像</dt><dd className="font-medium">{report.portrait?.title}</dd></div>
                <div><dt className="text-gray-500">侵权类型</dt><dd className="font-medium">{TYPE_LABELS[report.type] ?? report.type}</dd></div>
                <div><dt className="text-gray-500">发现侵权链接</dt>
                  <dd className="font-medium">
                    {report.detectedUrl
                      ? <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{report.detectedUrl}</a>
                      : "—"}
                  </dd>
                </div>
                <div><dt className="text-gray-500">发现时间</dt><dd className="font-medium">{report.detectedAt ? new Date(report.detectedAt).toLocaleString("zh-CN") : "—"}</dd></div>
              </dl>
            </div>

            {/* Description */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">侵权描述</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Evidence */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">证据截图</h2>
              {report.evidenceUrls?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {report.evidenceUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`证据 ${i + 1}`}
                        className="w-full rounded-lg border border-gray-200 object-cover hover:opacity-80"
                        style={{ maxHeight: 200 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无截图</p>
              )}
              {report.evidenceHash && (
                <p className="mt-3 text-xs text-gray-400 break-all">
                  证据哈希（SHA-256）：{report.evidenceHash}
                </p>
              )}
            </div>

            {/* Notices */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">发出的通知</h2>
              {report.notices?.length > 0 ? (
                <div className="space-y-3">
                  {report.notices.map((notice: any) => (
                    <div key={notice.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium text-sm">{notice.type} — {notice.status}</p>
                        <p className="text-xs text-gray-500">
                          {notice.sentAt ? `发送于 ${new Date(notice.sentAt).toLocaleString("zh-CN")}` : "草稿"}
                          {notice.notarizationCert ? ` | 公证编号：${notice.notarizationCert}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无发出的通知</p>
              )}
            </div>

            {/* Resolution (if reviewed) */}
            {report.resolution && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">处理意见</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.resolution}</p>
                {report.verifiedAt && (
                  <p className="mt-2 text-xs text-gray-400">
                    审核时间：{new Date(report.verifiedAt).toLocaleString("zh-CN")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Portrait card */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">涉案肖像</h3>
              {report.portrait?.thumbnailUrl && (
                <img src={report.portrait.thumbnailUrl} alt={report.portrait.title}
                  className="mb-3 w-full rounded-lg object-cover" style={{ maxHeight: 160 }} />
              )}
              <p className="font-medium text-sm">{report.portrait?.title}</p>
              <Link href={`/portraits/${report.portrait?.id}`}
                className="mt-2 block text-xs text-blue-600 underline">
                查看肖像详情
              </Link>
            </div>

            {/* Sender info */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">举报人</h3>
              <p className="text-sm">{report.reporter?.displayName ?? "—"}</p>
              <p className="text-xs text-gray-500">{report.reporter?.email}</p>
            </div>

            {/* Send notice form (only if VALIDATED) */}
            {report.status === "VALIDATED" && (
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">发送下架通知</h3>
                <form onSubmit={sendNotice} className="space-y-3">
                  <select value={noticeForm.type}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="TAKEDOWN">下架通知</option>
                    <option value="WARNING">正式警告函</option>
                    <option value="LEGAL">律师函</option>
                  </select>
                  <input type="text" placeholder="收件方名称 *"
                    value={noticeForm.recipientName}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, recipientName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required />
                  <input type="email" placeholder="收件方邮箱"
                    value={noticeForm.recipientEmail}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <textarea placeholder="收件方邮寄地址"
                    value={noticeForm.platformAddress}
                    onChange={(e) => setNoticeForm((f) => ({ ...f, platformAddress: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2} />
                  {noticeError && <p className="text-xs text-red-600">{noticeError}</p>}
                  {noticeSuccess && <p className="text-xs text-green-600">{noticeSuccess}</p>}
                  <button type="submit" disabled={submittingNotice || !noticeForm.recipientName}
                    className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:bg-gray-300">
                    {submittingNotice ? "生成中..." : "生成通知"}
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
