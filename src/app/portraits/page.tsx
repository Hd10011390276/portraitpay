"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PortraitCard from "@/components/portrait/PortraitCard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SkeletonGrid, Skeleton } from "@/components/ui/Skeleton";
import { useLanguage } from "@/context/LanguageContext";

type PortraitStatus = "DRAFT" | "UNDER_REVIEW" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

interface Portrait {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: PortraitStatus;
  thumbnailUrl?: string | null;
  originalImageUrl?: string | null;
  imageHash?: string | null;
  blockchainTxHash?: string | null;
  ipfsCid?: string | null;
  certifiedAt?: string | null;
  createdAt: string;
  isPublic: boolean;
}

export default function PortraitsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [certifyStatus, setCertifyStatus] = useState<{ id: string; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [kycStatus, setKycStatus] = useState<string>("NOT_STARTED");

  const STATUS_OPTIONS = [
    { value: "", label: t.portraits.all },
    { value: "DRAFT", label: t.portraits.draft },
    { value: "UNDER_REVIEW", label: t.portraits.underReview },
    { value: "ACTIVE", label: t.portraits.active },
    { value: "SUSPENDED", label: t.portraits.suspended },
    { value: "ARCHIVED", label: t.portraits.archived },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) { window.location.href = "/login"; return; }
        const json = await res.json();
        setUser(json.data?.user || json.user || null);
        // Also fetch KYC status
        try {
          const kycRes = await fetch("/api/v1/kyc/status", { credentials: "include" });
          const kycJson = await kycRes.json();
          if (kycJson.success) setKycStatus(kycJson.data.status);
        } catch {}
      } catch { window.location.href = "/login"; }
      finally { setChecking(false); }
    };
    checkAuth();
  }, []);

  const fetchPortraits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/portraits?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) setPortraits(json.data as Portrait[]);
    } catch {
      setPortraits([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!checking) fetchPortraits();
  }, [checking, fetchPortraits]);

  const handleCertify = async (id: string) => {
    if (!confirm("Certify this portrait on the Base Mainnet blockchain?")) return;
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
    if (!window.confirm("确认删除此肖像？")) return;
    try {
      const res = await fetch(`/api/portraits/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setPortraits((prev) => prev.filter((p) => p.id !== id));
      } else {
        // 409 = already certified (cannot delete), 404 = not found, 403 = not yours
        if (res.status === 409) {
          alert("无法删除：已认证的肖像需要在详情页取消认证后才能删除");
        } else if (res.status === 403) {
          alert("无法删除：您不是此肖像的拥有者");
        } else if (res.status === 401) {
          alert("无法删除：请重新登录后再试");
        } else {
          console.error("[handleDelete] unexpected error", res.status, json.error);
          alert(`删除失败 (${res.status}): ${json.error || "未知错误"}`);
        }
      }
    } catch {
      alert("删除失败：网络错误");
    }
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
      title={t.sidebar.myPortraits}
      subtitle={`${t.portraits.total} ${portraits.length} ${t.portraits.onChain} · ${counts["ACTIVE"] ?? 0} ${t.portraits.active}`}
      action={
        <Link href="/portraits/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t.portraits.upload}
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KYC warning banner */}
        {kycStatus !== "APPROVED" && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t.portraits?.bannerKycRequired ?? "您尚未完成身份认证，上链功能受限"}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  完成身份认证后即可进行区块链上链
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/kyc")}
              className="flex-shrink-0 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t.portraits?.bannerGoVerify ?? "去认证"}
            </button>
          </div>
        )}


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
              placeholder={t.portraits.searchPlaceholder}
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
              {search ? t.portraits.noResults : t.portraits.noPortraits}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 mb-6 max-w-sm">
              {search ? t.portraits.tryDifferentKeyword : t.portraits.uploadFirstPortrait}
            </p>
            <Link href="/portraits/upload"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              {t.portraits.upload}
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
