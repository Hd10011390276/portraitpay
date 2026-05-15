"use client";
/**
 * /lawyer/cases/[id] — Lawyer case detail page
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  PENDING: "等待平台确认",
  IN_PROGRESS: "进行中",
  WON: "已胜诉",
  LOST: "已败诉",
  CLOSED: "已结算",
  REJECTED: "已拒绝",
};

export default function LawyerCaseDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lawyerCase, setLawyerCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");

  useEffect(() => {
    fetch(`/api/lawyers/cases/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setLawyerCase(j.data);
          setDescription(j.data.description || "");
          setStatus(j.data.status);
        } else {
          setError(j.error || "Failed to load");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/lawyers/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const j = await res.json();
      if (j.success) {
        setLawyerCase(j.data);
      } else {
        alert(j.error || "Update failed");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`确认将案件状态改为「${STATUS_LABELS[newStatus] || newStatus}」？`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/lawyers/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const j = await res.json();
      if (j.success) {
        setLawyerCase(j.data);
        setStatus(j.data.status);
      } else {
        alert(j.error || "Update failed");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("确认结算此案件？仅在判决为「已胜诉」或「已败诉」时可结算。")) return;
    setClosing(true);
    setCloseError("");
    try {
      const res = await fetch(`/api/lawyers/cases/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: closeNotes }),
      });
      const j = await res.json();
      if (j.success) {
        router.refresh();
        window.location.reload();
      } else {
        setCloseError(j.error || "Close failed");
      }
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/lawyer/cases" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              ‹ 返回案件列表
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !lawyerCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/lawyer/cases" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              ‹ 返回案件列表
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center text-red-500">{error || "案件不存在"}</div>
      </div>
    );
  }

  const comp = Number(lawyerCase.compensation || 0);
  const pf = Number(lawyerCase.platformFee || 0);
  const lf = Number(lawyerCase.lawyerFee || 0);
  const pop = Number(lawyerCase.portraitOwnerPayout || 0);
  const isClosed = lawyerCase.status === "CLOSED";
  const canClose = (lawyerCase.status === "WON" || lawyerCase.status === "LOST") && !isClosed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/cases" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ‹ 返回案件列表
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[lawyerCase.status] || "bg-gray-100"}`}>
              {STATUS_LABELS[lawyerCase.status] || lawyerCase.status}
            </span>
            {lawyerCase.platformConfirmed ? (
              <span className="text-sm text-green-600">✓ 平台已确认</span>
            ) : (
              <span className="text-sm text-yellow-600">⏳ 等待平台确认</span>
            )}
            {isClosed && <span className="text-sm text-gray-400">已结算</span>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lawyerCase.infringementReport?.portrait?.title || "侵权案件"}
          </h1>
        </div>

        <div className="space-y-6">
          {/* 侵权报告信息 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">侵权报告信息</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">报告人：</span>
                <span className="text-gray-900">{lawyerCase.infringementReport?.reporter?.displayName || "—"}</span>
              </div>
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">侵权描述：</span>
                <span className="text-gray-900">{lawyerCase.infringementReport?.description || "—"}</span>
              </div>
              {lawyerCase.infringementReport?.detectedUrl && (
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">侵权链接：</span>
                  <a href={lawyerCase.infringementReport.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {lawyerCase.infringementReport.detectedUrl}
                  </a>
                </div>
              )}
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">创建时间：</span>
                <span className="text-gray-900">{new Date(lawyerCase.infringementReport?.createdAt).toLocaleString("zh-CN")}</span>
              </div>
            </div>
          </div>

          {/* 律师备注 */}
          {!isClosed && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">案件备注</h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入案件备注..."
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? "保存中..." : "保存备注"}
                </button>
              </div>
            </div>
          )}

          {/* 费用明细 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">费用明细</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">侵权赔偿金</span>
                <span className="font-medium text-gray-900">¥{comp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">平台服务费 ({(Number(lawyerCase.platformFeeRate || 0) * 100).toFixed(0)}%)</span>
                <span className="text-red-600">-¥{pf.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">律师费 ({(Number(lawyerCase.lawyerFeeRate || 0) * 100).toFixed(0)}%)</span>
                <span className="text-blue-600">+¥{lf.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-gray-700 font-medium">肖像主所得</span>
                <span className="font-bold text-green-600">¥{pop.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 案件状态操作 */}
          {!isClosed && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">案件操作</h2>
              <div className="flex flex-wrap gap-2">
                {lawyerCase.status === "IN_PROGRESS" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("WON")}
                      disabled={updating}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      标记为已胜诉
                    </button>
                    <button
                      onClick={() => handleStatusChange("LOST")}
                      disabled={updating}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      标记为已败诉
                    </button>
                  </>
                )}
                {lawyerCase.status === "PENDING" && (
                  <p className="text-sm text-gray-500 py-2">等待平台确认后开始处理</p>
                )}
                {(lawyerCase.status === "WON" || lawyerCase.status === "LOST") && !isClosed && (
                  <div className="w-full space-y-3">
                    <p className="text-sm text-gray-600">判决已完成，请联系管理员结算此案件。</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 结算 (Admin) */}
          {canClose && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">结算案件（管理员）</h2>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="结算备注（可选）..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none mb-3"
              />
              {closeError && <p className="text-sm text-red-500 mb-2">{closeError}</p>}
              <button
                onClick={handleClose}
                disabled={closing}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {closing ? "结算中..." : "确认结算"}
              </button>
            </div>
          )}

          {/* 已结算信息 */}
          {isClosed && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">结算信息</h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">结算时间：</span>
                  <span className="text-gray-900">
                    {lawyerCase.closedAt ? new Date(lawyerCase.closedAt).toLocaleString("zh-CN") : "—"}
                  </span>
                </div>
                {lawyerCase.resolutionNotes && (
                  <div className="flex gap-2 text-gray-500">
                    <span className="w-20 flex-shrink-0">备注：</span>
                    <span className="text-gray-900">{lawyerCase.resolutionNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 律师信息 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">代理律师</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">律所：</span>
                <span className="text-gray-900">{lawyerCase.lawyerRegistration?.companyName || "—"}</span>
              </div>
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">联系人：</span>
                <span className="text-gray-900">{lawyerCase.lawyerRegistration?.contactName || "—"}</span>
              </div>
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">地区：</span>
                <span className="text-gray-900">{lawyerCase.lawyerRegistration?.region || "—"}</span>
              </div>
            </div>
          </div>

          {/* 元信息 */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>案件ID：{lawyerCase.id}</p>
            <p>创建时间：{new Date(lawyerCase.createdAt).toLocaleString("zh-CN")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}