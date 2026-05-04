"use client";
/**
 * 管理员 - 企业资质审核页面
 * /admin/enterprise
 * 审核企业认证申请
 */
import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function AdminEnterprisePage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const tc = t.adminEnterprise || {};

  const [tab, setTab] = useState<"pending" | "review">("pending");
  const [pendingEnterprises, setPendingEnterprises] = useState<any[]>([]);
  const [pendingAuths, setPendingAuths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (tab === "pending") {
        const res = await fetch("/api/v1/admin/enterprise/pending");
        const json = await res.json();
        if (json.success) setPendingEnterprises(json.data?.enterprises ?? []);
      } else {
        const res = await fetch("/api/v1/admin/authorizations/pending-review");
        const json = await res.json();
        if (json.success) setPendingAuths(json.data?.applications ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function reviewEnterprise(id: string, action: "APPROVE" | "REJECT") {
    let rejectionReason = "";
    if (action === "REJECT") {
      rejectionReason = prompt(isZh ? "请填写拒绝原因：" : "Please enter rejection reason:") ?? "";
      if (!rejectionReason) return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/admin/enterprise/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingEnterprises(prev => prev.filter(e => e.id !== id));
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function reviewAuth(id: string, action: "APPROVE" | "REJECT") {
    let actualFee = 0;
    let rejectionReason = "";
    if (action === "APPROVE") {
      const feeInput = prompt(isZh ? "请输入实际授权费用（CNY）：" : "Enter actual authorization fee (CNY):");
      actualFee = parseFloat(feeInput ?? "0") || 0;
    } else {
      rejectionReason = prompt(isZh ? "请填写拒绝原因：" : "Please enter rejection reason:") ?? "";
      if (!rejectionReason) return;
    }
    setActionLoading(id);
    try {
      const url = action === "APPROVE"
        ? `/api/v1/authorizations/enterprise/apply/${id}/approve`
        : `/api/v1/authorizations/enterprise/apply/${id}/reject`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "APPROVE" ? { actualFee } : { reason: rejectionReason, role: "platform" }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingAuths(prev => prev.filter(a => a.id !== id));
        alert(action === "APPROVE" ? (tc.approved || (isZh ? "已批准！" : "Approved!")) : (tc.rejected || (isZh ? "已拒绝" : "Rejected")));
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
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
            ← {tc.backToDashboard || (isZh ? "控制台" : "Dashboard")}
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="text-lg font-bold text-gray-900">
            {tc.pageTitle || (isZh ? "企业管理" : "Enterprise Management")}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "pending", label: tc.tabEnterpriseCert || (isZh ? "企业资质待审核" : "Enterprise Certification Pending"), dot: "🅾️" },
            { key: "review", label: tc.tabAuthApplications || (isZh ? "授权申请待审核" : "Authorization Applications"), dot: "📋" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                tab === t.key ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.dot} {t.label}
            </button>
          ))}
        </div>

        {/* 企业资质审核 */}
        {tab === "pending" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{tc.loading || (isZh ? "加载中..." : "Loading...")}</div>
            ) : pendingEnterprises.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
                {tc.noPendingEnterprises || (isZh ? "暂无待审核企业" : "No pending enterprises")}
              </div>
            ) : (
              pendingEnterprises.map(ent => (
                <div key={ent.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-900">{ent.companyName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm text-gray-600">
                        <p>{tc.unifiedCreditCode || (isZh ? "统一社会信用代码" : "Credit Code")}：<span className="font-mono text-gray-800">{ent.unifiedCreditCode}</span></p>
                        <p>{tc.legalPerson || (isZh ? "法人" : "Legal Person")}：{ent.legalPersonName}</p>
                        <p>{tc.registeredCapital || (isZh ? "注册资本" : "Registered Capital")}：{ent.registeredCapital ?? (isZh ? "未知" : "Unknown")}</p>
                        <p>{tc.establishedDate || (isZh ? "成立日期" : "Established")}：{ent.establishedDate ? new Date(ent.establishedDate).toLocaleDateString(isZh ? "zh-CN" : "en-US") : (isZh ? "未知" : "Unknown")}</p>
                        <p>{tc.businessTerm || (isZh ? "营业期限" : "Business Term")}：{ent.businessTerm ?? (isZh ? "长期" : "Long-term")}</p>
                        <p>{tc.contactPerson || (isZh ? "联系人" : "Contact")}：{ent.contactName} ({ent.contactPhone})</p>
                        <p>{tc.email || (isZh ? "邮箱" : "Email")}：{ent.contactEmail}</p>
                        {ent.isAgency && <p className="text-purple-600 font-medium">🏢 {tc.agencyCompany || (isZh ? "经纪公司" : "Agency")}</p>}
                        <p className="md:col-span-2">{tc.businessScope || (isZh ? "经营范围" : "Business Scope")}：{ent.businessScope ?? (isZh ? "未知" : "Unknown")}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">{tc.businessLicense || (isZh ? "营业执照" : "Business License")}：<a href={ent.licenseImageUrl} target="_blank" className="text-purple-600 hover:underline">{tc.view || (isZh ? "查看" : "View")}</a></p>
                        {ent.legalPersonIdCardFrontUrl && (
                          <p className="text-xs text-gray-400">{tc.legalIdCard || (isZh ? "法人身份证" : "Legal ID")}：<a href={ent.legalPersonIdCardFrontUrl} target="_blank" className="text-purple-600 hover:underline">{tc.front || (isZh ? "正面" : "Front")}</a> | <a href={ent.legalPersonIdCardBackUrl} target="_blank" className="text-purple-600 hover:underline">{tc.back || (isZh ? "背面" : "Back")}</a></p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => reviewEnterprise(ent.id, "APPROVE")}
                        disabled={actionLoading === ent.id}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        ✅ {tc.approve || (isZh ? "通过" : "Approve")}
                      </button>
                      <button
                        onClick={() => reviewEnterprise(ent.id, "REJECT")}
                        disabled={actionLoading === ent.id}
                        className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        ❌ {tc.reject || (isZh ? "拒绝" : "Reject")}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    {tc.submitTime || (isZh ? "提交时间" : "Submitted")}：{new Date(ent.createdAt).toLocaleString(isZh ? "zh-CN" : "en-US")}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 授权申请审核 */}
        {tab === "review" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{tc.loading || (isZh ? "加载中..." : "Loading...")}</div>
            ) : pendingAuths.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl">
                {tc.noPendingAuths || (isZh ? "暂无待审核授权" : "No pending authorizations")}
              </div>
            ) : (
              pendingAuths.map(auth => (
                <div key={auth.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {auth.portrait?.thumbnailUrl ? (
                        <img src={auth.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{tc.noImage || (isZh ? "无图" : "No Image")}</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{tc.portrait || (isZh ? "肖像" : "Portrait")}：{auth.portrait?.title}</h3>
                          <p className="text-sm text-gray-500">{tc.owner || (isZh ? "所有者" : "Owner")}：{auth.portrait?.owner?.displayName} ({auth.portrait?.owner?.email})</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {tc.pendingPlatformReview || (isZh ? "待平台审核" : "Pending Platform Review")}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">{tc.usageScope || (isZh ? "使用范围" : "Usage Scope")}：</span>{auth.usageScope?.join("、")}</p>
                        <p><span className="font-medium">{tc.applicationFee || (isZh ? "申请费用" : "Application Fee")}：</span>${auth.proposedFee} {auth.currency}</p>
                        <p><span className="font-medium">{tc.purpose || (isZh ? "用途说明" : "Purpose")}：</span>{auth.purpose}</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => reviewAuth(auth.id, "APPROVE")}
                          disabled={actionLoading === auth.id}
                          className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                          {actionLoading === auth.id ? (tc.processing || (isZh ? "处理中..." : "Processing...")) : `✅ ${tc.approveAndGenerateCert || (isZh ? "批准并生成证书" : "Approve & Generate Certificate")}`}
                        </button>
                        <button
                          onClick={() => reviewAuth(auth.id, "REJECT")}
                          disabled={actionLoading === auth.id}
                          className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                        >
                          ❌ {tc.reject || (isZh ? "拒绝" : "Reject")}
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