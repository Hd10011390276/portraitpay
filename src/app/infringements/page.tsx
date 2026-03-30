"use client";

/**
 * Infringement Report Management Page
 * Route: /infringements
 *
 * Lists all infringement reports for the current user.
 * Provides tabs: "My Reports" | "System Alerts" | "Monitor Settings"
 */

import { useEffect, useState } from "react";
import Link from "next/link";

type ReportStatus = "PENDING_REVIEW" | "VALIDATED" | "REJECTED" | "SETTLED" | "LEGAL_ACTION";
type AlertStatus = "PENDING" | "CONFIRMED" | "FALSE_POSITIVE" | "EXPIRED";

const STATUS_LABELS: Record<ReportStatus | AlertStatus, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  VALIDATED:     { label: "已确认侵权", color: "bg-red-100 text-red-800" },
  REJECTED:       { label: "不成立", color: "bg-gray-100 text-gray-600" },
  SETTLED:        { label: "已和解", color: "bg-blue-100 text-blue-800" },
  LEGAL_ACTION:   { label: "法律程序", color: "bg-purple-100 text-purple-800" },
  PENDING:        { label: "待确认", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:      { label: "已确认侵权", color: "bg-red-100 text-red-800" },
  FALSE_POSITIVE: { label: "误报", color: "bg-gray-100 text-gray-600" },
  EXPIRED:        { label: "已过期", color: "bg-gray-100 text-gray-400" },
};

const TYPE_LABELS: Record<string, string> = {
  UNAUTHORIZED_USE: "未经授权使用",
  EXPIRED_LICENSE: "授权过期",
  SCOPE_VIOLATION: "超范围使用",
  RESALE: "二次转售",
  DEEPFAKE: "AI换脸/合成",
};

