"use client";
/**
 * /ip-register — AI IP Copyright Registration
 * Register AI-generated characters/content as IP assets with blockchain certification
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  CHARACTER: "AI 角色/头像",
  ARTWORK: "AI 艺术作品",
  MUSIC: "AI 音乐",
  TEXT: "AI 文本内容",
  VIDEO: "AI 视频",
  "3D_MODEL": "3D 模型",
  OTHER: "其他",
};

const CONTENT_TYPE_EMOJI: Record<ContentType, string> = {
  CHARACTER: "🎭",
  ARTWORK: "🖼️",
  MUSIC: "🎵",
  TEXT: "📝",
  VIDEO: "🎬",
  "3D_MODEL": "📦",
  OTHER: "📄",
};

const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  OWNERSHIP: "所有权证明",
  LICENSE: "授权许可",
  CREATION: "创作证明",
  DERIVATIVE: "衍生作品证明",
};

const STATUS_CONFIG: Record<RegStatus, { label: string; color: string; bg: string; badge: string }> = {
  DRAFT:     { label: "草稿",    color: "text-gray-600", bg: "bg-gray-100",  badge: "📝" },
  CERTIFIED: { label: "已认证", color: "text-purple-700", bg: "bg-purple-50", badge: "🔗" },
  ACTIVE:    { label: "有效",    color: "text-green-700", bg: "bg-green-50",  badge: "✅" },
  REVOKED:   { label: "已撤销",  color: "text-red-600",   bg: "bg-red-50",    badge: "❌" },
  EXPIRED:   { label: "已过期",  color: "text-yellow-600", bg: "bg-yellow-50", badge: "⏰" },
};

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
}

function UploadZone({ onFileSelected, accept = "image/*", maxSizeMB = 20 }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`文件大小不能超过 ${maxSizeMB}MB`);
      return;
    }
    setError(null);
    setFile(f);
    try {
      const h = await computeHash(f);
      setHash(h);
      onFileSelected(f, h);
    } catch {
      setError("文件哈希计算失败");
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
              移除
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">📤</div>
            <p className="font-medium text-gray-700">拖拽文件或点击上传</p>
            <p className="text-xs text-gray-400">支持 JPG/PNG/GIF/WebP/SVG，最大 {maxSizeMB}MB</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hash && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400">SHA-256 哈希（用于链上存证）:</p>
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
}

function CertificateModal({ registration, onClose }: CertModalProps) {
  const ipfsUrl = registration.certificateIpfsCid
    ? `https://cloudflare-ipfs.com/ipfs/${registration.certificateIpfsCid}`
    : null;

  const txUrl = registration.blockchainNetwork === "sepolia"
    ? `https://sepolia.etherscan.io/tx/${registration.blockchainTxHash}`
    : null;

  const cfg = STATUS_CONFIG[registration.status] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📜</div>
              <div>
                <h2 className="text-white font-bold text-lg">AI 版权证书</h2>
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
            {CERTIFICATE_TYPE_LABELS[registration.certificateType] ?? registration.certificateType}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">作品名称</p>
            <p className="font-semibold text-gray-900">{registration.title}</p>
          </div>

          {registration.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">作品描述</p>
              <p className="text-sm text-gray-600">{registration.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">证书类型</p>
              <p className="text-sm text-gray-700">{CERTIFICATE_TYPE_LABELS[registration.certificateType]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">地域范围</p>
              <p className="text-sm text-gray-700">{registration.territorialScope}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">权利类型</p>
              <p className="text-sm text-gray-700">{registration.rightsDeclared.join(", ")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">专有性</p>
              <p className="text-sm text-gray-700">{registration.exclusivity ? "专有" : "非专有"}</p>
            </div>
          </div>

          {registration.certifiedAt && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">认证时间</p>
              <p className="text-sm text-gray-700">{new Date(registration.certifiedAt).toLocaleString("zh-CN")}</p>
            </div>
          )}

          {registration.blockchainTxHash && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">🔗 区块链存证</p>
              <p className="text-xs text-gray-500">网络: <span className="font-mono text-gray-700">{registration.blockchainNetwork}</span></p>
              <p className="text-xs text-gray-500 break-all">
                Tx: <span className="font-mono text-purple-600">{registration.blockchainTxHash}</span>
              </p>
              {txUrl && (
                <a href={txUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline">
                  在 Etherscan 查看 ↗
                </a>
              )}
              {ipfsUrl && (
                <a href={ipfsUrl} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline ml-3">
                  在 IPFS 查看 ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">由 PortraitPay AI 平台认证生成</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

export default function IPRegisterPage() {
  const router = useRouter();
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
    if (!form.title.trim()) errs.title = "请输入作品标题";
    if (!form.generationTool.trim()) errs.generationTool = "请选择或输入生成工具";
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
        alert(json.error || "注册失败");
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
      alert("提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCertify = async (contentId: string) => {
    if (!confirm("确认在以太坊 Sepolia 链上生成区块链版权证书？\n这将扣除少量 gas 费用。")) return;

    setCertifyingId(contentId);
    setCertStatus({ id: contentId, message: "正在连接区块链..." });

    try {
      setCertStatus({ id: contentId, message: "上传元数据到 IPFS..." });
      const res = await fetch(`/api/ip-register/${contentId}/certify`, { method: "POST" });
      const json = await res.json();

      if (!json.success) {
        setCertStatus({ id: contentId, message: `❌ 失败: ${json.error}` });
        setTimeout(() => setCertStatus(null), 5000);
        return;
      }

      setCertStatus({
        id: contentId,
        message: `✅ 证书生成成功！Tx: ${json.data.blockchainTxHash?.slice(0, 14)}...`,
      });

      setTimeout(() => {
        setCertStatus(null);
        fetchContents();
      }, 3000);
    } catch (err) {
      console.error("Certify failed:", err);
      setCertStatus({ id: contentId, message: "❌ 网络错误" });
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
                  🎨 AI IP 版权注册
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200 tracking-wide">
                    DEMO
                  </span>
                </h1>
                <p className="text-xs text-gray-500">为 AI 生成的角色和内容登记版权，建立权属证明</p>
              </div>
              <div className="ml-auto shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <span>⚠️</span>
                    <span>区块链存证为演示功能</span>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/portraits" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              ← 肖像管理
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-1 -mb-px">
            {[
              { key: "register", label: "注册新作品", icon: "✍️" },
              { key: "list", label: "我的证书", icon: "📋" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as "register" | "list")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.icon} {t.label}
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
                <h2 className="text-xl font-bold text-white">注册 AI 创作资产</h2>
                <p className="text-purple-100 text-sm mt-1">
                  完成注册后，可为作品生成区块链版权证书，确立 AI 生成内容的权属证明
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">

                {/* Section 1: AI Content Upload */}
                <section>
                  <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    AI 生成内容
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        上传作品文件 <span className="text-red-500">*</span>
                      </label>
                      <UploadZone onFileSelected={handleFileSelected} maxSizeMB={20} />
                      <p className="mt-1.5 text-xs text-gray-400">
                        支持图片、音视频、3D 模型等。文件 SHA-256 哈希将上链存证。
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        作品标题 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="例如：赛博朋克少女 · 霓虹城市 v2"
                        maxLength={200}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          errors.title ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-purple-200 focus:border-purple-300"
                        }`}
                      />
                      {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">作品描述</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="描述作品的创作背景、用途、风格等..."
                        rows={3}
                        maxLength={2000}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">内容类型</label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((type) => (
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
                            <span className="text-center leading-tight">{CONTENT_TYPE_LABELS[type]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标签 <span className="text-xs text-gray-400">(逗号分隔)</span></label>
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                        placeholder="赛博朋克, 少女, 霓虹, 未来感"
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
                    AI 生成信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI 生成工具 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        list="generation-tools"
                        value={form.generationTool}
                        onChange={(e) => setForm((f) => ({ ...f, generationTool: e.target.value }))}
                        placeholder="选择或输入 AI 工具名称"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">模型版本</label>
                      <input
                        type="text"
                        value={form.modelVersion}
                        onChange={(e) => setForm((f) => ({ ...f, modelVersion: e.target.value }))}
                        placeholder="例如: SDXL 1.0, v6 Midjourney"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">生成 Prompt</label>
                      <textarea
                        value={form.generationPrompt}
                        onChange={(e) => setForm((f) => ({ ...f, generationPrompt: e.target.value }))}
                        placeholder="描述生成该作品所使用的完整 prompt..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">生成日期</label>
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
                        placeholder="例如: 7.0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seed</label>
                      <input
                        type="text"
                        value={form.seed}
                        onChange={(e) => setForm((f) => ({ ...f, seed: e.target.value }))}
                        placeholder="随机种子值（如有）"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sampler</label>
                      <input
                        type="text"
                        value={form.sampler}
                        onChange={(e) => setForm((f) => ({ ...f, sampler: e.target.value }))}
                        placeholder="例如: DPM++ 2M Karras"
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
                    权利声明
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">版权声明文本</label>
                      <textarea
                        value={form.copyrightNotice}
                        onChange={(e) => setForm((f) => ({ ...f, copyrightNotice: e.target.value }))}
                        placeholder="例如: © 2024 [Name]. All rights reserved. Generated with Midjourney."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">许可使用范围</label>
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
                          <span className="text-sm font-medium text-gray-700">公有领域声明</span>
                          <p className="text-xs text-gray-400">放弃版权，进入公有领域</p>
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
                          <span className="text-sm font-medium text-gray-700">存在第三方权利</span>
                          <p className="text-xs text-gray-400">该作品可能包含第三方知识产权（如品牌、人物等）</p>
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
                        注册中...
                      </>
                    ) : (
                      <>🎨 注册作品</>
                    )}
                  </button>
                  <p className="text-xs text-gray-400">
                    注册免费，生成区块链证书将消耗少量 gas 费用
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
                <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有注册作品</h2>
                <p className="text-gray-400 mb-6 max-w-sm">
                  上传你的第一个 AI 创作作品，开始建立区块链版权证明
                </p>
                <button
                  onClick={() => setTab("register")}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                >
                  立即注册
                </button>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "已注册", value: contents.length, emoji: "📦", color: "text-gray-700" },
                    { label: "已认证", value: contents.filter(c => latestReg(c)?.status === "CERTIFIED").length, emoji: "🔗", color: "text-purple-700" },
                    { label: "草稿", value: contents.filter(c => latestReg(c)?.status === "DRAFT").length, emoji: "📝", color: "text-gray-500" },
                    { label: "AI 角色", value: contents.filter(c => c.contentType === "CHARACTER").length, emoji: "🎭", color: "text-blue-700" },
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
                    const cfg = reg ? (STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.DRAFT) : STATUS_CONFIG.DRAFT;
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
                              {CONTENT_TYPE_EMOJI[content.contentType]} {CONTENT_TYPE_LABELS[content.contentType]}
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
                                📜 证书
                              </button>
                            )}

                            {(!reg || reg.status === "DRAFT") && (
                              <button
                                onClick={() => handleCertify(content.id)}
                                disabled={isCertifying}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                              >
                                {isCertifying ? "🔗 认证中..." : "🔗 DEMO 区块链认证"}
                              </button>
                            )}

                            <button
                              onClick={() => navigator.clipboard.writeText(content.id)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              title="复制 ID"
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
        />
      )}
    </div>
  );
}

