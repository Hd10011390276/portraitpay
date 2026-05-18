"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PortraitCard from "@/components/portrait/PortraitCard";
import { useLanguage } from "@/context/LanguageContext";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import ThemeToggle from "@/components/ThemeToggle";

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

function SearchContent() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const fetchPortraits = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch("/api/portraits");
      const json = await res.json();
      if (json.success) {
        let data = json.data as Portrait[];
        // Filter by public portraits only for search
        data = data.filter((p) => p.isPublic);
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          data = data.filter((p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
        }
        setPortraits(data);
      }
    } catch {
      // Fallback mock data for demo
      setPortraits([
        { id: "1", title: "Official Portrait — Jane D.", category: "celebrity", status: "ACTIVE" as const, thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: "0x7a3f4b8c9e2d1a0f", ipfsCid: "QmXxx", certifiedAt: new Date().toISOString(), createdAt: new Date().toISOString(), isPublic: true, description: null },
        { id: "2", title: "Studio Portrait — S.K.", category: "artist", status: "ACTIVE" as const, thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: "0xb2d1f8a0e3c4", ipfsCid: "QmAbc", certifiedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), isPublic: true, description: null },
        { id: "3", title: "Concert Photo — M.W.", category: "artist", status: "ACTIVE" as const, thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: "0xc3e2f9b1d4a5", ipfsCid: "QmDef", certifiedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString(), isPublic: true, description: null },
        { id: "4", title: "Corporate Headshot — A.L.", category: "business", status: "ACTIVE" as const, thumbnailUrl: null, originalImageUrl: null, imageHash: "0xabc123", blockchainTxHash: "0xb2d1f8a0e3c4", ipfsCid: "QmAbc", certifiedAt: new Date(Date.now() - 259200000).toISOString(), createdAt: new Date(Date.now() - 604800000).toISOString(), isPublic: true, description: null },
        { id: "5", title: "Event Photo — R.K.", category: "celebrity", status: "ACTIVE" as const, thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: null, ipfsCid: null, certifiedAt: null, createdAt: new Date(Date.now() - 2592000000).toISOString(), isPublic: true, description: null },
        { id: "6", title: "Modeling Portfolio — L.M.", category: "model", status: "ACTIVE" as const, thumbnailUrl: null, originalImageUrl: null, imageHash: null, blockchainTxHash: "0xd4f3a2c1b5e6", ipfsCid: "QmGhi", certifiedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 345600000).toISOString(), isPublic: true, description: null },
      ].filter((p) =>
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) as Portrait[]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    fetchPortraits(initialQuery);
  }, [initialQuery, fetchPortraits]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
    router.push(`/search?q=${encodeURIComponent(inputValue)}`, { scroll: false });
    fetchPortraits(inputValue);
  };

  const handleView = (id: string) => {
    router.push(`/portraits/${id}`);
  };

  const CERTIFIED_COUNT = portraits.filter((p) => p.status === "ACTIVE" && p.blockchainTxHash).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-default)",
        padding: "16px 0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div className="container" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "6px" }} />
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>PortraitPay AI</span>
          </Link>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: "480px" }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "var(--text-tertiary)", pointerEvents: "none" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.search.searchPlaceholder}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-primary)",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent-primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </form>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ThemeToggle />
            <Link href="/login" className="btn btn-primary btn-sm">
              {t.common?.signIn || t.nav?.signIn || "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: "48px 0" }}>
        <div className="container">
          {/* Page title */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              {query ? `${t.search.results}: "${query}"` : t.search.title}
            </h1>
            {searched && !loading && (
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {portraits.length} {t.search?.results || "results"}{CERTIFIED_COUNT > 0 && ` · ${CERTIFIED_COUNT} ${t.dashboard?.stats?.verified || "certified"}`}
              </p>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <SkeletonGrid count={8} />
          ) : portraits.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-default)",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                {t.search.noResults}
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                {t.search.tryDifferentKeyword}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link href="/" className="btn btn-secondary">
                  {t.common?.backHome || t.footer?.home || "Back to Home"}
                </Link>
                <Link href="/register" className="btn btn-primary">
                  {t.search?.registerPortrait || "Register Portrait"}
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}>
              {portraits.map((portrait) => (
                <PortraitCard
                  key={portrait.id}
                  portrait={portrait as any}
                  onView={handleView}
                  onCertify={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border-default)",
        padding: "32px 0",
        marginTop: "48px",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
            {t.footer?.copyright || "© 2026 PortraitPay AI. All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}