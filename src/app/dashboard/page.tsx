"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton, SkeletonStatCard, SkeletonTableRow } from "@/components/ui/Skeleton";
import { useLanguage } from "@/context/LanguageContext";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Stat {
  label: string;
  value: string;
  delta?: string;
  color: string;
  bg: string;
}



function DashboardContent({ user }: { user: User }) {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentPortraits, setRecentPortraits] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [actors, setActors] = useState<any[]>([]);
  const [showActors, setShowActors] = useState(false);

  const getRoleLabel = (role: string) => {
    const roleKey = role.toLowerCase() as keyof typeof t.dashboard.roleLabels;
    return t.dashboard.roleLabels[roleKey] || role;
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const portraitsRes = await fetch('/api/portraits');
        if (portraitsRes.ok) {
          const portraitsData = await portraitsRes.json();
          const portraits = portraitsData.data?.slice(0, 5) || [];
          setRecentPortraits(portraits);
        }

        const txRes = await fetch('/api/v1/earnings/transactions');
        if (txRes.ok) {
          const txData = await txRes.json();
          const transactions = txData.data?.slice(0, 5) || [];
          setRecentTransactions(transactions);
        }

        const summaryRes = await fetch('/api/v1/earnings/summary');
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          const summary = summaryData.data || {};
          setStats([
            {
              label: t.dashboard.stats.certifiedPortraits,
              value: String(summary.certifiedPortraits || 0),
              delta: "",
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: t.dashboard.stats.monthlyEarnings,
              value: `$${(summary.availableBalance || 0).toLocaleString()}`,
              delta: "",
              color: "text-green-600",
              bg: "bg-green-50 dark:bg-green-900/20",
            },
            {
              label: t.dashboard.stats.pendingAuthorizations,
              value: String(summary.pendingAuthorizations || 0),
              delta: "",
              color: "text-yellow-600",
              bg: "bg-yellow-50 dark:bg-yellow-900/20",
            },
          ]);
        }

        // Fetch approved lawyers
        try {
          const lawyersRes = await fetch('/api/lawyers');
          if (lawyersRes.ok) {
            const lawyersData = await lawyersRes.json();
            setLawyers(lawyersData.data?.slice(0, 6) || []);
          }
        } catch (e) {
          console.error('Failed to fetch lawyers:', e);
        }

        // Fetch actors for discovery
        try {
          const actorsRes = await fetch('/api/actors');
          if (actorsRes.ok) {
            const actorsData = await actorsRes.json();
            setActors(actorsData.data || []);
          }
        } catch (e) {
          console.error('Failed to fetch actors:', e);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [t, isZh]);

  const initials = user?.name?.[0] ?? user?.email[0]?.toUpperCase() ?? "?";

  return (
    <DashboardShell
      title={`${t.dashboard.welcome}${user?.name ?? user?.email.split("@")[0]} 👋`}
      subtitle={t.dashboard.console}
      action={
        <Link
          href="/portraits/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t.dashboard.uploadPortrait}
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonStatCard key={i} />)
            : stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow`}
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.delta && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{stat.delta}</p>
                )}
              </div>
            ))}
        </div>

        {/* Two-col layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Recent Portraits */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t.dashboard.recentPortraits}
              </h2>
              <Link
                href="/portraits"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.dashboard.viewAll}
              </Link>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...Array(3)].map((_, i) => (
                  <SkeletonTableRow key={i} />
                ))}
              </div>
            ) : recentPortraits.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t.dashboard.noPortraits}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentPortraits.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                      {(p.thumbnailUrl || p.originalImageUrl) ? (
                        <img src={p.thumbnailUrl || p.originalImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                      ) : null}
                      <span className={(p.thumbnailUrl || p.originalImageUrl) ? 'hidden' : ''}>👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {p.title || p.name || "Untitled"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {p.status === "ACTIVE"
                          ? t.dashboard.status.onChain
                          : p.status === "UNDER_REVIEW"
                          ? t.dashboard.status.underReview
                          : p.status}
                      </p>
                    </div>
                    <Link
                      href={`/portraits/${p.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t.dashboard.view}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t.dashboard.recentEarnings}
              </h2>
              <Link
                href="/earnings"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.dashboard.earningsDetail}
              </Link>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...Array(3)].map((_, i) => (
                  <SkeletonTableRow key={i} />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t.dashboard.noTransactions}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {tx.type === "LICENSE_PURCHASE"
                          ? t.dashboard.transaction.licensePurchase
                          : tx.type === "ROYALTY_PAYOUT"
                          ? t.dashboard.transaction.royaltyIncome
                          : tx.type === "LICENSE_RENEWAL"
                          ? t.dashboard.transaction.renewal
                          : tx.type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {tx.portrait?.title || tx.description || "-"}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold flex-shrink-0 ${
                        tx.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}${Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Three-View Photos Gallery */}
        {recentPortraits.some(p => p.frontViewUrl || p.sideViewUrl || p.backViewUrl) && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📸</span>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Three-View Photos
                </h2>
              </div>
              <Link
                href="/portraits"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {recentPortraits.filter(p => p.frontViewUrl || p.sideViewUrl || p.backViewUrl).map((portrait) => (
                <div key={portrait.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {portrait.frontViewUrl ? (
                      <img
                        src={portrait.frontViewUrl}
                        alt={`${portrait.title} - Front View`}
                        className="w-full h-full object-cover"
                      />
                    ) : portrait.thumbnailUrl || portrait.originalImageUrl ? (
                      <img
                        src={portrait.thumbnailUrl || portrait.originalImageUrl}
                        alt={portrait.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">👤</span>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{portrait.title}</p>
                    <div className="flex gap-2 mt-2">
                      {portrait.frontViewUrl && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded">Front</span>
                      )}
                      {portrait.sideViewUrl && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">Side</span>
                      )}
                      {portrait.backViewUrl && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded">Back</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: t.dashboard.uploadPortrait,
              href: "/portraits/upload",
              icon: "📤",
              desc: t.dashboard.uploadDesc,
            },
            {
              label: t.dashboard.quickAction.viewEarnings,
              href: "/earnings",
              icon: "💰",
              desc: t.dashboard.viewEarningsDesc,
            },
            {
              label: t.dashboard.quickAction.reportInfringement,
              href: "/report",
              icon: "🚨",
              desc: t.dashboard.reportInfringementDesc,
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.desc}</p>
            </Link>
          ))}
          <button
            onClick={() => setShowActors(!showActors)}
            className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all text-left"
          >
            <div className="text-3xl mb-3">🎭</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {t.dashboard.discoverActors || "Discover Actors"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.dashboard.discoverActorsDesc || "Browse actors and their media kits"}
            </p>
          </button>
        </div>

        {/* Discover Actors Panel */}
        {showActors && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {t.dashboard.actorsDirectory || "Actors Directory"}
                </h2>
              </div>
              <button
                onClick={() => setShowActors(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            {actors.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t.dashboard.noActors || "No actors found"}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {actors.map((actor) => (
                  <div
                    key={actor.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                      {actor.image ? (
                        <img src={actor.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(actor.name || actor.displayName || "?")[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {actor.displayName || actor.name || "Unnamed Actor"}
                      </p>
                      {actor.bio && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {actor.bio}
                        </p>
                      )}
                      {actor.mediaKitUrl ? (
                        <a
                          href={actor.mediaKitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📎 {t.dashboard.viewMediaKit || "View Media Kit"}
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                          {actor.id === user?.id ? t.dashboard.setMediaKit || "Set your Media Kit in Settings" : t.dashboard.mediaKitHidden || "Media Kit not shared"}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        actor.mediaKitVisibility === "PUBLIC"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : actor.mediaKitVisibility === "VERIFIED_CREATORS"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {actor.mediaKitVisibility === "PUBLIC"
                          ? t.dashboard.visibilityPublic || "Public"
                          : actor.mediaKitVisibility === "VERIFIED_CREATORS"
                          ? t.dashboard.visibilityVerified || "Verified"
                          : t.dashboard.visibilityPrivate || "Private"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lawyer Directory */}
        {lawyers.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {t.dashboard.verifiedLawFirms}
                </h2>
              </div>
              <Link
                href="/lawyers"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.dashboard.viewAll}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
              {lawyers.map((lawyer) => (
                <div key={lawyer.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg flex-shrink-0">
                      🏛️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {lawyer.companyName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {lawyer.region}
                      </p>
                      <div className="mt-2 flex flex-col gap-1">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          👤 {lawyer.contactName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          📧 {lawyer.contactEmail}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          📞 {lawyer.contactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.name ?? t.dashboard.userCard.nameNotSet}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
              <div className="flex gap-3 mt-3">
                <Link
                  href="/settings"
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {t.dashboard.editProfile}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const json = await res.json();
        setUser(json.data?.user || json.user || null);
      } catch {
        window.location.href = "/login";
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <DashboardContent user={user} />;
}
