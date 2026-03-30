"use client";
/**
 * 企业授权列表页
 * /enterprise/authorization/list
 * 查看申请进度、活跃授权、下载证书
 */
import { useState, useEffect } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "待肖像所有者确认", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "待平台审核", color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "已批准", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "已拒绝", color: "bg-red-100 text-red-800" },
  REVOKED: { label: "已撤销", color: "bg-gray-100 text-gray-800" },
  EXPIRED: { label: "已过期", color: "bg-gray-100 text-gray-600" },
};

type Tab = "applications" | "active";

export default function AuthorizationListPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<any[]>([]);
  const [activeAuths, setActiveAuths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");

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
        alert("证书生成中，请稍后再试");
      }
    } catch {
      alert("下载失败");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">我的授权</h1>

        {/* Tab 切换 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "applications", label: "授权申请" },
            { key: "active", label: "活跃授权" },
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
              <option value="">全部状态</option>
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
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无授权申请</div>
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
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无图</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{app.portrait?.title ?? "未知肖像"}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              使用范围：{app.usageScope?.join("、")}
                            </p>
                            <p className="text-sm text-gray-500">
                              申请费用：¥{app.proposedFee} {app.currency}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              提交时间：{new Date(app.createdAt).toLocaleDateString("zh-CN")}
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
                                📄 下载证书
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          <span className="font-medium">用途说明：</span>{app.purpose}
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
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : activeAuths.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无活跃授权</div>
            ) : (
              activeAuths.map(auth => (
                <div key={auth.id} className="bg-white rounded-xl shadow-sm border border-green-100 p-5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {auth.portrait?.thumbnailUrl ? (
                        <img src={auth.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无图</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{auth.portrait?.title}</h3>
                          <p className="text-sm text-gray-500">所有者：{auth.portrait?.owner?.displayName}</p>
                          <p className="text-sm text-gray-500">
                            授权期限：{auth.usageDuration}天 | 费用：¥{auth.proposedFee}
                          </p>
                          <p className="text-xs text-green-600 mt-1">证书编号：{auth.certificateNo}</p>
                        </div>
                        <button
                          onClick={() => downloadCert(auth.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700"
                        >
                          下载授权证书
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
