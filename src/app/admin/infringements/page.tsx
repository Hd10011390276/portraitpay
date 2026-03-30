"use client";

/**
 * Admin Infringement Review Dashboard
 * Route: /admin/infringements
 *
 * Accessible only to ADMIN and VERIFIER roles.
 * Allows reviewing pending reports and taking action.
 */

import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  VALIDATED:     { label: "已确认侵权", color: "bg-red-100 text-red-800" },
  REJECTED:       { label: "举报不成立", color: "bg-gray-100 text-gray-600" },
  SETTLED:        { label: "已和解", color: "bg-blue-100 text-blue-800" },
  LEGAL_ACTION:   { label: "法律程序", color: "bg-purple-100 text-purple-800" },
};

const TYPE_LABELS: Record<string, string> = {
  UNAUTHORIZED_USE: "未经授权使用",
  EXPIRED_LICENSE: "授权过期",
  SCOPE_VIOLATION: "超范围使用",
  RESALE: "二次转售",
  DEEPFAKE: "AI换脸/合成",
};

export default function AdminInfringementsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING_REVIEW");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ decision: "VALIDATED", resolution: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchReports(); }, [filter]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, limit: "50" });
      const res = await fetch(`/api/infringements?${params}`);
      const json = await res.json();
      if (json.success) setReports(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(reportId: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/infringements/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedId(null);
        fetchReports();
      } else {
        alert(json.error ?? "审核失败");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">侵权举报审核</h1>
          <p className="mt-1 text-sm text-gray-500">平台管理员 / 审核员专用</p>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
            <button key={key}
              onClick={() => { setFilter(key); setSelectedId(null); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-6">
          {/* Report list */}
          <div className="col-span-2 space-y-3">
            {loading ? (
              <p className="text-center text-gray-500 py-10">加载中...</p>
            ) : reports.length === 0 ? (
              <div className="rounded-lg bg-white py-12 text-center text-gray-500 text-sm">
                暂无待审核举报
              </div>
            ) : (
              reports.map((r) => {
                const s = STATUS_LABELS[r.status] ?? { label: r.status, color: "bg-gray-100" };
                return (
                  <div key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md ${
                      selectedId === r.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400">{r.source}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{r.portrait?.title}</p>
                    <p className="text-xs text-gray-500">{TYPE_LABELS[r.type] ?? r.type}</p>
                    <p className="mt-1 text-xs text-gray-400 truncate">{r.reporter?.displayName}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail + Review panel */}
          <div className="col-span-3">
            {selectedId ? (
              <ReportDetailPanel
                report={reports.find((r) => r.id === selectedId)}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onSubmit={() => submitReview(selectedId)}
                submitting={submitting}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-white p-12 text-gray-400 text-sm">
                点击左侧举报卡片查看详情并进行审核
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportDetailPanel({
  report,
  reviewForm,
  setReviewForm,
  onSubmit,
  submitting,
}: {
  report: any;
  reviewForm: { decision: string; resolution: string };
  setReviewForm: (f: any) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  if (!report) return null;

  const canReview = report.status === "PENDING_REVIEW";

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{report.portrait?.title}</h2>
          <p className="text-sm text-gray-500">举报ID：{report.id}</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(report.createdAt).toLocaleString("zh-CN")}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-gray-500">举报人</dt><dd className="font-medium">{report.reporter?.displayName}</dd></div>
        <div><dt className="text-gray-500">侵权类型</dt><dd className="font-medium">{TYPE_LABELS[report.type] ?? report.type}</dd></div>
        <div className="col-span-2"><dt className="text-gray-500">发现链接</dt>
          <dd>{report.detectedUrl
            ? <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">{report.detectedUrl}</a>
            : "—"}</dd>
        </div>
        {report.similarityScore && (
          <div className="col-span-2"><dt className="text-gray-500">系统相似度</dt>
            <dd className="font-medium text-red-600">{(report.similarityScore * 100).toFixed(1)}%</dd>
          </div>
        )}
      </dl>

      <div>
        <h3 className="mb-1 text-sm font-medium text-gray-700">侵权描述</h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.description}</p>
      </div>

      {report.evidenceUrls?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">证据截图</h3>
          <div className="flex gap-2 overflow-x-auto">
            {report.evidenceUrls.map((url: string, i: number) => (
              <img key={i} src={url} alt={`证据${i + 1}`}
                className="h-24 rounded-lg border border-gray-200 object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ))}
          </div>
        </div>
      )}

      {/* Review action (only if PENDING_REVIEW) */}
      {canReview && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">审核操作</h3>
          <div className="flex gap-2">
            {["VALIDATED", "REJECTED", "SETTLED"].map((d) => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="decision" value={d}
                  checked={reviewForm.decision === d}
                  onChange={(e) => setReviewForm((f: any) => ({ ...f, decision: e.target.value }))}
                  className="h-4 w-4" />
                {d === "VALIDATED" ? "确认侵权" : d === "REJECTED" ? "不成立" : "和解"}
              </label>
            ))}
          </div>
          <textarea
            placeholder="填写处理意见或备注（可选）"
            value={reviewForm.resolution}
            onChange={(e) => setReviewForm((f: any) => ({ ...f, resolution: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {submitting ? "提交中..." : "确认审核"}
          </button>
        </div>
      )}

      {report.resolution && (
        <div className="border-t pt-4">
          <h3 className="mb-1 text-sm font-medium text-gray-700">处理意见</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.resolution}</p>
        </div>
      )}
    </div>
  );
}
