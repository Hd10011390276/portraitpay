"use client";
/**
 * /admin/infringements/[id] — Admin infringement detail with lawyer assignment
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

const REPORT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: "待审核",
  VERIFIED: "已确认",
  REJECTED: "已拒绝",
};

export default function AdminInfringementDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    // Load report
    fetch(`/api/infringements/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setReport(j.data);
          if (j.data.lawyerCase?.lawyerRegistrationId) {
            setSelectedLawyer(j.data.lawyerCase.lawyerRegistrationId);
          }
        } else {
          setError(j.error || "Failed to load");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));

    // Load approved lawyers
    fetch("/api/lawyers/registrations")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setLawyers(j.data.filter((l: any) => l.status === "APPROVED"));
      })
      .catch(() => {});
  }, [id]);

  const handleAssign = async () => {
    if (!selectedLawyer) {
      setAssignError("请选择律师");
      return;
    }
    setAssigning(true);
    setAssignError("");
    setAssignSuccess(false);
    try {
      const res = await fetch("/api/lawyers/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          infringementReportId: id,
          lawyerRegistrationId: selectedLawyer,
        }),
      });
      const j = await res.json();
      if (j.success) {
        setAssignSuccess(true);
        // Refresh report
        const refreshed = await fetch(`/api/infringements/${id}`).then((r) => r.json());
        if (refreshed.success) setReport(refreshed.data);
      } else {
        setAssignError(j.error || "Assignment failed");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirm = async () => {
    if (!report?.lawyerCase?.id) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/lawyers/cases/${report.lawyerCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformConfirmed: true }),
      });
      const j = await res.json();
      if (j.success) {
        const refreshed = await fetch(`/api/infringements/${id}`).then((r) => r.json());
        if (refreshed.success) setReport(refreshed.data);
      } else {
        alert(j.error || "Confirm failed");
      }
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/admin/infringements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              ‹ 返回侵权列表
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/admin/infringements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
              ‹ 返回侵权列表
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-red-500">{error || "报告不存在"}</div>
      </div>
    );
  }

  const comp = Number(report.lawyerCase?.compensation || 0);
  const pf = Number(report.lawyerCase?.platformFee || 0);
  const lf = Number(report.lawyerCase?.lawyerFee || 0);
  const pop = Number(report.lawyerCase?.portraitOwnerPayout || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/infringements" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ‹ 返回侵权列表
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${REPORT_STATUS_COLORS[report.status] || "bg-gray-100"}`}>
              {REPORT_STATUS_LABELS[report.status] || report.status}
            </span>
            {report.lawyerCase ? (
              <span className="text-sm text-green-600">✓ 已分配律师</span>
            ) : (
              <span className="text-sm text-yellow-600">⏳ 待分配律师</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            侵权报告 #{report.id.slice(0, 8)}
          </h1>
        </div>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">侵权信息</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">报告人：</span>
                <span className="text-gray-900">{report.reporter?.displayName || "—"}</span>
              </div>
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">侵权描述：</span>
                <span className="text-gray-900">{report.description || "—"}</span>
              </div>
              {report.detectedUrl && (
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">侵权链接：</span>
                  <a href={report.detectedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {report.detectedUrl}
                  </a>
                </div>
              )}
              {report.screenshotUrl && (
                <div className="flex gap-2 text-gray-500">
                  <span className="w-20 flex-shrink-0">截图：</span>
                  <a href={report.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    查看截图
                  </a>
                </div>
              )}
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">创建时间：</span>
                <span className="text-gray-900">{new Date(report.createdAt).toLocaleString("zh-CN")}</span>
              </div>
            </div>
          </div>

          {/* 肖像信息 */}
          {report.portrait && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">关联肖像</h2>
              <div className="flex items-center gap-4">
                {report.portrait.thumbnailUrl && (
                  <img src={report.portrait.thumbnailUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{report.portrait.title}</p>
                  <Link href={`/portraits/${report.portraitId}`} className="text-sm text-blue-600 hover:underline">
                    查看肖像详情
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 律师分配 */}
          {!report.lawyerCase ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">分配律师</h2>
              <div className="space-y-3">
                <select
                  value={selectedLawyer}
                  onChange={(e) => setSelectedLawyer(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">— 选择律师 —</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName}（{l.region}）
                    </option>
                  ))}
                </select>
                {assignError && <p className="text-sm text-red-500">{assignError}</p>}
                {assignSuccess && <p className="text-sm text-green-600">分配成功！</p>}
                <button
                  onClick={handleAssign}
                  disabled={assigning || !selectedLawyer}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assigning ? "分配中..." : "确认分配"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 律师已分配 - 显示案件信息 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">代理律师</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 text-gray-500">
                    <span className="w-20 flex-shrink-0">律所：</span>
                    <span className="text-gray-900">{report.lawyerCase.lawyerRegistration?.companyName || "—"}</span>
                  </div>
                  <div className="flex gap-2 text-gray-500">
                    <span className="w-20 flex-shrink-0">联系人：</span>
                    <span className="text-gray-900">{report.lawyerCase.lawyerRegistration?.contactName || "—"}</span>
                  </div>
                  <div className="flex gap-2 text-gray-500">
                    <span className="w-20 flex-shrink-0">状态：</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      report.lawyerCase.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                      report.lawyerCase.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      report.lawyerCase.status === "WON" ? "bg-green-100 text-green-800" :
                      report.lawyerCase.status === "LOST" ? "bg-red-100 text-red-800" :
                      report.lawyerCase.status === "CLOSED" ? "bg-gray-100 text-gray-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {report.lawyerCase.status}
                    </span>
                  </div>
                  {report.lawyerCase.platformConfirmed ? (
                    <div className="flex gap-2 text-green-600">
                      <span className="w-20 flex-shrink-0">平台确认：</span>
                      <span>✓ 已确认</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">⏳ 等待平台确认</span>
                      <button
                        onClick={handleConfirm}
                        disabled={assigning}
                        className="px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {assigning ? "确认中..." : "确认接案"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 费用明细 */}
              {comp > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">费用明细</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">侵权赔偿金</span>
                      <span className="font-medium text-gray-900">¥{comp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">平台服务费 ({(Number(report.lawyerCase.platformFeeRate || 0) * 100).toFixed(0)}%)</span>
                      <span className="text-red-600">-¥{pf.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">律师费 ({(Number(report.lawyerCase.lawyerFeeRate || 0) * 100).toFixed(0)}%)</span>
                      <span className="text-blue-600">+¥{lf.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                      <span className="text-gray-700 font-medium">肖像主所得</span>
                      <span className="font-bold text-green-600">¥{pop.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Link
                  href={`/lawyer/cases/${report.lawyerCase.id}`}
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  查看律师案件
                </Link>
              </div>
            </>
          )}

          {/* 元信息 */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>报告ID：{report.id}</p>
            <p>创建时间：{new Date(report.createdAt).toLocaleString("zh-CN")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}