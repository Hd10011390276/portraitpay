"use client";
/**
 * 肖像所有者授权审批页面
 * /owner/authorizations
 * 查看收到的授权申请，确认/拒绝
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

const STATUS_LABELS_EN: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "Pending Confirmation", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "Platform Reviewing", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "Revoked", color: "bg-gray-100 text-gray-800" },
};

const STATUS_LABELS_ZH: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "待您确认", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "平台审核中", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "已批准", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "已撤销", color: "bg-gray-100 text-gray-800" },
};

const REJECT_PROMPT_EN = "Enter rejection reason (optional):";
const REJECT_PROMPT_ZH = "请输入拒绝原因（可选）：";
const ALERT_CONFIRMED_EN = "Authorization confirmed!";
const ALERT_CONFIRMED_ZH = "授权已确认！";
const ALERT_PROCESSING_EN = "Processing...";
const ALERT_PROCESSING_ZH = "处理中...";
const ALERT_APPROVED_EN = "Approved!";
const ALERT_APPROVED_ZH = "已批准！";
const ALERT_REJECTED_EN = "Rejected";
const ALERT_REJECTED_ZH = "已拒绝";
const ALERT_REJECT_REASON_EN = "Please enter a rejection reason:";
const ALERT_REJECT_REASON_ZH = "请填写拒绝原因：";

export default function OwnerAuthorizationsPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const router = useRouter();

  const STATUS_LABELS = isZh ? STATUS_LABELS_ZH : STATUS_LABELS_EN;

  const tc = t.ownerAuth || {};

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { fetchApplications(); }, [filterStatus]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const url = filterStatus
        ? `/api/v1/authorizations/owner/pending?status=${filterStatus}`
        : "/api/v1/authorizations/owner/pending";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setApplications(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(applicationId: string) {
    setActionLoading(applicationId);
    try {
      const res = await fetch(`/api/v1/authorizations/enterprise/apply/${applicationId}/confirm`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: "PENDING_PLATFORM_REVIEW", portraitOwnerConfirmed: true } : a));
        alert(isZh ? ALERT_CONFIRMED_ZH : ALERT_CONFIRMED_EN);
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(applicationId: string) {
    const reason = prompt(isZh ? ALERT_REJECT_REASON_ZH : ALERT_REJECT_PROMPT_EN);
    setActionLoading(applicationId);
    try {
      const res = await fetch(`/api/v1/authorizations/enterprise/apply/${applicationId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, role: "owner" }),
      });
      const json = await res.json();
      if (json.success) {
        setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: "REJECTED" } : a));
        alert(isZh ? ALERT_REJECTED_ZH : ALERT_REJECTED_EN);
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ‹ {tc.backToDashboard || (isZh ? "返回控制台" : "Back to Dashboard")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {tc.pageTitle || (isZh ? "授权审批" : "Authorization Approvals")}
        </h1>
        <p className="text-gray-500 mb-6">
          {tc.pageSubtitle || (isZh ? "管理您收到的肖像授权申请" : "Manage portrait authorization requests you have received")}
        </p>

        <div className="mb-4 flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="">{tc.allStatuses || (isZh ? "全部状态" : "All Statuses")}</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">{tc.loading || (isZh ? "加载中..." : "Loading...")}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
              {tc.noApplications || (isZh ? "暂无授权申请" : "No authorization requests")}
            </div>
          ) : (
            applications.map(app => {
              const status = STATUS_LABELS[app.status] ?? { label: app.status, color: "bg-gray-100" };
              const isPending = app.status === "PENDING_PORTRAIT_OWNER";
              return (
                <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {app.portrait?.thumbnailUrl ? (
                        <img src={app.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {tc.noImage || (isZh ? "无图" : "No Image")}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{app.portrait?.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {tc.applicantEnterprise || (isZh ? "申请企业" : "Applicant Enterprise")}：{app.enterprise?.companyName ?? (isZh ? "未知" : "Unknown")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tc.unifiedCreditCode || (isZh ? "统一社会信用代码" : "Unified Credit Code")}：{app.enterprise?.unifiedCreditCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tc.contactPerson || (isZh ? "联系人" : "Contact")}：{app.enterprise?.contactName} ({app.enterprise?.contactEmail})
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{tc.usageScope || (isZh ? "使用范围" : "Usage Scope")}：</span>{app.usageScope?.join("、")}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{tc.territory || (isZh ? "地域" : "Territory")}：</span>{app.territorialScope} | <span className="font-medium">{tc.duration || (isZh ? "期限" : "Duration")}：</span>{app.usageDuration}{isZh ? "天" : " days"}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{tc.applicationFee || (isZh ? "申请费用" : "Application Fee")}：</span>${app.proposedFee} {app.currency}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{app.purpose}</p>
                      </div>

                      {isPending && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleConfirm(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                          >
                            {actionLoading === app.id ? (tc.processing || (isZh ? "处理中..." : ALERT_PROCESSING_EN)) : `✅ ${tc.confirmAuth || (isZh ? "确认授权" : "Confirm Authorization")}`}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                          >
                            ❌ {tc.reject || (isZh ? "拒绝" : "Reject")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}