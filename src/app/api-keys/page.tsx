/**
 * /api-keys — AI Platform API Key Management Page
 * Admin page to manage third-party AI platform API keys
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface AiPlatformApiKey {
  id: string;
  platformName: string;
  keyPrefix: string;
  status: string;
  scopes: string[];
  rateLimitPerMinute: number;
  lastUsedAt: string | null;
  requestCount: string;
  expiresAt: string | null;
  note: string | null;
  createdAt: string;
  displayKey: string;
}

function buildStatusMap(tk: Record<string, string>) {
  return {
    ACTIVE: { label: tk.active || "Active", color: "text-green-600", bg: "bg-green-50 border-green-200" },
    SUSPENDED: { label: tk.suspended || "Suspended", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
    REVOKED: { label: tk.revoked || "Revoked", color: "text-red-600", bg: "bg-red-50 border-red-200" },
    EXPIRED: { label: tk.expired || "Expired", color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
  };
}

const SCOPE_LABELS: Record<string, string> = {
  "portrait:read": "Read Portraits",
  "portrait:license": "License Portraits",
  "portrait:verify": "Verify Portraits",
  "earnings:read": "Read Earnings",
};

const PLATFORM_SUGGESTIONS = [
  "Midjourney",
  "Runway",
  "Stable Diffusion",
  "DALL-E",
  "Adobe Firefly",
  "Leonardo.ai",
  "Ideogram",
  "Flux AI",
  "Sora",
  "Kling AI",
  "Other",
];

export default function AdminApiKeysPage() {
  const { t, locale } = useLanguage();
  const tk = t.apiKeys || {};
  const STATUS_MAP = buildStatusMap(tk);
  const router = useRouter();
  const [keys, setKeys] = useState<AiPlatformApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ page: number; total: number; totalPages: number } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<AiPlatformApiKey | null>(null);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);

  // Create form
  const [formPlatform, setFormPlatform] = useState("");
  const [formScopes, setFormScopes] = useState<string[]>(["portrait:read"]);
  const [formNote, setFormNote] = useState("");
  const [formExpires, setFormExpires] = useState("");
  const [creating, setCreating] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [accessDenied, setAccessDenied] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterPlatform) params.set("platform", filterPlatform);

      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/v1/admin/api-keys?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { setAccessDenied(true); setLoading(false); return; }
      const json = await res.json();
      if (json.success) {
        setKeys(json.data ?? []);
        setMeta(json.meta ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPlatform, router]);

  useEffect(() => { load(1); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formPlatform.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const body: Record<string, unknown> = {
        platformName: formPlatform.trim(),
        scopes: formScopes,
        note: formNote.trim() || undefined,
      };
      if (formExpires) body.expiresAt = formExpires;

      const res = await fetch("/api/v1/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreate(false);
        setShowNewKey(json.data.rawKey);
        setFormPlatform("");
        setFormScopes(["portrait:read"]);
        setFormNote("");
        setFormExpires("");
        load(1);
      } else {
        alert(json.error);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm(tk.confirmRevoke || "Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/v1/admin/api-keys/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success) {
        setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "REVOKED" } : k)));
        if (showDetail?.id === id) setShowDetail((prev) => prev ? { ...prev, status: "REVOKED" } : null);
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSuspend(id: string) {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/v1/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "suspend" }),
      });
      const json = await res.json();
      if (json.success) {
        setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "SUSPENDED" } : k)));
        if (showDetail?.id === id) setShowDetail((prev) => prev ? { ...prev, status: "SUSPENDED" } : null);
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReactivate(id: string) {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/v1/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "reactivate" }),
      });
      const json = await res.json();
      if (json.success) {
        setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "ACTIVE" } : k)));
        if (showDetail?.id === id) setShowDetail((prev) => prev ? { ...prev, status: "ACTIVE" } : null);
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString(locale, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function toggleScope(scope: string) {
    setFormScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  if (accessDenied) {
    return (
      <DashboardShell title="AI Platform API Keys" subtitle="Manage third-party AI platform access">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t.apiKeys.accessDenied}</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">{t.apiKeys.accessDeniedMessage}</p>
          <button onClick={() => router.push("/dashboard")} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">{t.apiKeys.backToConsole}</button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={tk.pageTitle || "AI Platform API Keys"} subtitle={tk.pageSubtitle || "Manage third-party AI platform access"}>
      <div className="space-y-5">
        {/* Header + Create */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">{tk.allStatus || "All Status"}</option>
              <option value="ACTIVE">{tk.active || "Active"}</option>
              <option value="SUSPENDED">{tk.suspended || "Suspended"}</option>
              <option value="REVOKED">{tk.revoked || "Revoked"}</option>
            </select>
            <input
              type="text"
              placeholder={tk.platform || "Platform..."}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={() => load(meta?.page ?? 1)}
            >
              🔄
            </button>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
          >
            + {tk.createApiKey || "Create API Key"}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <tr>
                  {[
                    tk.platform || "Platform",
                    tk.keyPreview || "Key Preview",
                    tk.status || "Status",
                    tk.scopes || "Scopes",
                    tk.rateLimit || "Rate Limit",
                    tk.created || "Created",
                    tk.actions || "Actions",
                  ].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">{tk.loading || "Loading..."}</td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">{tk.noApiKeys || "No API keys found"}</td>
                  </tr>
                ) : (
                  keys.map((key) => {
                    const st = STATUS_MAP[key.status as keyof typeof STATUS_MAP] ?? STATUS_MAP["ACTIVE"];
                    return (
                      <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{key.platformName}</p>
                          {key.note && <p className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">{key.note}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                            {key.displayKey}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {key.scopes.map((s) => (
                              <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                {SCOPE_LABELS[s] ?? s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{key.rateLimitPerMinute}{tk.rateLimitReqMin || "/min"}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(key.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setShowDetail(key)}
                              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                              {tk.view || "View"}
                            </button>
                            {key.status === "ACTIVE" && (
                              <button
                                onClick={() => handleSuspend(key.id)}
                                disabled={actionLoading === key.id}
                                className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition disabled:opacity-50"
                              >
                                {tk.suspend || "Suspend"}
                              </button>
                            )}
                            {key.status === "SUSPENDED" && (
                              <button
                                onClick={() => handleReactivate(key.id)}
                                disabled={actionLoading === key.id}
                                className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                              >
                                {tk.reactivate || "Reactivate"}
                              </button>
                            )}
                            {key.status !== "REVOKED" && (
                              <button
                                onClick={() => handleRevoke(key.id)}
                                disabled={actionLoading === key.id}
                                className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                              >
                                {tk.revoke || "Revoke"}
                              </button>
                            )}
                          </div>
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
              <span>{tk.total || "Total"} {meta.total} {tk.keys || "keys"}</span>
              <div className="flex gap-2">
                <button
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  onClick={() => load(meta.page - 1)}
                >
                  {tk.previous || "Previous"}
                </button>
                <span className="px-3 py-1.5">{tk.page || "Page"} {meta.page} {tk.of || "of"} {meta.totalPages}</span>
                <button
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  onClick={() => load(meta.page + 1)}
                >
                  {tk.next || "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tk.createAiPlatformKey || "Create AI Platform API Key"}</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tk.platformName || "Platform Name *"}</label>
                <input
                  type="text"
                  list="platform-suggestions"
                  required
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  placeholder={tk.platformPlaceholder || "e.g., Midjourney, Runway, Stable Diffusion"}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                />
                <datalist id="platform-suggestions">
                  {PLATFORM_SUGGESTIONS.map((p) => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tk.permissions || "Permissions (Scopes)"}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SCOPE_LABELS).map(([scope, label]) => (
                    <label key={scope} className="flex items-center gap-2 p-3 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={formScopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                        <p className="text-xs text-gray-400">{scope}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tk.noteOptional || "Note (optional)"}</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder={tk.notePlaceholder || "e.g., Production key for Midjourney v6"}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tk.expiresAt || "Expires At (optional)"}</label>
                <input
                  type="datetime-local"
                  value={formExpires}
                  onChange={(e) => setFormExpires(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition"
                >
                  {creating ? (tk.creating || "Creating...") : (tk.createApiKeyBtn || "Create API Key")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {tk.cancel || "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Reveal Modal */}
      {showNewKey && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNewKey(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">🔑</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tk.apiKeyCreated || "API Key Created"}</h2>
                  <p className="text-sm text-gray-500">{tk.copySecureNote || "Copy and store it securely — it will not be shown again."}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <code className="text-sm font-mono break-all text-gray-800 dark:text-gray-200">{showNewKey}</code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showNewKey);
                  alert(tk.copiedToClipboard || "Copied to clipboard!");
                }}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
              >
                📋 {tk.copiedToClipboard ? tk.copiedToClipboard.replace("!", "") : "Copy to Clipboard"}
              </button>
              <button
                onClick={() => setShowNewKey(null)}
                className="w-full mt-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {tk.done || "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{showDetail.platformName}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.status || "Status"}</p>
                  {(() => {
                    const st = STATUS_MAP[showDetail.status as keyof typeof STATUS_MAP] ?? STATUS_MAP["ACTIVE"];
                    return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.color}`}>{st.label}</span>;
                  })()}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.rateLimit || "Rate Limit"}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{showDetail.rateLimitPerMinute} {tk.rateLimitReqMin || "req/min"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.created || "Created"}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(showDetail.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.lastUsed || "Last Used"}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(showDetail.lastUsedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.expires || "Expires"}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(showDetail.expiresAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.requests || "Requests"}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{Number(showDetail.requestCount).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">{tk.keyPreview || "Key Preview"}</p>
                <code className="text-xs font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg block text-gray-700 dark:text-gray-300">{showDetail.displayKey}</code>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">{tk.scopesTitle || "Scopes"}</p>
                <div className="flex flex-wrap gap-1">
                  {showDetail.scopes.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                      {SCOPE_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>

              {showDetail.note && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{tk.note || "Note"}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{showDetail.note}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                {showDetail.status === "ACTIVE" && (
                  <button
                    onClick={() => { handleSuspend(showDetail.id); setShowDetail(null); }}
                    disabled={actionLoading === showDetail.id}
                    className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-medium hover:bg-yellow-100 disabled:opacity-50 transition"
                  >
                    {tk.suspend || "Suspend"}
                  </button>
                )}
                {showDetail.status === "SUSPENDED" && (
                  <button
                    onClick={() => { handleReactivate(showDetail.id); setShowDetail(null); }}
                    disabled={actionLoading === showDetail.id}
                    className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 disabled:opacity-50 transition"
                  >
                    {tk.reactivate || "Reactivate"}
                  </button>
                )}
                {showDetail.status !== "REVOKED" && (
                  <button
                    onClick={() => { handleRevoke(showDetail.id); setShowDetail(null); }}
                    disabled={actionLoading === showDetail.id}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition"
                  >
                    {tk.revoke || "Revoke"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
