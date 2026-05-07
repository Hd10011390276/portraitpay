"use client";
/**
 * Portrait Owner Authorization Approvals Page
 * /owner/authorizations
 * Review and approve/reject received authorization requests
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "", color: "bg-gray-100 text-gray-800" },
};

export default function OwnerAuthorizationsPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";

  // Fill status labels from translations
  STATUS_LABELS.PENDING_PORTRAIT_OWNER.label = t.ownerAuth?.statusPendingOwner || "Pending Confirmation";
  STATUS_LABELS.PENDING_PLATFORM_REVIEW.label = t.ownerAuth?.statusPendingPlatform || "Platform Reviewing";
  STATUS_LABELS.APPROVED.label = t.ownerAuth?.statusApproved || "Approved";
  STATUS_LABELS.REJECTED.label = t.ownerAuth?.statusRejected || "Rejected";
  STATUS_LABELS.REVOKED.label = t.ownerAuth?.statusRevoked || "Revoked";

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
        alert(tc.authorized || "Authorization confirmed!");
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(applicationId: string) {
    const reason = prompt(tc.enterRejectReason || "Enter rejection reason (optional):");
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
        alert(tc.rejected || "Rejected");
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
            ‹ {tc.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {tc.pageTitle}
        </h1>
        <p className="text-gray-500 mb-6">
          {tc.pageSubtitle}
        </p>

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

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">{tc.loading}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
              {tc.noApplications}
            </div>
          ) : (
            applications.map(app => {
              const status = STATUS_LABELS[app.status] ?? { label: app.status, color: "bg-gray-100" };
              const isPending = app.status === "PENDING_PORTRAIT_OWNER";
              const daysLabel = tc.days || (locale === "zh-CN" || locale === "zh-Hant" ? "天" : "days");
              return (
                <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {app.portrait?.thumbnailUrl ? (
                        <img src={app.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {tc.noImage}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{app.portrait?.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {tc.applicantEnterprise}：{app.enterprise?.companyName ?? tc.unknown}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tc.unifiedCreditCode}：{app.enterprise?.unifiedCreditCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            {tc.contactPerson}：{app.enterprise?.contactName} ({app.enterprise?.contactEmail})
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{tc.usageScope}：</span>{app.usageScope?.join("、")}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{tc.territory}：</span>{app.territorialScope} | <span className="font-medium">{tc.duration}：</span>{app.usageDuration}{daysLabel}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{tc.applicationFee}：</span>${app.proposedFee} {app.currency}
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
                            {actionLoading === app.id ? tc.processing : `✅ ${tc.confirmAuth}`}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                          >
                            ❌ {tc.reject}
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