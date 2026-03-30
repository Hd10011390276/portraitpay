"use client";
/**
 * 管理员 - 企业资质审核页面
 * /admin/enterprise
 * 审核企业认证申请
 */
import { useState, useEffect } from "react";

export default function AdminEnterprisePage() {
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
      rejectionReason = prompt("请填写拒绝原因：") ?? "";
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
      actualFee = parseFloat(prompt("请输入实际授权费用（CNY）：") ?? "0") || 0;
    } else {
      rejectionReason = prompt("请填写拒绝原因：") ?? "";
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
        alert(action === "APPROVE" ? "已批准！" : "已拒绝");
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">企业管理</h1>

        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "pending", label: "企业资质待审核", dot: "🅾️" },
            { key: "review", label: "授权申请待审核", dot: "📋" },
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
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : pendingEnterprises.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl">暂无待审核企业</div>
            ) : (
              pendingEnterprises.map(ent => (
                <div key={ent.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-900">{ent.companyName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm text-gray-600">
                        <p>统一社会信用代码：<span className="font-mono text-gray-800">{ent.unifiedCreditCode}</span></p>
                        <p>法人：{ent.legalPersonName}</p>
                        <p>注册资本：{ent.registeredCapital ?? "未知"}</p>
                        <p>成立日期：{ent.establishedDate ? new Date(ent.establishedDate).toLocaleDateString() : "未知"}</p>
                        <p>营业期限：{ent.businessTerm ?? "长期"}</p>
                        <p>联系人：{ent.contactName} ({ent.contactPhone})</p>
                        <p>邮箱：{ent.contactEmail}</p>
                        {ent.isAgency && <p className="text-purple-600 font-medium">🏢 经纪公司</p>}
                        <p className="md:col-span-2">经营范围：{ent.businessScope ?? "未知"}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">营业执照：<a href={ent.licenseImageUrl} target="_blank" className="text-purple-600 hover:underline">查看</a></p>
                        {ent.legalPersonIdCardFrontUrl && (
                          <p className="text-xs text-gray-400">法人身份证：<a href={ent.legalPersonIdCardFrontUrl} target="_blank" className="text-purple-600 hover:underline">正面</a> | <a href={ent.legalPersonIdCardBackUrl} target="_blank" className="text-purple-600 hover:underline">背面</a></p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => reviewEnterprise(ent.id, "APPROVE")}
                        disabled={actionLoading === ent.id}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => reviewEnterprise(ent.id, "REJECT")}
                        disabled={actionLoading === ent.id}
                        className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        ❌ 拒绝
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    提交时间：{new Date(ent.createdAt).toLocaleString("zh-CN")}
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
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : pendingAuths.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl">暂无待审核授权</div>
            ) : (
              pendingAuths.map(auth => (
                <div key={auth.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {auth.portrait?.thumbnailUrl ? (
                        <img src={auth.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无图</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">肖像：{auth.portrait?.title}</h3>
                          <p className="text-sm text-gray-500">所有者：{auth.portrait?.owner?.displayName} ({auth.portrait?.owner?.email})</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          待平台审核
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">使用范围：</span>{auth.usageScope?.join("、")}</p>
                        <p><span className="font-medium">申请费用：</span>¥{auth.proposedFee} {auth.currency}</p>
                        <p><span className="font-medium">用途说明：</span>{auth.purpose}</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => reviewAuth(auth.id, "APPROVE")}
                          disabled={actionLoading === auth.id}
                          className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                          {actionLoading === auth.id ? "处理中..." : "✅ 批准并生成证书"}
                        </button>
                        <button
                          onClick={() => reviewAuth(auth.id, "REJECT")}
                          disabled={actionLoading === auth.id}
                          className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                        >
                          ❌ 拒绝
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
