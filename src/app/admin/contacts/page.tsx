/**
 * /admin/contacts — 管理员联系表单管理后台
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ContactSubmission {
  id: string;
  type: "GENERAL" | "ENTERPRISE";
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  enterpriseName?: string;
  intendedUse?: string;
  expectedScale?: string;
  contactPhone?: string;
  status: string;
  adminNotes?: string;
  handledBy?: string;
  handledAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  emailError?: string;
  repliedAt?: string;
  repliedMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "新提交", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  READ: { label: "已读", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  PROCESSING: { label: "处理中", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  REPLIED: { label: "已回复", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  RESOLVED: { label: "已解决", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  CLOSED: { label: "已关闭", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const TYPE_MAP: Record<string, string> = {
  GENERAL: "普通联系",
  ENTERPRISE: "企业入驻",
};

export default function AdminContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ page: number; total: number; totalPages: number } | null>(null);
  const [stats, setStats] = useState<{ newCount: number; processingCount: number } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  // Detail modal
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Reply/notes state
  const [replyText, setReplyText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (filterStatus) params.set("status", filterStatus);
        if (filterType) params.set("type", filterType);

        const token = localStorage.getItem("pp_access_token");
        const res = await fetch(`/api/admin/contacts?${params}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success) {
          setContacts(json.data ?? []);
          setMeta(json.meta ?? null);
          setStats(json.stats ?? null);
        } else {
          // No auth — redirect
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [filterStatus, filterType, router]
  );

  useEffect(() => { load(1); }, [load]);

  async function updateStatus(id: string, status: string, notes?: string, reply?: string) {
    setUpdateLoading(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const body: any = { id, status };
      if (notes !== undefined) body.adminNotes = notes;
      if (reply !== undefined) body.repliedMessage = reply;

      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...json.data } : c)));
        setSelected((prev) => (prev?.id === id ? { ...prev, ...json.data } : prev));
      } else {
        alert(json.error);
      }
    } finally {
      setUpdateLoading(false);
    }
  }

  function openDetail(c: ContactSubmission) {
    setSelected(c);
    setReplyText(c.repliedMessage ?? "");
    setAdminNotes(c.adminNotes ?? "");
  }

  function closeDetail() {
    setSelected(null);
    setReplyText("");
    setAdminNotes("");
  }

  async function handleStatusChange(newStatus: string) {
    if (!selected) return;
    await updateStatus(selected.id, newStatus, adminNotes, replyText || undefined);
  }

  async function handleSaveNotes() {
    if (!selected) return;
    await updateStatus(selected.id, selected.status, adminNotes, replyText || undefined);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-gray-700 text-sm">
            ← 控制台
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="text-lg font-bold text-gray-900">联系表单管理</h1>
          <span className="ml-auto text-xs text-gray-400">
            共 {meta?.total ?? 0} 条记录
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "", label: "全部" },
              { key: "NEW", label: "新提交", icon: "🔴", count: stats.newCount },
              { key: "PROCESSING", label: "处理中", icon: "🟡", count: stats.processingCount },
              { key: "RESOLVED", label: "已解决", icon: "✅" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setFilterStatus(s.key);
                }}
                className={`bg-white rounded-xl p-4 border text-left transition ${
                  filterStatus === s.key ? "border-purple-400 ring-1 ring-purple-100" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {s.icon && <span>{s.icon}</span>}
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
                {(s.count !== undefined || s.key === "") && (
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {s.count ?? meta?.total ?? 0}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-700">筛选</span>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="GENERAL">普通联系</option>
            <option value="ENTERPRISE">企业入驻</option>
          </select>
          <button
            className="ml-auto px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
            onClick={() => load(meta?.page ?? 1)}
          >
            🔄 刷新
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["类型", "姓名/邮箱", "公司/企业", "主题/用途", "状态", "邮件通知", "提交时间", "操作"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">加载中...</td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  contacts.map((c) => {
                    const st = STATUS_MAP[c.status] ?? STATUS_MAP["NEW"];
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-gray-50 cursor-pointer transition ${
                          c.status === "NEW" ? "bg-red-50/30" : ""
                        }`}
                        onClick={() => openDetail(c)}
                      >
                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            c.type === "ENTERPRISE"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {TYPE_MAP[c.type] ?? c.type}
                          </span>
                        </td>

                        {/* Name/Email */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                          {c.enterpriseName ?? c.company ?? "—"}
                        </td>

                        {/* Subject / Use */}
                        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                          {c.subject ?? c.intendedUse?.slice(0, 40) ?? "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${st.bg} ${st.color} font-medium`}>
                            {st.label}
                          </span>
                        </td>

                        {/* Email sent */}
                        <td className="px-4 py-3 text-center">
                          {c.emailSent ? (
                            <span className="text-green-500 text-base" title={c.emailSentAt ? formatDate(c.emailSentAt) : ""}>✅</span>
                          ) : (
                            <span className="text-gray-300 text-base" title={c.emailError ?? ""}>❌</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(c.createdAt)}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <button
                            className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            onClick={(e) => { e.stopPropagation(); openDetail(c); }}
                          >
                            处理
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-500">
              <span>共 {meta.total} 条，第 {meta.page} / {meta.totalPages} 页</span>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  onClick={() => load(meta.page - 1)}
                >
                  上一页
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  onClick={() => load(meta.page + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeDetail}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selected.type === "ENTERPRISE" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {TYPE_MAP[selected.type]}
                </span>
                {(() => {
                  const st = STATUS_MAP[selected.status] ?? STATUS_MAP["NEW"];
                  return (
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-400">
                  {formatDate(selected.createdAt)}
                </span>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["姓名", selected.name],
                  ["邮箱", selected.email],
                  ["公司", selected.company ?? "—"],
                  ["企业名称", selected.enterpriseName ?? "—"],
                  ["联系电话", selected.contactPhone ?? "—"],
                  ["预期规模", selected.expectedScale ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Subject */}
              {selected.subject && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">主题</p>
                  <p className="text-sm font-medium text-gray-800">{selected.subject}</p>
                </div>
              )}

              {/* Intended use */}
              {selected.intendedUse && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">用途说明</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{selected.intendedUse}</p>
                </div>
              )}

              {/* Message */}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  {selected.type === "ENTERPRISE" ? "补充说明" : "留言内容"}
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">
                  {selected.message || "（无）"}
                </p>
              </div>

              {/* Admin notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">管理员备注</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="记录处理进度、跟进计划等..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Reply */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">回复内容</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="填写回复内容..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Status actions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">更新状态</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <button
                      key={k}
                      disabled={updateLoading || selected.status === k}
                      onClick={() => handleStatusChange(k)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium border transition disabled:opacity-40 ${
                        selected.status === k
                          ? `${v.bg} ${v.color} border-current`
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save notes */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleSaveNotes}
                  disabled={updateLoading}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition"
                >
                  {updateLoading ? "保存中..." : "💾 保存备注"}
                </button>
                {selected.repliedAt && (
                  <span className="text-xs text-gray-400 self-center">
                    已回复于 {formatDate(selected.repliedAt)}
                  </span>
                )}
              </div>

              {/* Meta info */}
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
                <p>提交时间：{formatDate(selected.createdAt)}</p>
                <p>更新时间：{formatDate(selected.updatedAt)}</p>
                <p>
                  邮件通知：
                  {selected.emailSent
                    ? <span className="text-green-600">✅ 已发送 {selected.emailSentAt ? formatDate(selected.emailSentAt) : ""}</span>
                    : <span className="text-red-500">❌ 未发送 {selected.emailError ? `- ${selected.emailError}` : ""}</span>
                  }
                </p>
                {selected.handledAt && <p>最后处理：{formatDate(selected.handledAt)}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
