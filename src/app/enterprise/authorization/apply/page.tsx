"use client";
/**
 * 企业授权申请页面
 * /enterprise/authorization
 * 企业选择肖像 + 填写用途 + 发起申请
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const USAGE_SCOPES = [
  { value: "commercial", label: "商业用途" },
  { value: "advertising", label: "广告宣传" },
  { value: "merchandise", label: "商品周边" },
  { value: "ai_training", label: "AI训练" },
  { value: "editorial", label: "编辑用途" },
];

const TERRITORIES = [
  { value: "global", label: "全球" },
  { value: "china", label: "中国大陆" },
  { value: "asia", label: "亚洲" },
];

export default function EnterpriseAuthorizationPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "apply" | "done">("select");
  const [portraits, setPortraits] = useState<any[]>([]);
  const [selectedPortrait, setSelectedPortrait] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 申请表单
  const [purpose, setPurpose] = useState("");
  const [usageScope, setUsageScope] = useState<string[]>([]);
  const [exclusivity, setExclusivity] = useState(false);
  const [territorialScope, setTerritorialScope] = useState("global");
  const [usageDuration, setUsageDuration] = useState(90);
  const [proposedFee, setProposedFee] = useState(0);

  useEffect(() => {
    fetchPortraits();
  }, []);

  async function fetchPortraits() {
    try {
      const res = await fetch("/api/portraits?status=ACTIVE&limit=50");
      const json = await res.json();
      if (json.success) setPortraits(json.data ?? []);
    } catch {}
  }

  function toggleScope(value: string) {
    setUsageScope(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  }

  async function submitApplication() {
    if (!selectedPortrait) return;
    if (!purpose.trim() || usageScope.length === 0) {
      setError("请填写用途并至少选择一项使用范围");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/authorizations/enterprise/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitId: selectedPortrait.id,
          purpose,
          usageScope,
          exclusivity,
          territorialScope,
          usageDuration,
          proposedFee,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "申请失败");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">授权申请已提交</h2>
          <p className="text-gray-600 mb-6">
            请等待肖像所有者确认，平台审核通过后授权正式生效。
            您可在「我的授权」中查看进度。
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/enterprise/authorization/list")} className="px-5 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
              查看申请列表
            </button>
            <button onClick={() => { setStep("select"); setSelectedPortrait(null); }} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
              继续申请
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">企业授权申请</h1>
          <p className="text-gray-500 mb-6">选择目标肖像，填写授权需求，发起正式申请</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {/* 步骤1：选择肖像 */}
          {step === "select" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">选择目标肖像</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {portraits.map(portrait => (
                  <button
                    key={portrait.id}
                    onClick={() => { setSelectedPortrait(portrait); setStep("apply"); }}
                    className={`border-2 rounded-xl overflow-hidden text-left transition-all ${
                      selectedPortrait?.id === portrait.id
                        ? "border-purple-600 ring-2 ring-purple-100"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="aspect-square bg-gray-100">
                      {portrait.thumbnailUrl ? (
                        <img src={portrait.thumbnailUrl} alt={portrait.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">无缩略图</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-800 text-sm truncate">{portrait.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{portrait.owner?.displayName ?? "未知"}</p>
                    </div>
                  </button>
                ))}
              </div>
              {portraits.length === 0 && (
                <div className="text-center py-12 text-gray-500">暂无可授权肖像</div>
              )}
            </div>
          )}

          {/* 步骤2：填写申请 */}
          {step === "apply" && selectedPortrait && (
            <div>
              <button onClick={() => setStep("select")} className="text-purple-600 font-medium mb-4 hover:underline">
                ← 重新选择肖像
              </button>

              <div className="flex gap-6 mb-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedPortrait.thumbnailUrl ? (
                    <img src={selectedPortrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">无图</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPortrait.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">所有者：{selectedPortrait.owner?.displayName ?? "未知"}</p>
                  <p className="text-gray-400 text-xs mt-1">ID: {selectedPortrait.id}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 用途 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">授权用途说明 *</label>
                  <textarea
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    placeholder="请详细描述使用场景，例如：用于公司 AI 数字人产品宣传，在官方 App 首页 banner 使用"
                  />
                </div>

                {/* 使用范围 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">使用范围 *（可多选）</label>
                  <div className="flex flex-wrap gap-2">
                    {USAGE_SCOPES.map(scope => (
                      <button
                        key={scope.value}
                        onClick={() => toggleScope(scope.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          usageScope.includes(scope.value)
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 独占性 */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="exclusivity"
                    checked={exclusivity}
                    onChange={e => setExclusivity(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <label htmlFor="exclusivity" className="text-sm font-medium text-gray-700">
                    申请独占授权（独占授权费用更高）
                  </label>
                </div>

                {/* 地域范围 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">地域范围</label>
                  <div className="flex gap-3">
                    {TERRITORIES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTerritorialScope(t.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          territorialScope === t.value
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 授权期限 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">授权期限</label>
                  <div className="flex gap-3 flex-wrap">
                    {[30, 90, 180, 365].map(d => (
                      <button
                        key={d}
                        onClick={() => setUsageDuration(d)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                          usageDuration === d
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {d < 365 ? `${d}天` : "1年"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 申请费用 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">申请费用（CNY）</label>
                  <input
                    type="number"
                    value={proposedFee}
                    onChange={e => setProposedFee(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    placeholder="输入您愿意支付的授权费用"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-400 mt-1">平台将参考此价格进行审核定价</p>
                </div>

                <button
                  onClick={submitApplication}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "提交申请中..." : "提交授权申请"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
