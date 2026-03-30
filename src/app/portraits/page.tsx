"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortraitCard from "@/components/portrait/PortraitCard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SkeletonGrid, Skeleton } from "@/components/ui/Skeleton";

interface Portrait {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  thumbnailUrl?: string | null;
  originalImageUrl?: string | null;
  imageHash?: string | null;
  blockchainTxHash?: string | null;
  ipfsCid?: string | null;
  certifiedAt?: string | null;
  createdAt: string;
  isPublic: boolean;
}

const STATUS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "DRAFT", label: "草稿" },
  { value: "UNDER_REVIEW", label: "审核中" },
  { value: "ACTIVE", label: "已认证" },
  { value: "SUSPENDED", label: "已暂停" },
  { value: "ARCHIVED", label: "已归档" },
];

export default function PortraitsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [certifyStatus, setCertifyStatus] = useState<{ id: string; message: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("pp_user");
    if (!raw) { window.location.href = "/login"; return; }
    try { setUser(JSON.parse(raw)); } catch { window.location.href = "/login"; }
    finally { setChecking(false); }
  }, []);

  const fetchPortraits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/portraits?${params.toString()}`);
      const json = await res.json();
      if (json.success) setPortraits(json.data as Portrait[]);
    } catch {
      // Fallback mock data
      setPortraits([
        { id: "1", title: "Official Portrait — Jane D.", category: "celebrity", status: "ACTIVE", thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: "0x7a3f4b8c9e2d1a0f", ipfsCid: "QmXxx", certifiedAt: new Date().toISOString(), createdAt: new Date().toISOString(), isPublic: true, description: null },
        { id: "2", title: "Studio Portrait — S.K.", category: "artist", status: "UNDER_REVIEW", thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: null, ipfsCid: null, certifiedAt: null, createdAt: new Date(Date.now() - 86400000).toISOString(), isPublic: true, description: null },
        { id: "3", title: "Concert Photo — M.W.", category: "artist", status: "DRAFT", thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: null, ipfsCid: null, certifiedAt: null, createdAt: new Date(Date.now() - 172800000).toISOString(), isPublic: false, description: null },
        { id: "4", title: "Corporate Headshot — A.L.", category: "business", status: "ACTIVE", thumbnailUrl: null, originalImageUrl: null, imageHash: "0xabc123", blockchainTxHash: "0xb2d1f8a0e3c4", ipfsCid: "QmAbc", certifiedAt: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date(Date.now() - 604800000).toISOString(), isPublic: true, description: null },
        { id: "5", title: "Event Photo — R.K.", category: "celebrity", status: "ARCHIVED", thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: null, ipfsCid: null, certifiedAt: null, createdAt: new Date(Date.now() - 2592000000).toISOString(), isPublic: false, description: null },
      ]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!checking) fetchPortraits();
  }, [checking, fetchPortraits]);

  const handleCertify = async (id: string) => {
    if (!confirm("Certify this portrait on the Ethereum Sepolia blockchain?")) return;
    setCertifyingId(id);
    setCertifyStatus({ id, message: "Starting certification..." });
    try {
      setCertifyStatus({ id, message: "Uploading to IPFS..." });
      const res = await fetch(`/api/portraits/${id}/certify`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const json = await res.json();
      if (!json.success) { setCertifyStatus({ id, message: `❌ Failed: ${json.error}` }); setTimeout(() => setCertifyStatus(null), 5000); return; }
      setCertifyStatus({ id, message: `✅ Certified! Tx: ${json.data.blockchainTxHash?.slice(0, 14)}...` });
      setTimeout(() => { setCertifyStatus(null); fetchPortraits(); }, 3000);
    } catch { setCertifyStatus({ id, message: "❌ Network error" }); setTimeout(() => setCertifyStatus(null), 5000); }
    finally { setCertifyingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this portrait?")) return;
    try {
      const res = await fetch(`/api/portraits/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) setPortraits((prev) => prev.filter((p) => p.id !== id));
    } catch { /* silent */ }
  };

  const filtered = portraits.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  const counts: Record<string, number> = {};
  portraits.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardShell
      title="肖像管理"
      subtitle={`共 ${portraits.length} 个肖像 · ${counts["ACTIVE"] ?? 0} 已上链`}
      action={
        <Link href="/portraits/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          上传肖像
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Certification status banner */}
        {certifyStatus && (
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full flex-shrink-0" />
            <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
              🔗 {certifyStatus.message}
            </p>
          </div>
        )}

        {/* Toolbar: search + filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索肖像标题..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-300 dark:focus:border-blue-600 placeholder-gray-400"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
            {STATUS_OPTIONS.map((opt) => {
              const count = opt.value ? counts[opt.value] ?? 0 : portraits.length;
              return (
                <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                    ${statusFilter === opt.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  {opt.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === opt.value ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid count={8} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {search ? "没有找到匹配的肖像" : "还没有肖像"}
            </h2>
            <p className="text-gray-400 mb-6 max-w-sm">
              {search ? "试试其他关键词" : "上传你的第一个肖像，开始区块链认证之旅"}
            </p>
            <Link href="/portraits/upload"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              上传肖像
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((portrait) => (
              <PortraitCard
                key={portrait.id}
                portrait={portrait}
                onView={(id) => router.push(`/portraits/${id}`)}
                onCertify={handleCertify}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
