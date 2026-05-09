"use client";
/**
 * 企业授权列表页
 * /enterprise/authorization/list
 * 查看申请进度、活跃授权、下载证书
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_LABELS_EN: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "Pending Portrait Owner", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "Pending Platform Review", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "Revoked", color: "bg-gray-100 text-gray-800" },
  EXPIRED: { label: "Expired", color: "bg-gray-100 text-gray-600" },
};

const STATUS_LABELS_ES: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "Pendiente del Dueño del Retrato", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "Pendiente de Revisión de Plataforma", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "Aprobado", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "Revocado", color: "bg-gray-100 text-gray-800" },
  EXPIRED: { label: "Expirado", color: "bg-gray-100 text-gray-600" },
};

const STATUS_LABELS_ZH: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "待肖像所有者确认", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "待平台审核", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "已批准", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "已撤销", color: "bg-gray-100 text-gray-800" },
  EXPIRED: { label: "已过期", color: "bg-gray-100 text-gray-600" },
};

type Tab = "applications" | "active";

export default function AuthorizationListPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<any[]>([]);
  const [activeAuths, setActiveAuths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const STATUS_LABELS = locale === "zh-CN" || locale === "zh-Hant" ? STATUS_LABELS_ZH : locale === "es-ES" ? STATUS_LABELS_ES : STATUS_LABELS_EN;
  const tc = t.enterpriseAuthList || {};

  useEffect(() => { fetchData(); }, [tab, filterStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      if (tab === "applications") {
        const url = filterStatus
          ? `/api/v1/authorizations/enterprise/apply?status=${filterStatus}`
          : "/api/v1/authorizations/enterprise/apply";
        const res = await fetch(url);
        const json = await res.json();
        if (json.success) setApplications(json.data ?? []);
      } else {
        const res = await fetch("/api/v1/authorizations/enterprise/active");
        const json = await res.json();
        if (json.success) setActiveAuths(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function downloadCert(applicationId: string) {
    try {
      const res = await fetch(`/api/v1/authorizations/enterprise/${applicationId}/certificate`);
      const json = await res.json();
      if (json.success && json.data.pdfUrl) {
        window.open(json.data.pdfUrl, "_blank");
      } else {
        alert(tc.certGenerating);
      }
    } catch {
      alert(tc.downloadFailed);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="nav-glass sticky top-0 z-30">
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
            </Link>
            <span style={{ color: "var(--border-default)", fontSize: "20px", fontWeight: 300 }}>|</span>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900" style={{ textDecoration: "none" }}>
              ‹ {tc.backToDashboard}
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {tc.pageTitle}
        </h1>

        {/* Tab 切换 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "applications", label: tc.tabApplications },
            { key: "active", label: tc.tabActive },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 筛选 */}
        {tab === "applications" && (
          <div className="mb-4 flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="">{tc.allStatuses}</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* 申请列表 */}
        {tab === "applications" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{tc.loading}</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">{tc.noApplications}</div>
            ) : (
              applications.map(app => {
                const status = STATUS_LABELS[app.status] ?? { label: app.status, color: "bg-gray-100" };
                return (
                  <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {app.portrait?.thumbnailUrl ? (
                          <img src={app.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{tc.noImage}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{app.portrait?.title ?? tc.unknownPortrait}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {tc.usageScope}：{app.usageScope?.join("、")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {tc.applicationFee}：${app.proposedFee} {app.currency}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {tc.submitTime}：{new Date(app.createdAt).toLocaleDateString(locale)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                            {app.status === "APPROVED" && (
                              <button
                                onClick={() => downloadCert(app.id)}
                                className="text-xs text-purple-600 font-medium hover:underline"
                              >
                                📄 {tc.downloadCert}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          <span className="font-medium">{tc.purposeLabel}：</span>{app.purpose}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 活跃授权列表 */}
        {tab === "active" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{tc.loading}</div>
            ) : activeAuths.length === 0 ? (
              <div className="text-center py-12 text-gray-400">{tc.noActiveAuths}</div>
            ) : (
              activeAuths.map(auth => (
                <div key={auth.id} className="bg-white rounded-xl shadow-sm border border-green-100 p-5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {auth.portrait?.thumbnailUrl ? (
                        <img src={auth.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{tc.noImage}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{auth.portrait?.title}</h3>
                          <p className="text-sm text-gray-500">{tc.owner}：{auth.portrait?.owner?.displayName}</p>
                          <p className="text-sm text-gray-500">
                            {tc.authDuration}：{auth.usageDuration}{locale === "zh-CN" || locale === "zh-Hant" ? tc.days : ` ${tc.days}`} | {tc.fee}：${auth.proposedFee}
                          </p>
                          <p className="text-xs text-green-600 mt-1">{tc.certNo}：{auth.certificateNo}</p>
                        </div>
                        <button
                          onClick={() => downloadCert(auth.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700"
                        >
                          {tc.downloadCertFull}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}