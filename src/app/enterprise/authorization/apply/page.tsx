"use client";
/**
 * 企业授权申请页面
 * /enterprise/authorization
 * 企业选择肖像 + 填写用途 + 发起申请
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

const USAGE_SCOPES_EN = [
  { value: "commercial", label: "Commercial Use" },
  { value: "advertising", label: "Advertising" },
  { value: "merchandise", label: "Merchandise" },
  { value: "ai_training", label: "AI Training" },
  { value: "editorial", label: "Editorial Use" },
];
const TERRITORIES_EN = [
  { value: "global", label: "Global" },
  { value: "asia", label: "Asia" },
];

const USAGE_SCOPES_ZH = [
  { value: "commercial", label: "商业用途" },
  { value: "advertising", label: "广告宣传" },
  { value: "merchandise", label: "商品周边" },
  { value: "ai_training", label: "AI训练" },
  { value: "editorial", label: "编辑用途" },
];
const TERRITORIES_ZH = [
  { value: "global", label: "全球" },
  { value: "asia", label: "亚洲" },
];

export default function EnterpriseAuthorizationPage() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const router = useRouter();

  const USAGE_SCOPES = isZh ? USAGE_SCOPES_ZH : USAGE_SCOPES_EN;
  const TERRITORIES = isZh ? TERRITORIES_ZH : TERRITORIES_EN;

  const [step, setStep] = useState<"select" | "apply" | "done">("select");
  const [portraits, setPortraits] = useState<any[]>([]);
  const [selectedPortrait, setSelectedPortrait] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState("");
  const [usageScope, setUsageScope] = useState<string[]>([]);
  const [exclusivity, setExclusivity] = useState(false);
  const [territorialScope, setTerritorialScope] = useState("global");
  const [usageDuration, setUsageDuration] = useState(90);
  const [proposedFee, setProposedFee] = useState(0);

  useEffect(() => { fetchPortraits(); }, []);

  async function fetchPortraits() {
    try {
      const res = await fetch("/api/portraits?status=ACTIVE&limit=50");
      const json = await res.json();
      if (json.success) setPortraits(json.data ?? []);
    } catch {}
  }

  function toggleScope(value: string) {
    setUsageScope(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]);
  }

  async function submitApplication() {
    if (!selectedPortrait) return;
    if (!purpose.trim() || usageScope.length === 0) {
      setError(t.authApply?.fillPurposeAndScope || (isZh ? "请填写用途并至少选择一项使用范围" : "Please fill in purpose and select at least one usage scope"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/authorizations/enterprise/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portraitId: selectedPortrait.id, purpose, usageScope, exclusivity, territorialScope, usageDuration, proposedFee }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : (isZh ? "申请失败" : "Application failed"));
    } finally {
      setLoading(false);
    }
  }

  const tc = t.authApply || {};

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tc.applicationSubmitted || (isZh ? "授权申请已提交" : "Application Submitted")}</h2>
          <p className="text-gray-600 mb-6">
            {tc.applicationSubmittedDesc || (isZh ? "请等待肖像所有者确认，平台审核通过后授权正式生效。您可在「我的授权」中查看进度。" : "Please wait for the portrait owner to confirm. The platform will review and the authorization will take effect after approval. You can check progress in 'My Authorizations'.")}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/enterprise/authorization/list")} className="px-5 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
              {tc.viewApplications || (isZh ? "查看申请列表" : "View Applications")}
            </button>
            <button onClick={() => { setStep("select"); setSelectedPortrait(null); }} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
              {tc.continueApplying || (isZh ? "继续申请" : "Continue Applying")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      {/* Header */}
      <header className="nav-glass sticky top-0 z-30">
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/dashboard" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tc.pageTitle || (isZh ? "企业授权申请" : "Enterprise Authorization Application")}</h1>
          <p className="text-gray-500 mb-6">{tc.pageSubtitle || (isZh ? "选择目标肖像，填写授权需求，发起正式申请" : "Select target portrait, fill in authorization requirements, and submit a formal application")}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {/* Step 1: Select portrait */}
          {step === "select" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{tc.selectTargetPortrait || (isZh ? "选择目标肖像" : "Select Target Portrait")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {portraits.map(portrait => (
                  <button
                    key={portrait.id}
                    onClick={() => { setSelectedPortrait(portrait); setStep("apply"); }}
                    className={`border-2 rounded-xl overflow-hidden text-left transition-all ${
                      selectedPortrait?.id === portrait.id ? "border-purple-600 ring-2 ring-purple-100" : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="aspect-square bg-gray-100">
                      {portrait.thumbnailUrl ? (
                        <img src={portrait.thumbnailUrl} alt={portrait.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">{tc.noThumbnail || (isZh ? "无缩略图" : "No Thumbnail")}</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-800 text-sm truncate">{portrait.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{portrait.owner?.displayName ?? (isZh ? "未知" : "Unknown")}</p>
                    </div>
                  </button>
                ))}
              </div>
              {portraits.length === 0 && (
                <div className="text-center py-12 text-gray-500">{tc.noPortraitsAvailable || (isZh ? "暂无可授权肖像" : "No portraits available for authorization")}</div>
              )}
            </div>
          )}

          {/* Step 2: Fill application */}
          {step === "apply" && selectedPortrait && (
            <div>
              <button onClick={() => setStep("select")} className="text-purple-600 font-medium mb-4 hover:underline">
                ← {tc.reselectPortrait || (isZh ? "重新选择肖像" : "Reselect Portrait")}
              </button>

              <div className="flex gap-6 mb-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedPortrait.thumbnailUrl ? (
                    <img src={selectedPortrait.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{tc.noImage || t.enterpriseAuthApply?.noImages || (isZh ? "无图" : "No Image")}</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPortrait.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{tc.owner || (isZh ? "所有者" : "Owner")}：{selectedPortrait.owner?.displayName ?? (isZh ? "未知" : "Unknown")}</p>
                  <p className="text-gray-400 text-xs mt-1">ID: {selectedPortrait.id}</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.purposeLabel || (isZh ? "授权用途说明 *" : "Authorization Purpose *")}</label>
                  <textarea
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    placeholder={tc.purposePlaceholder || (isZh ? "请详细描述使用场景，例如：用于公司 AI 数字人产品宣传，在官方 App 首页 banner 使用" : "Describe the usage scenario in detail, e.g.: used for company AI digital person product promotion, on the official App homepage banner")}
                  />
                </div>

                {/* Usage scope */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{tc.usageScopeLabel || (isZh ? "使用范围 *（可多选）" : "Usage Scope * (multiple choice)")}</label>
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

                {/* Exclusivity */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="exclusivity"
                    checked={exclusivity}
                    onChange={e => setExclusivity(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <label htmlFor="exclusivity" className="text-sm font-medium text-gray-700">
                    {tc.applyExclusiveLicense || (isZh ? "申请独占授权（独占授权费用更高）" : "Apply for Exclusive License (exclusive licenses cost more)")}
                  </label>
                </div>

                {/* Territory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{tc.territoryLabel || (isZh ? "地域范围" : "Territorial Scope")}</label>
                  <div className="flex gap-3">
                    {TERRITORIES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTerritorialScope(t.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          territorialScope === t.value ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{tc.durationLabel || (isZh ? "授权期限" : "Authorization Period")}</label>
                  <div className="flex gap-3 flex-wrap">
                    {[30, 90, 180, 365].map(d => (
                      <button
                        key={d}
                        onClick={() => setUsageDuration(d)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                          usageDuration === d ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {d < 365 ? `${d}${isZh ? "天" : " days"}` : (isZh ? "1年" : "1 year")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.applicationFeeLabel || (isZh ? "申请费用（CNY）" : "Application Fee (CNY)")}</label>
                  <input
                    type="number"
                    value={proposedFee}
                    onChange={e => setProposedFee(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    placeholder={tc.feePlaceholder || (isZh ? "输入您愿意支付的授权费用" : "Enter the authorization fee you are willing to pay")}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-400 mt-1">{tc.feePlatformNote || (isZh ? "平台将参考此价格进行审核定价" : "The platform will review and price based on this fee")}</p>
                </div>

                <button
                  onClick={submitApplication}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (tc.submittingApplication || (isZh ? "提交申请中..." : "Submitting...")) : (tc.submitApplication || (isZh ? "提交授权申请" : "Submit Authorization Application"))}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}