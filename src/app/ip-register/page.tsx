"use client";
/**
 * /ip-register — AI IP Copyright Registration
 * Register AI-generated characters/content as IP assets with blockchain certification
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

// ── Types ──────────────────────────────────────────────────────────

type ContentType = "CHARACTER" | "ARTWORK" | "MUSIC" | "TEXT" | "VIDEO" | "3D_MODEL" | "OTHER";
type RegStatus = "DRAFT" | "CERTIFIED" | "ACTIVE" | "REVOKED" | "EXPIRED";
type CertificateType = "OWNERSHIP" | "LICENSE" | "CREATION" | "DERIVATIVE";

interface IPRegistration {
  id: string;
  title: string;
  description?: string | null;
  certificateNo: string;
  certificateType: CertificateType;
  rightsDeclared: string[];
  territorialScope: string;
  exclusivity: boolean;
  status: RegStatus;
  blockchainNetwork?: string;
  blockchainTxHash?: string | null;
  blockchainBlockNum?: number | null;
  certificateIpfsCid?: string | null;
  metadataIpfsCid?: string | null;
  certifiedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

interface AIContent {
  id: string;
  title: string;
  description?: string | null;
  contentType: ContentType;
  generationTool?: string | null;
  generationPrompt?: string | null;
  generationDate?: string | null;
  modelVersion?: string | null;
  cfgScale?: number | null;
  seed?: string | null;
  sampler?: string | null;
  originalFileUrl?: string | null;
  thumbnailUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  contentHash?: string | null;
  tags: string[];
  copyrightNotice?: string | null;
  isPublicDomain: boolean;
  ipfsCid?: string | null;
  ipRegistrations: IPRegistration[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

// ── Constants ───────────────────────────────────────────────────────

type IpRegTranslations = ReturnType<typeof useLanguage>["t"]["ipRegister"];

function getContentTypeLabels(t: IpRegTranslations): Record<ContentType, string> {
  return {
    CHARACTER: t.character,
    ARTWORK: t.artwork,
    MUSIC: t.music,
    TEXT: t.text,
    VIDEO: t.video,
    "3D_MODEL": t.model3d,
    OTHER: t.other,
  };
}

const CONTENT_TYPE_EMOJI: Record<ContentType, string> = {
  CHARACTER: "🎭",
  ARTWORK: "🖼️",
  MUSIC: "🎵",
  TEXT: "📝",
  VIDEO: "🎬",
  "3D_MODEL": "📦",
  OTHER: "📄",
};

function getCertificateTypeLabels(t: IpRegTranslations): Record<CertificateType, string> {
  return {
    OWNERSHIP: t.ownership,
    LICENSE: t.license,
    CREATION: t.creation,
    DERIVATIVE: t.derivative,
  };
}

function getStatusConfig(t: IpRegTranslations): Record<RegStatus, { label: string; color: string; bg: string; badge: string }> {
  return {
    DRAFT:     { label: t.draft,      color: "text-gray-600",    bg: "bg-gray-100",    badge: "📝" },
    CERTIFIED: { label: t.certified, color: "text-purple-700",  bg: "bg-purple-50",   badge: "🔗" },
    ACTIVE:    { label: t.active,    color: "text-green-700",   bg: "bg-green-50",    badge: "✅" },
    REVOKED:   { label: t.revoked,   color: "text-red-600",     bg: "bg-red-50",      badge: "❌" },
    EXPIRED:   { label: t.expired,   color: "text-yellow-600",  bg: "bg-yellow-50",   badge: "⏰" },
  };
}

const GENERATION_TOOLS = [
  "Midjourney v6",
  "Midjourney v5",
  "Stable Diffusion XL",
  "Stable Diffusion v1.5",
  "DALL-E 3",
  "DALL-E 2",
  "Adobe Firefly 3",
  "Flux Pro",
  "Ideogram 2.0",
  "Leonardo AI",
  "Runway Gen-3",
  "Sora",
  "Kling AI",
  "其他",
];

// ── Helpers ────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

async function computeHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── UploadZone sub-component ───────────────────────────────────────

interface UploadZoneProps {
  onFileSelected: (file: File, hash: string) => void;
  accept?: string;
  maxSizeMB?: number;
  t: IpRegTranslations;
}

function UploadZone({ onFileSelected, accept = "image/*", maxSizeMB = 20, t }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(t.fileTooLarge);
      return;
    }
    setError(null);
    setFile(f);
    try {
      const h = await computeHash(f);
      setHash(h);
      onFileSelected(f, h);
    } catch {
      setError(t.registrationFailed);
    }
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div>
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            <p className="text-sm text-gray-500">{file?.name} · {formatBytes(file?.size ?? 0)}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); setHash(null); }}
              className="text-xs text-red-500 hover:underline"
            >
              {t.remove}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">📤</div>
            <p className="font-medium text-gray-700">{t.dragDropUpload}</p>
            <p className="text-xs text-gray-400">{t.supportedFormats}</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hash && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400">{t.contentHash} (SHA-256):</p>
          <p className="text-xs font-mono text-gray-600 break-all">{hash}</p>
        </div>
      )}
    </div>
  );
}

// ── Certificate Modal ───────────────────────────────────────────────

interface CertModalProps {
  registration: IPRegistration;
  onClose: () => void;
  t: IpRegTranslations;
  statusConfig: Record<RegStatus, { label: string; color: string; bg: string; badge: string }>;
  certificateTypeLabels: Record<CertificateType, string>;
}

function CertificateModal({ registration, onClose, t, statusConfig, certificateTypeLabels }: CertModalProps) {
  const ipfsUrl = registration.certificateIpfsCid
    ? `https://cloudflare-ipfs.com/ipfs/${registration.certificateIpfsCid}`
    : null;

  const txUrl = registration.blockchainNetwork === "base"
    ? `https://basescan.org/tx/${registration.blockchainTxHash}`
    : registration.blockchainNetwork === "sepolia"
    ? `https://sepolia.etherscan.io/tx/${registration.blockchainTxHash}`
    : null;

  const cfg = statusConfig[registration.status] ?? statusConfig.DRAFT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📜</div>
              <div>
                <h2 className="text-white font-bold text-lg">AI IP {t.certifyOnChain}</h2>
                <p className="text-purple-200 text-xs font-mono">{registration.certificateNo}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.badge} {cfg.label}
          </span>
          <span className="text-xs text-gray-400">
            {certificateTypeLabels[registration.certificateType] ?? registration.certificateType}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.ipTitle}</p>
            <p className="font-semibold text-gray-900">{registration.title}</p>
          </div>

          {registration.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t.description}</p>
              <p className="text-sm text-gray-600">{registration.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t.certificateType}</p>
              <p className="text-sm text-gray-700">{certificateTypeLabels[registration.certificateType]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t.territorialScope}</p>
              <p className="text-sm text-gray-700">{registration.territorialScope}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t.rightsDeclared}</p>
              <p className="text-sm text-gray-700">{registration.rightsDeclared.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t.exclusivity}</p>
              <p className="text-sm text-gray-700">{registration.exclusivity ? t.exclusive : t.nonExclusive}</p>
            </div>
          </div>

          {registration.certifiedAt && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{t.certified} {t.time || ""}</p>
              <p className="text-sm text-gray-700">{new Date(registration.certifiedAt).toLocaleString("zh-CN")}</p>
            </div>
          )}

          {registration.blockchainTxHash && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">🔗 {t.certifyOnChain}</p>
              <p className="text-xs text-gray-500">{t.network}: <span className="font-mono text-gray-700">{registration.blockchainNetwork}</span></p>
              <p className="text-xs text-gray-500 break-all">
                Tx: <span className="font-mono text-purple-600">{registration.blockchainTxHash}</span>
              </p>
              {txUrl && (
                <a href={txUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline">
                  {t.viewCertificate || "View"} Etherscan ↗
                </a>
              )}
              {ipfsUrl && (
                <a href={ipfsUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline ml-3">
                  {t.viewCertificate || "View"} IPFS ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{t.poweredBy} PortraitPay AI</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

export default function IPRegisterPage() {
  const router = useRouter();
  const { t: i18n, locale } = useLanguage();
  const ipRegT = i18n.ipRegister;
  const [tab, setTab] = useState<"register" | "list">("register");
  const [contents, setContents] = useState<AIContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [certStatus, setCertStatus] = useState<{ id: string; message: string } | null>(null);
  const [selectedCert, setSelectedCert] = useState<IPRegistration | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    contentType: "CHARACTER" as ContentType,
    generationTool: "",
    generationPrompt: "",
    generationDate: "",
    modelVersion: "",
    cfgScale: "",
    seed: "",
    sampler: "",
    tags: "",
    copyrightNotice: "",
    licenseScope: [] as string[],
    isPublicDomain: false,
    thirdPartyRights: false,
  });
  const [uploadedFile, setUploadedFile] = useState<{ file: File | null; hash: string | null }>({ file: null, hash: null });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const LICENSE_SCOPES = ["commercial", "editorial", "advertising", "product", "digital", "print", "broadcast"];

  const contentTypeLabels = getContentTypeLabels(ipRegT);
  const certificateTypeLabels = getCertificateTypeLabels(ipRegT);
  const statusConfig = getStatusConfig(ipRegT);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ip-register");
      const json: ApiResponse<AIContent[]> = await res.json();
      if (json.success) setContents(json.data);
    } catch (err) {
      console.error("Failed to fetch IP contents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "list") fetchContents();
  }, [tab, fetchContents]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = ipRegT.ipTitle + " " + (ipRegT.required || "is required");
    if (!form.generationTool.trim()) errs.generationTool = ipRegT.generationTool + " " + (ipRegT.required || "is required");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelected = (file: File, hash: string) => {
    setUploadedFile({ file, hash });
  };

  const toggleLicenseScope = (scope: string) => {
    setForm((f) => ({
      ...f,
      licenseScope: f.licenseScope.includes(scope)
        ? f.licenseScope.filter((s) => s !== scope)
        : [...f.licenseScope, scope],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/ip-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          generationDate: form.generationDate || undefined,
          cfgScale: form.cfgScale ? parseFloat(form.cfgScale) : undefined,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          contentHash: uploadedFile.hash,
          originalFileUrl: uploadedFile.file ? `local://${uploadedFile.file.name}` : undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        alert(json.error || ipRegT.registrationFailed);
        return;
      }

      // Reset form
      setForm({
        title: "", description: "", contentType: "CHARACTER", generationTool: "",
        generationPrompt: "", generationDate: "", modelVersion: "",
        cfgScale: "", seed: "", sampler: "", tags: "",
        copyrightNotice: "", licenseScope: [], isPublicDomain: false, thirdPartyRights: false,
      });
      setUploadedFile({ file: null, hash: null });

      // Switch to list
      setTab("list");
      fetchContents();
    } catch (err) {
      console.error("Submit failed:", err);
      alert(ipRegT.submitFailed || ipRegT.registrationFailed || "Submission failed, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCertify = async (contentId: string) => {
    if (!confirm(ipRegT.certifyConfirmMsg || `Confirm blockchain certification on Base Mainnet?\nGas fees will be deducted.`)) return;

    setCertifyingId(contentId);
    setCertStatus({ id: contentId, message: ipRegT.connectingBlockchain || "Connecting to blockchain..." });

    try {
      setCertStatus({ id: contentId, message: ipRegT.uploadingIpfs || "Uploading metadata to IPFS..." });
      const res = await fetch(`/api/ip-register/${contentId}/certify`, { method: "POST" });
      const json = await res.json();

      if (!json.success) {
        setCertStatus({ id: contentId, message: `❌ ${ipRegT.certifyFailed || "Certification failed"}: ${json.error}` });
        setTimeout(() => setCertStatus(null), 5000);
        return;
      }

      setCertStatus({
        id: contentId,
        message: `✅ ${ipRegT.certConfirmed || "Certificate confirmed!"} Tx: ${json.data.blockchainTxHash?.slice(0, 14)}...`,
      });

      setTimeout(() => {
        setCertStatus(null);
        fetchContents();
      }, 3000);
    } catch (err) {
      console.error("Certify failed:", err);
      setCertStatus({ id: contentId, message: `❌ ${ipRegT.networkError || "Network error"}` });
      setTimeout(() => setCertStatus(null), 5000);
    } finally {
      setCertifyingId(null);
    }
  };

  const latestReg = (content: AIContent) =>
    content.ipRegistrations?.[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🎨 {ipRegT.title}
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 tracking-wide">
                    DEMO
                  </span>
                </h1>
                <p className="text-xs text-gray-500">{ipRegT.subtitle}</p>
              </div>
              <div className="ml-auto shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <span>⚠️</span>
                    <span>{ipRegT.demoWarning}</span>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/portraits" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              ← {ipRegT.backToPortraits}
            </Link>
            <ThemeToggle />
            <LanguageToggle />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-1 -mb-px">
            {[
              { key: "register", label: ipRegT.newRegistration, icon: "✍️" },
              { key: "list", label: ipRegT.myRegistrations, icon: "📋" },
            ].map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key as "register" | "list")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === tabItem.key
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tabItem.icon} {tabItem.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Register Tab ── */}
        {tab === "register" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Purple gradient header */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-8 py-6">
                <h2 className="text-xl font-bold text-white">{ipRegT.registerAssetTitle || ipRegT.title}</h2>
                <p className="text-purple-100 text-sm mt-1">
                  {ipRegT.registerAssetDesc || ipRegT.subtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* Section 1: AI Content Upload */}
                <section>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    {ipRegT.generationInfo}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {ipRegT.originalFile} <span className="text-red-500">*</span>
                      </label>
                      <UploadZone onFileSelected={handleFileSelected} maxSizeMB={20} t={ipRegT} />
                      <p className="mt-1.5 text-xs text-gray-400">
                        {ipRegT.supportedFormatsDesc || ipRegT.supportedFormats}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {ipRegT.ipTitle} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder={ipRegT.ipTitlePlaceholder}
                        maxLength={200}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          errors.title ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-purple-200 focus:border-purple-300"
                        }`}
                      />
                      {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.description}</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder={ipRegT.descriptionPlaceholder}
                        rows={3}
                        maxLength={2000}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.contentType}</label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {(Object.keys(contentTypeLabels) as ContentType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, contentType: type }))}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                              form.contentType === type
                                ? "border-purple-400 bg-purple-50 text-purple-700"
                                : "border-gray-200 hover:bg-gray-50 text-gray-600"
                            }`}
                          >
                            <span>{CONTENT_TYPE_EMOJI[type]}</span>
                            <span className="text-center leading-tight">{contentTypeLabels[type]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.tags} <span className="text-xs text-gray-400">({ipRegT.tagsHint})</span></label>
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                        placeholder={ipRegT.tagsPlaceholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                      />
                    </div>
                  </div>
                </section>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Section 2: AI Generation Info */}
                <section>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    {ipRegT.generationInfo}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {ipRegT.generationTool} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        list="generation-tools"
                        value={form.generationTool}
                        onChange={(e) => setForm((f) => ({ ...f, generationTool: e.target.value }))}
                        placeholder={ipRegT.generationToolPlaceholder}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          errors.generationTool ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-purple-200 focus:border-purple-300"
                        }`}
                      />
                      <datalist id="generation-tools">
                        {GENERATION_TOOLS.map((t) => <option key={t} value={t} />)}
                      </datalist>
                      {errors.generationTool && <p className="mt-1 text-xs text-red-600">{errors.generationTool}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.modelVersion}</label>
                      <input
                        type="text"
                        value={form.modelVersion}
                        onChange={(e) => setForm((f) => ({ ...f, modelVersion: e.target.value }))}
                        placeholder={ipRegT.modelVersionPlaceholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.prompt}</label>
                      <textarea
                        value={form.generationPrompt}
                        onChange={(e) => setForm((f) => ({ ...f, generationPrompt: e.target.value }))}
                        placeholder={ipRegT.promptPlaceholder}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.generationDate}</label>
                      <input
                        type="date"
                        value={form.generationDate}
                        onChange={(e) => setForm((f) => ({ ...f, generationDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CFG Scale</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={form.cfgScale}
                        onChange={(e) => setForm((f) => ({ ...f, cfgScale: e.target.value }))}
                        placeholder={ipRegT.cfgScalePlaceholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seed</label>
                      <input
                        type="text"
                        value={form.seed}
                        onChange={(e) => setForm((f) => ({ ...f, seed: e.target.value }))}
                        placeholder={ipRegT.seedPlaceholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sampler</label>
                      <input
                        type="text"
                        value={form.sampler}
                        onChange={(e) => setForm((f) => ({ ...f, sampler: e.target.value }))}
                        placeholder={ipRegT.samplerPlaceholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                  </div>
                </section>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Section 3: Rights Declaration */}
                <section>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    {ipRegT.rightsDeclared}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{ipRegT.copyrightNotice}</label>
                      <textarea
                        value={form.copyrightNotice}
                        onChange={(e) => setForm((f) => ({ ...f, copyrightNotice: e.target.value }))}
                        placeholder={ipRegT.copyrightNoticePlaceholder}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{ipRegT.licenseScopeLabel ?? ipRegT.licenseScope}</label>
                      <div className="flex flex-wrap gap-2">
                        {LICENSE_SCOPES.map((scope) => (
                          <button
                            key={scope}
                            type="button"
                            onClick={() => toggleLicenseScope(scope)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              form.licenseScope.includes(scope)
                                ? "border-purple-400 bg-purple-50 text-purple-700"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {scope}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isPublicDomain}
                          onChange={(e) => setForm((f) => ({ ...f, isPublicDomain: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{ipRegT.publicDomainDeclare ?? ipRegT.publicDomain}</span>
                          <p className="text-xs text-gray-400">{ipRegT.publicDomainDeclareDesc ?? ipRegT.publicDomainDesc}</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.thirdPartyRights}
                          onChange={(e) => setForm((f) => ({ ...f, thirdPartyRights: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{ipRegT.thirdPartyRightsDeclare ?? ipRegT.thirdPartyRights}</span>
                          <p className="text-xs text-gray-400">{ipRegT.thirdPartyRightsDeclareDesc ?? ipRegT.thirdPartyRightsDesc}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Submit */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        {ipRegT.registering}
                      </>
                    ) : (
                      <>🎨 {ipRegT.registerNow}</>
                    )}
                  </button>
                  <p className="text-xs text-gray-400">
                    {ipRegT.registerFreeDesc || ipRegT.registerNow + " — free, gas fees apply"}
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── List Tab ── */}
        {tab === "list" && (
          <div>
            {/* Certification status banner */}
            {certStatus && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800 flex items-center gap-2">
                🔗 {certStatus.message}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin h-8 w-8 border-3 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : contents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">{ipRegT.noRegistrations}</h2>
                <p className="text-gray-400 mb-6 max-w-sm">
                  {ipRegT.createFirst}
                </p>
                <button
                  onClick={() => setTab("register")}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  {ipRegT.registerNow}
                </button>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: ipRegT.myRegistrations, value: contents.length, emoji: "📦", color: "text-gray-700" },
                    { label: ipRegT.certified, value: contents.filter(c => latestReg(c)?.status === "CERTIFIED").length, emoji: "🔗", color: "text-purple-700" },
                    { label: ipRegT.draft, value: contents.filter(c => latestReg(c)?.status === "DRAFT").length, emoji: "📝", color: "text-gray-500" },
                    { label: ipRegT.character, value: contents.filter(c => c.contentType === "CHARACTER").length, emoji: "🎭", color: "text-blue-700" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-400 mb-1">{stat.emoji} {stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {contents.map((content) => {
                    const reg = latestReg(content);
                    const cfg = reg ? (statusConfig[reg.status] ?? statusConfig.DRAFT) : statusConfig.DRAFT;
                    const isCertifying = certifyingId === content.id;

                    return (
                      <div key={content.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        {/* Thumbnail */}
                        <div
                          className="relative w-full overflow-hidden"
                          style={{ height: "180px" }}
                        >
                          {content.thumbnailUrl || content.originalFileUrl ? (
                            <img
                              src={content.thumbnailUrl ?? content.originalFileUrl!}
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                              <span className="text-5xl">{CONTENT_TYPE_EMOJI[content.contentType] ?? "📄"}</span>
                            </div>
                          )}

                          {/* Status badge */}
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.color}`}>
                              {cfg.badge} {cfg.label}
                            </span>
                          </div>

                          {/* Content type badge */}
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/80 text-gray-600 backdrop-blur-sm">
                              {CONTENT_TYPE_EMOJI[content.contentType]} {contentTypeLabels[content.contentType]}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-2 p-4 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{content.title}</h3>

                          {content.generationTool && (
                            <p className="text-xs text-gray-400 truncate">🛠️ {content.generationTool}</p>
                          )}

                          {reg && (
                            <p className="text-xs font-mono text-gray-400">📜 {reg.certificateNo}</p>
                          )}

                          {content.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {content.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 text-xs rounded-full bg-purple-50 text-purple-600">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Blockchain info */}
                          {reg?.blockchainTxHash && (
                            <div className="mt-auto pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-400 truncate">
                                🔗 Tx: {reg.blockchainTxHash.slice(0, 10)}...{reg.blockchainTxHash.slice(-6)}
                              </p>
                              {reg.certificateIpfsCid && (
                                <p className="text-xs text-gray-400 truncate">
                                  📦 IPFS: {reg.certificateIpfsCid.slice(0, 12)}...
                                </p>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            {reg && (
                              <button
                                onClick={() => setSelectedCert(reg)}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                📜 {ipRegT.viewCertificate}
                              </button>
                            )}

                            {(!reg || reg.status === "DRAFT") && (
                              <button
                                onClick={() => handleCertify(content.id)}
                                disabled={isCertifying}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                              >
                                {isCertifying ? "🔗 " + (ipRegT.certifyingOnChain ?? ipRegT.certifying) : "🔗 DEMO " + ipRegT.certifyOnChain}
                              </button>
                            )}

                            <button
                              onClick={() => navigator.clipboard.writeText(content.id)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              title={ipRegT.copyIdLabel ?? ipRegT.copyId}
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          registration={selectedCert}
          onClose={() => setSelectedCert(null)}
          t={ipRegT}
          statusConfig={statusConfig}
          certificateTypeLabels={certificateTypeLabels}
        />
      )}
    </div>
  );
}

