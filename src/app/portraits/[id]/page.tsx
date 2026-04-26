/**
 * /portraits/[id] - Portrait detail page
 * Shows portrait info, blockchain certificate, and action buttons
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getIpfsGatewayUrl } from "@/lib/ipfs";
import { useLanguage } from "@/context/LanguageContext";

interface PortraitDetail {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  tags: string[];
  status: string;
  originalImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageHash?: string | null;
  blockchainTxHash?: string | null;
  blockchainNetwork?: string | null;
  ipfsCid?: string | null;
  certifiedAt?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    displayName?: string | null;
    email?: string | null;
    walletAddress?: string | null;
    kycStatus: string;
  };
}

export default function PortraitDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [portrait, setPortrait] = useState<PortraitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [certifying, setCertifying] = useState(false);
  const [certifyMsg, setCertifyMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  // AI Licensing state
  const [licensing, setLicensing] = useState<{
    allowAiLicensing: boolean | null;
    aiLicenseFee: string | null;
    aiLicenseScopes: string[];
    aiProhibitedScopes: string[];
    aiTerritorialScope: string;
    defaults: {
      allowLicensing: boolean;
      defaultLicenseFee: string;
      allowedScopes: string[];
      prohibitedContent: string[];
      defaultTerritorialScope: string;
    };
  } | null>(null);
  const [licensingSaving, setLicensingSaving] = useState(false);
  const [showLicensing, setShowLicensing] = useState(false);
  // Editable form state
  const [editAllowAi, setEditAllowAi] = useState<boolean | null>(null);
  const [editFee, setEditFee] = useState("");
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [editProhibited, setEditProhibited] = useState<string[]>([]);
  const [editTerritory, setEditTerritory] = useState("");
  const tc = t.portraits.detail; // Define tc early so it's available in handlers
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    fetch(`/api/portraits/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPortrait(j.data);
        else router.push("/portraits");
      })
      .catch(() => router.push("/portraits"))
      .finally(() => setLoading(false));
  }, [id, router]);

  // Load AI licensing settings
  useEffect(() => {
    if (!id) return;
    fetch(`/api/portraits/${id}/licensing`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setLicensing(j.data);
          setEditAllowAi(j.data.allowAiLicensing);
          setEditFee(j.data.aiLicenseFee ?? "");
          setEditScopes(j.data.aiLicenseScopes ?? []);
          setEditProhibited(j.data.aiProhibitedScopes ?? []);
          setEditTerritory(j.data.aiTerritorialScope ?? "global");
        }
      })
      .catch(() => {});
  }, [id]);

  const handleDownloadPortrait = async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("portraitpay-local", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const record = await new Promise<{ imageBlob: Blob } | undefined>((resolve, reject) => {
        const tx = db.transaction("portraits", "readonly");
        const store = tx.objectStore("portraits");
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result as { imageBlob: Blob } | undefined);
        req.onerror = () => reject(req.error);
      });
      if (!record?.imageBlob) { alert(t.faceTrace.portraitNotFound); return; }
      const url = URL.createObjectURL(record.imageBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${portrait?.title ?? "portrait"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(t.faceTrace.savedToDownloads);
    } catch { alert(t.faceTrace.downloadFailed); }
  };

  const handleCertify = async () => {
    if (!confirm(tc.certifyConfirm)) return;

    setCertifying(true);
    setCertifyMsg(tc.certifyStepHash);

    try {
      const steps = [
        tc.certifyStepHash,
        tc.certifyStepUploadMeta,
        tc.certifyStepMint,
        tc.certifyStepConfirm,
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length - 1) setCertifyMsg(steps[++stepIdx]);
      }, 3000);

      const res = await fetch(`/api/portraits/${id}/certify`, { method: "POST" });
      clearInterval(interval);

      const json = await res.json();
      if (!json.success) {
        setCertifyMsg(`${tc.certifyFailed}${json.error}`);
        setTimeout(() => setCertifyMsg(""), 5000);
        return;
      }

      setCertifyMsg(`${tc.certifySuccess}${json.data.blockNumber}`);
      setTimeout(() => setCertifyMsg(""), 8000);

      const refreshed = await fetch(`/api/portraits/${id}`).then((r) => r.json());
      if (refreshed.success) setPortrait(refreshed.data);
    } catch (err) {
      setCertifyMsg(tc.certifyNetworkError);
      setTimeout(() => setCertifyMsg(""), 5000);
    } finally {
      setCertifying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(tc.archiveConfirm)) return;

    setDeleting(true);
    try {
      await fetch(`/api/portraits/${id}`, { method: "DELETE" });
      router.push("/portraits");
    } catch {
      setDeleting(false);
    }
  };

  const handleSaveLicensing = async () => {
    setLicensingSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editAllowAi !== null) body.allowAiLicensing = editAllowAi;
      if (editFee !== "") body.aiLicenseFee = editFee;
      if (editScopes.length > 0) body.aiLicenseScopes = editScopes;
      if (editProhibited.length > 0) body.aiProhibitedScopes = editProhibited;
      if (editTerritory) body.aiTerritorialScope = editTerritory;

      const res = await fetch(`/api/portraits/${id}/licensing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setLicensing((prev) => prev ? {
          ...prev,
          allowAiLicensing: json.data.allowAiLicensing,
          aiLicenseFee: json.data.aiLicenseFee,
          aiLicenseScopes: json.data.aiLicenseScopes,
          aiProhibitedScopes: json.data.aiProhibitedScopes,
          aiTerritorialScope: json.data.aiTerritorialScope,
        } : null);
        setShowLicensing(false);
        alert("Licensing settings saved!");
      } else {
        alert(json.error);
      }
    } finally {
      setLicensingSaving(false);
    }
  };

  function openLicensingPanel() {
    if (!licensing) return;
    setEditAllowAi(licensing.allowAiLicensing);
    setEditFee(licensing.aiLicenseFee ?? "");
    setEditScopes(licensing.aiLicenseScopes ?? []);
    setEditProhibited(licensing.aiProhibitedScopes ?? []);
    setEditTerritory(licensing.aiTerritorialScope ?? "global");
    setShowLicensing(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const ipfsGatewayUrl = portrait?.ipfsCid ? getIpfsGatewayUrl(portrait.ipfsCid) : null;
  const hasImage = !!portrait?.originalImageUrl && !hasImageError;

  if (loading || !portrait) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      title={portrait.title}
      subtitle={`Status: ${portrait.status}`}
      action={
        <Link href="/portraits" className="text-gray-500 hover:text-gray-700 text-sm">
          ← {tc.back}
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

        {/* LEFT: Image - always square, compact lock placeholder when no image */}
        <div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="relative" style={{ aspectRatio: "1" }}>
              {hasImage ? (
                <img
                  src={portrait.originalImageUrl!}
                  alt={portrait.title}
                  className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800"
                  onError={() => setHasImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span className="text-base">🔒</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.faceTrace.localStorage}</p>
                    <button
                      type="button"
                      onClick={handleDownloadPortrait}
                      className="ml-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md flex items-center gap-0.5 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      {t.faceTrace.download}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Details + Blockchain certificate (now alongside details) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{tc.details}</h2>
            <div className="space-y-3 text-sm">
              {portrait.description && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">{tc.description}</p>
                  <p className="text-gray-800 dark:text-gray-200">{portrait.description}</p>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-500 dark:text-gray-400">{tc.category}</span>
                <span className="text-gray-900 dark:text-white">{portrait.category}</span>
              </div>
              {portrait.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {portrait.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-500 dark:text-gray-400">{tc.visibility}</span>
                <span className={portrait.isPublic ? "text-green-600 dark:text-green-400" : "text-gray-400"}>
                  {portrait.isPublic ? tc.public : tc.private}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 dark:text-gray-400">{tc.created}</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(portrait.createdAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
                </span>
              </div>
            </div>
          </div>

          {portrait.blockchainTxHash ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                <span>📜</span> {tc.blockchainCertificate}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">{tc.network}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{portrait.blockchainNetwork ? (portrait.blockchainNetwork.toLowerCase().includes('sepolia') ? 'Ethereum Sepolia' : portrait.blockchainNetwork.toUpperCase()) : 'Ethereum Sepolia'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">{tc.txHash}</span>
                  <a href={`https://sepolia.etherscan.io/tx/${portrait.blockchainTxHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-mono text-xs hover:underline break-all">{portrait.blockchainTxHash}</a>
                </div>
                {portrait.ipfsCid && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">{tc.ipfsCid}</span>
                    <a href={ipfsGatewayUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-mono text-xs hover:underline break-all">{portrait.ipfsCid}</a>
                  </div>
                )}
                {portrait.imageHash && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">{tc.imageHash}</span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono text-xs break-all">{portrait.imageHash}</span>
                  </div>
                )}
                {portrait.certifiedAt && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">{tc.certifiedAt}</span>
                    <span className="text-gray-900 dark:text-white text-xs">{new Date(portrait.certifiedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 p-5">
              <h2 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">{tc.notCertified}</h2>
              <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">{tc.notCertifiedDesc}</p>
              {portrait.imageHash && (
                <div className="mb-3 p-2 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                  <p className="text-xs text-gray-400 mb-0.5">{tc.imageHash}</p>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">{portrait.imageHash}</p>
                </div>
              )}
              {certifyMsg && (
                <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg text-sm text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {certifying && <div className="flex items-center gap-2 mb-1"><div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full" /></div>}
                  {certifyMsg}
                </div>
              )}
              <button onClick={handleCertify} disabled={certifying || !portrait.imageHash} className="w-full px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {certifying ? tc.certifying : tc.certifyOnBlockchain}
              </button>
              {!portrait.imageHash && <p className="text-xs text-center text-purple-500 dark:text-purple-400 mt-2">{tc.imageHashNotAvailable}</p>}
            </div>
          )}

          <div className="flex gap-3">
            <Link href={`/portraits/${id}/edit`} className="flex-1 px-4 py-2 text-center text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{tc.edit}</Link>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">{deleting ? tc.archiving : tc.archive}</button>
          </div>

          {/* AI Licensing Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                🤖 AI Licensing
              </h3>
              <button
                onClick={openLicensingPanel}
                className="text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 transition"
              >
                Configure
              </button>
            </div>
            {licensing === null ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  {licensing.allowAiLicensing === null ? (
                    <span className="text-gray-400 text-xs">(Uses global default)</span>
                  ) : licensing.allowAiLicensing ? (
                    <span className="text-green-600 text-xs font-medium px-2 py-0.5 bg-green-50 rounded-full">Allowed</span>
                  ) : (
                    <span className="text-red-500 text-xs font-medium px-2 py-0.5 bg-red-50 rounded-full">Blocked</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">License Fee:</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {licensing.aiLicenseFee ? `$${licensing.aiLicenseFee} USD` : `(Default: $${licensing.defaults.defaultLicenseFee})`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Territory:</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">{licensing.aiTerritorialScope}</span>
                </div>
                {licensing.aiLicenseScopes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {licensing.aiLicenseScopes.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                {licensing.aiProhibitedScopes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {licensing.aiProhibitedScopes.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{tc.owner}</p>
            <p className="font-medium text-gray-900 dark:text-white">{portrait.owner.displayName ?? "—"}</p>
            {portrait.owner.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{portrait.owner.email}</p>
            )}
            {portrait.owner.walletAddress && <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">{portrait.owner.walletAddress}</p>}
          </div>
        </div>
      </div>

      {/* AI Licensing Configuration Modal */}
      {showLicensing && licensing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowLicensing(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-300">🤖 AI Licensing Settings</h2>
              <button onClick={() => setShowLicensing(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Allow AI Licensing Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allow AI Platforms to License</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditAllowAi(true)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                      editAllowAi === true
                        ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
                        : "bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    ✅ Allow
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAllowAi(false)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                      editAllowAi === false
                        ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
                        : "bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    🚫 Block
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAllowAi(null)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition ${
                      editAllowAi === null
                        ? "bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        : "bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    Default
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">"Default" uses your global PortraitSettings preference.</p>
              </div>

              {/* License Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">License Fee (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                  placeholder={`Default: $${licensing.defaults.defaultLicenseFee}`}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                />
              </div>

              {/* Territorial Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Territorial Scope</label>
                <select
                  value={editTerritory}
                  onChange={(e) => setEditTerritory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
                >
                  <option value="global">🌍 Global</option>
                  <option value="china">🇨🇳 China</option>
                  <option value="asia">🌏 Asia</option>
                  <option value="europe">🇪🇺 Europe</option>
                  <option value="americas">🌎 Americas</option>
                </select>
              </div>

              {/* Allowed Usage Scopes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Allowed Usage (leave empty = all allowed)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["FILM", "ANIMATION", "ADVERTISING", "GAMING", "PRINT", "MERCHANDISE", "SOCIAL_MEDIA", "EDUCATION", "NEWS"].map((scope) => (
                    <label key={scope} className="flex items-center gap-1.5 p-2 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={editScopes.includes(scope)}
                        onChange={() => {
                          setEditScopes((prev) =>
                            prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
                          );
                        }}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prohibited Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prohibited Content (always blocked)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["ADULT", "POLITICAL", "VIOLENCE", "HATE", "FRAUD", "WEAPONS", "ILLEGAL"].map((scope) => (
                    <label key={scope} className="flex items-center gap-1.5 p-2 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={editProhibited.includes(scope)}
                        onChange={() => {
                          setEditProhibited((prev) =>
                            prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
                          );
                        }}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveLicensing}
                  disabled={licensingSaving}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition"
                >
                  {licensingSaving ? "Saving..." : "💾 Save Settings"}
                </button>
                <button
                  onClick={() => setShowLicensing(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
