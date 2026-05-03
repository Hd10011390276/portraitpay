"use client";
/**
 * 绠＄悊鍛?- 浼佷笟璧勮川瀹℃牳椤甸潰
 * /admin/enterprise
 * 瀹℃牳浼佷笟璁よ瘉鐢宠
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
      rejectionReason = prompt("璇峰～鍐欐嫆缁濆師鍥狅細") ?? "";
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
      actualFee = parseFloat(prompt("璇疯緭鍏ュ疄闄呮巿鏉冭垂鐢紙CNY锛夛細") ?? "0") || 0;
    } else {
      rejectionReason = prompt("璇峰～鍐欐嫆缁濆師鍥狅細") ?? "";
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
        alert(action === "APPROVE" ? "宸叉壒鍑嗭紒" : "宸叉嫆缁?);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">浼佷笟绠＄悊</h1>

        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "pending", label: "浼佷笟璧勮川寰呭鏍?, dot: "馃吘锔? },
            { key: "review", label: "鎺堟潈鐢宠寰呭鏍?, dot: "馃搵" },
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

        {/* 浼佷笟璧勮川瀹℃牳 */}
        {tab === "pending" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">鍔犺浇涓?..</div>
            ) : pendingEnterprises.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl">鏆傛棤寰呭鏍镐紒涓?/div>
            ) : (
              pendingEnterprises.map(ent => (
                <div key={ent.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-900">{ent.companyName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm text-gray-600">
                        <p>缁熶竴绀句細淇＄敤浠ｇ爜锛?span className="font-mono text-gray-800">{ent.unifiedCreditCode}</span></p>
                        <p>娉曚汉锛歿ent.legalPersonName}</p>
                        <p>娉ㄥ唽璧勬湰锛歿ent.registeredCapital ?? "鏈煡"}</p>
                        <p>鎴愮珛鏃ユ湡锛歿ent.establishedDate ? new Date(ent.establishedDate).toLocaleDateString() : "鏈煡"}</p>
                        <p>钀ヤ笟鏈熼檺锛歿ent.businessTerm ?? "闀挎湡"}</p>
                        <p>鑱旂郴浜猴細{ent.contactName} ({ent.contactPhone})</p>
                        <p>閭锛歿ent.contactEmail}</p>
                        {ent.isAgency && <p className="text-purple-600 font-medium">馃彚 缁忕邯鍏徃</p>}
                        <p className="md:col-span-2">缁忚惀鑼冨洿锛歿ent.businessScope ?? "鏈煡"}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">钀ヤ笟鎵х収锛?a href={ent.licenseImageUrl} target="_blank" className="text-purple-600 hover:underline">鏌ョ湅</a></p>
                        {ent.legalPersonIdCardFrontUrl && (
                          <p className="text-xs text-gray-400">娉曚汉韬唤璇侊細<a href={ent.legalPersonIdCardFrontUrl} target="_blank" className="text-purple-600 hover:underline">姝ｉ潰</a> | <a href={ent.legalPersonIdCardBackUrl} target="_blank" className="text-purple-600 hover:underline">鑳岄潰</a></p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => reviewEnterprise(ent.id, "APPROVE")}
                        disabled={actionLoading === ent.id}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        鉁?閫氳繃
                      </button>
                      <button
                        onClick={() => reviewEnterprise(ent.id, "REJECT")}
                        disabled={actionLoading === ent.id}
                        className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        鉂?鎷掔粷
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    鎻愪氦鏃堕棿锛歿new Date(ent.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* 鎺堟潈鐢宠瀹℃牳 */}
        {tab === "review" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">鍔犺浇涓?..</div>
            ) : pendingAuths.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl">鏆傛棤寰呭鏍告巿鏉?/div>
            ) : (
              pendingAuths.map(auth => (
                <div key={auth.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {auth.portrait?.thumbnailUrl ? (
                        <img src={auth.portrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">鏃犲浘</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">鑲栧儚锛歿auth.portrait?.title}</h3>
                          <p className="text-sm text-gray-500">鎵€鏈夎€咃細{auth.portrait?.owner?.displayName} ({auth.portrait?.owner?.email})</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          寰呭钩鍙板鏍?
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">浣跨敤鑼冨洿锛?/span>{auth.usageScope?.join("銆?)}</p>
                        <p><span className="font-medium">鐢宠璐圭敤锛?/span>楼{auth.proposedFee} {auth.currency}</p>
                        <p><span className="font-medium">鐢ㄩ€旇鏄庯細</span>{auth.purpose}</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => reviewAuth(auth.id, "APPROVE")}
                          disabled={actionLoading === auth.id}
                          className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                          {actionLoading === auth.id ? "澶勭悊涓?.." : "鉁?鎵瑰噯骞剁敓鎴愯瘉涔?}
                        </button>
                        <button
                          onClick={() => reviewAuth(auth.id, "REJECT")}
                          disabled={actionLoading === auth.id}
                          className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                        >
                          鉂?鎷掔粷
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
