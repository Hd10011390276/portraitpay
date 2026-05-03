"use client";
/**
 * 鑲栧儚鎵€鏈夎€呮巿鏉冨鎵归〉闈?
 * /owner/authorizations
 * 鏌ョ湅鏀跺埌鐨勬巿鏉冪敵璇凤紝纭/鎷掔粷
 */
import { useState, useEffect } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PORTRAIT_OWNER: { label: "寰呮偍纭", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PLATFORM_REVIEW: { label: "骞冲彴瀹℃牳涓?, color: "bg-blue-100 text-blue-800" },
  APPROVED: { label: "宸叉壒鍑?, color: "bg-green-100 text-green-800" },
  REJECTED: { label: "宸叉嫆缁?, color: "bg-red-100 text-red-800" },
  REVOKED: { label: "宸叉挙閿€", color: "bg-gray-100 text-gray-800" },
};

export default function OwnerAuthorizationsPage() {
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
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(applicationId: string) {
    const reason = prompt("璇疯緭鍏ユ嫆缁濆師鍥狅紙鍙€夛級锛?);
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
      } else {
        alert(json.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">鎺堟潈瀹℃壒</h1>
        <p className="text-gray-500 mb-6">绠＄悊鎮ㄦ敹鍒扮殑鑲栧儚鎺堟潈鐢宠</p>

        <div className="mb-4 flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="">鍏ㄩ儴鐘舵€?/option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">鍔犺浇涓?..</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl">鏆傛棤鎺堟潈鐢宠</div>
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
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">鏃犲浘</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{app.portrait?.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            鐢宠浼佷笟锛歿app.enterprise?.companyName ?? "鏈煡"}
                          </p>
                          <p className="text-sm text-gray-500">
                            缁熶竴绀句細淇＄敤浠ｇ爜锛歿app.enterprise?.unifiedCreditCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            鑱旂郴浜猴細{app.enterprise?.contactName} ({app.enterprise?.contactEmail})
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">浣跨敤鑼冨洿锛?/span>{app.usageScope?.join("銆?)}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">鍦板煙锛?/span>{app.territorialScope} | <span className="font-medium">鏈熼檺锛?/span>{app.usageDuration}澶?
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">鐢宠璐圭敤锛?/span>楼{app.proposedFee} {app.currency}
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
                            {actionLoading === app.id ? "澶勭悊涓?.." : "鉁?纭鎺堟潈"}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={actionLoading === app.id}
                            className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                          >
                            鉂?鎷掔粷
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