export default function InfringementsPage() {
  const [activeTab, setActiveTab] = useState<"reports" | "alerts" | "settings">("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  // Config form state
  const [configForm, setConfigForm] = useState({
    enabled: true,
    similarityThreshold: 0.85,
    notifyEmail: true,
    notifySms: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    highPriorityMuteExempt: true,
  });

  useEffect(() => {
    if (activeTab === "reports") fetchReports();
    else if (activeTab === "alerts") fetchAlerts();
    else if (activeTab === "settings") fetchConfig();
  }, [activeTab]);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/infringements?limit=50");
      const json = await res.json();
      if (json.success) setReports(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAlerts() {
    setLoading(true);
    try {
      const res = await fetch("/api/infringements/alerts?limit=50");
      const json = await res.json();
      if (json.success) setAlerts(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchConfig() {
    const res = await fetch("/api/infringements/config");
    const json = await res.json();
    if (json.data) {
      setConfig(json.data);
      setConfigForm({
        enabled: json.data.enabled ?? true,
        similarityThreshold: json.data.similarityThreshold ?? 0.85,
        notifyEmail: json.data.notifyEmail ?? true,
        notifySms: json.data.notifySms ?? false,
        quietHoursStart: json.data.quietHoursStart ?? "22:00",
        quietHoursEnd: json.data.quietHoursEnd ?? "08:00",
        highPriorityMuteExempt: json.data.highPriorityMuteExempt ?? true,
      });
    }
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/infringements/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configForm),
    });
    const json = await res.json();
    if (json.success) alert("设置已保存！");
  }

  async function confirmAlert(alertId: string, decision: "CONFIRMED" | "FALSE_POSITIVE") {
    const res = await fetch("/api/infringements/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, decision }),
    });
    const json = await res.json();
    if (json.success) {
      fetchAlerts();
    } else {
      alert(json.error ?? "操作失败");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">侵权管理</h1>
            <p className="mt-1 text-sm text-gray-500">查看和管理您的侵权举报及系统告警</p>
          </div>
          <Link
            href="/report"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 提交新举报
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-200 p-1">
          {[
            { key: "reports", label: "我的举报" },
            { key: "alerts", label: "系统告警" },
            { key: "settings", label: "监测设置" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Reports Tab ── */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">加载中...</p>
            ) : reports.length === 0 ? (
              <div className="rounded-lg bg-white py-16 text-center text-gray-500">
                暂无举报记录。
                <Link href="/report" className="ml-2 text-blue-600 underline">立即举报</Link>
              </div>
            ) : (
              reports.map((report) => {
                const status = STATUS_LABELS[report.status as ReportStatus] ?? { label: report.status, color: "bg-gray-100" };
                return (
                  <Link key={report.id} href={`/infringements/${report.id}`}>
                    <div className="flex items-center justify-between rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-400">{report.source}</span>
                        </div>
                        <p className="truncate font-medium text-gray-900">{report.portrait?.title ?? "肖像"}</p>
                        <p className="mt-0.5 truncate text-sm text-gray-500">{report.description}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(report.createdAt).toLocaleString("zh-CN")} &nbsp;|&nbsp; ID: {report.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-gray-400">›</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* ── Alerts Tab ── */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">加载中...</p>
            ) : alerts.length === 0 ? (
              <div className="rounded-lg bg-white py-16 text-center text-gray-500">
                暂无系统告警。
              </div>
            ) : (
              alerts.map((alert) => {
                const status = STATUS_LABELS[alert.status as AlertStatus] ?? { label: alert.status, color: "bg-gray-100" };
                return (
                  <div key={alert.id} className="rounded-lg bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-500">{alert.sourceName}</span>
                          {alert.similarityScore && (
                            <span className="text-xs text-red-600 font-medium">
                              相似度 {(alert.similarityScore * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{alert.portrait?.title}</p>
                        <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"
                          className="mt-0.5 block truncate text-sm text-blue-600 underline">
                          {alert.sourceUrl}
                        </a>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(alert.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      {alert.status === "PENDING" && (
                        <div className="ml-4 flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => confirmAlert(alert.id, "CONFIRMED")}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            确认侵权
                          </button>
                          <button
                            onClick={() => confirmAlert(alert.id, "FALSE_POSITIVE")}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            误报
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === "settings" && (
          <form onSubmit={saveConfig} className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">监测配置</h2>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">开启侵权监测</p>
                <p className="text-sm text-gray-500">系统将自动扫描互联网上的疑似侵权内容</p>
              </div>
              <input
                type="checkbox"
                checked={configForm.enabled}
                onChange={(e) => setConfigForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="h-5 w-5 rounded"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-900">
                相似度阈值：{Math.round(configForm.similarityThreshold * 100)}%
              </label>
              <p className="mb-2 text-sm text-gray-500">低于此相似度的结果将被自动过滤（建议 85%）</p>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value={configForm.similarityThreshold}
                onChange={(e) => setConfigForm((f) => ({ ...f, similarityThreshold: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <p className="font-medium text-gray-900">通知渠道</p>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={configForm.notifyEmail}
                  onChange={(e) => setConfigForm((f) => ({ ...f, notifyEmail: e.target.checked }))}
                  className="h-4 w-4" />
                <span className="text-sm">邮件通知</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={configForm.notifySms}
                  onChange={(e) => setConfigForm((f) => ({ ...f, notifySms: e.target.checked }))}
                  className="h-4 w-4" />
                <span className="text-sm">短信通知（预留）</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">免打扰开始时间</label>
                <input type="time" value={configForm.quietHoursStart}
                  onChange={(e) => setConfigForm((f) => ({ ...f, quietHoursStart: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">免打扰结束时间</label>
                <input type="time" value={configForm.quietHoursEnd}
                  onChange={(e) => setConfigForm((f) => ({ ...f, quietHoursEnd: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={configForm.highPriorityMuteExempt}
                  onChange={(e) => setConfigForm((f) => ({ ...f, highPriorityMuteExempt: e.target.checked }))}
                  className="h-4 w-4" />
                <div>
                  <span className="text-sm font-medium">高优先级告警不受免打扰限制</span>
                  <p className="text-xs text-gray-500">相似度 ≥ 95% 的告警将在任何时间发送通知</p>
                </div>
              </label>
            </div>

            <button type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700">
              保存设置
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
