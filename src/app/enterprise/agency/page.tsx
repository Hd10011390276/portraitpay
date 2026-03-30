"use client";
/**
 * 经纪公司代理管理页面
 * /enterprise/agency
 * 添加艺人、批量发起授权申请
 */
import { useState, useEffect } from "react";

export default function AgencyPage() {
  const [tab, setTab] = useState<"artists" | "batch">("artists");
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // 添加艺人
  const [artistEmail, setArtistEmail] = useState("");
  const [artistError, setArtistError] = useState<string | null>(null);
  const [artistSuccess, setArtistSuccess] = useState<string | null>(null);

  // 批量授权
  const [selectedPortraitIds, setSelectedPortraitIds] = useState<string[]>([]);
  const [targetEnterpriseId, setTargetEnterpriseId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [usageScope, setUsageScope] = useState<string[]>([]);
  const [usageDuration, setUsageDuration] = useState(90);
  const [proposedFee, setProposedFee] = useState(0);
  const [batchResult, setBatchResult] = useState<any[]>([]);

  useEffect(() => { fetchArtists(); }, []);

  async function fetchArtists() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/agency/artist/list");
      const json = await res.json();
      if (json.success) setArtists(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function addArtist() {
    if (!artistEmail.trim()) return;
    setAddLoading(true);
    setArtistError(null);
    setArtistSuccess(null);
    try {
      // 先通过邮箱查找用户 ID
      // 简化：直接通过 userId 添加（实际应先搜索用户）
      const res = await fetch("/api/v1/agency/artist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artistEmail }), // 临时用邮箱作为ID，实际需先查询
      });
      const json = await res.json();
      if (!json.success) {
        setArtistError(json.error);
      } else {
        setArtistSuccess("艺人添加成功！");
        setArtistEmail("");
        fetchArtists();
      }
    } catch {
      setArtistError("添加失败");
    } finally {
      setAddLoading(false);
    }
  }

  async function removeArtist(agencyArtistId: string) {
    if (!confirm("确定要移除该艺人的代理关系吗？")) return;
    try {
      await fetch(`/api/v1/agency/artist/${agencyArtistId}`, { method: "DELETE" });
      setArtists(prev => prev.filter(a => a.id !== agencyArtistId));
    } catch {
      alert("移除失败");
    }
  }

  function togglePortrait(id: string) {
    setSelectedPortraitIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  async function submitBatchAuth() {
    if (!targetEnterpriseId || selectedPortraitIds.length === 0 || !purpose.trim()) {
      alert("请填写完整信息并选择至少一个肖像");
      return;
    }
    setBatchLoading(true);
    try {
      const res = await fetch("/api/v1/agency/authorization/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitIds: selectedPortraitIds,
          enterpriseId: targetEnterpriseId,
          purpose,
          usageScope,
          usageDuration,
          proposedFee,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBatchResult(json.data ?? []);
        alert(`批量申请完成：成功 ${(json.data ?? []).filter((r: any) => !r.error).length} 个`);
      } else {
        alert(json.error);
      }
    } finally {
      setBatchLoading(false);
    }
  }

  const allPortraits = artists.flatMap((a: any) => a.portraits ?? []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">经纪公司管理</h1>
        <p className="text-gray-500 mb-6">代理旗下艺人肖像，统一管理授权</p>

        <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl w-fit mb-6">
          {[
            { key: "artists", label: "代理艺人管理" },
            { key: "batch", label: "批量授权申请" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${
                tab === t.key ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 代理艺人管理 */}
        {tab === "artists" && (
          <div className="space-y-6">
            {/* 添加艺人 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">添加代理艺人</h2>
              {artistError && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-3 text-sm">{artistError}</div>}
              {artistSuccess && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-3 text-sm">{artistSuccess}</div>}
              <div className="flex gap-3">
                <input
                  value={artistEmail}
                  onChange={e => setArtistEmail(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  placeholder="输入艺人的用户ID或邮箱"
                />
                <button
                  onClick={addArtist}
                  disabled={addLoading}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {addLoading ? "添加中..." : "添加艺人"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">添加前请确保艺人已在平台注册并完成肖像上传</p>
            </div>

            {/* 艺人列表 */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-gray-400">加载中...</div>
              ) : artists.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl">暂无代理艺人</div>
              ) : (
                artists.map(relation => (
                  <div key={relation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{relation.artist?.displayName}</h3>
                        <p className="text-sm text-gray-500">{relation.artist?.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          KYC状态：{relation.artist?.kycStatus} | 代理状态：{relation.proxyStatus}
                        </p>
                      </div>
                      <button
                        onClick={() => removeArtist(relation.id)}
                        className="text-red-500 text-sm font-medium hover:underline"
                      >
                        移除
                      </button>
                    </div>
                    {relation.portraits?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">已上传肖像（{relation.portraits.length}）：</p>
                        <div className="flex gap-2 flex-wrap">
                          {relation.portraits.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                              <div className="w-8 h-8 rounded overflow-hidden bg-gray-200">
                                {p.thumbnailUrl ? (
                                  <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <span className="text-sm text-gray-700">{p.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 批量授权 */}
        {tab === "batch" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-800">批量发起授权申请</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申请企业ID *</label>
              <input
                value={targetEnterpriseId}
                onChange={e => setTargetEnterpriseId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                placeholder="输入目标企业的 Enterprise ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用途说明 *</label>
              <textarea
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                placeholder="批量授权的用途说明"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择肖像（{selectedPortraitIds.length} 个已选）</label>
              {allPortraits.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">请先添加代理艺人</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allPortraits.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => togglePortrait(p.id)}
                      className={`border-2 rounded-xl overflow-hidden text-left transition-all ${
                        selectedPortraitIds.includes(p.id)
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="w-full aspect-square bg-gray-100">
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无图</div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.owner?.displayName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">授权期限（天）</label>
                <input
                  type="number"
                  value={usageDuration}
                  onChange={e => setUsageDuration(parseInt(e.target.value) || 90)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请费用（CNY）</label>
                <input
                  type="number"
                  value={proposedFee}
                  onChange={e => setProposedFee(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <button
              onClick={submitBatchAuth}
              disabled={batchLoading || selectedPortraitIds.length === 0}
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {batchLoading ? "批量申请中..." : `批量发起授权申请（${selectedPortraitIds.length} 个肖像）`}
            </button>

            {batchResult.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-800 mb-2">批量申请结果</h3>
                <div className="space-y-1">
                  {batchResult.map((r: any) => (
                    <div key={r.portraitId} className={`text-sm px-3 py-1.5 rounded ${r.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {r.portraitId} — {r.error ?? `申请ID: ${r.applicationId}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
