"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton, SkeletonStatCard, SkeletonTableRow } from "@/components/ui/Skeleton";

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

const ROLE_LABELS: Record<string, string> = {
  USER: "普通用户",
  ARTIST: "艺人",
  AGENCY: "经纪公司",
  ENTERPRISE: "企业",
};

function DashboardContent({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentPortraits, setRecentPortraits] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setStats([
        { label: "已认证肖像", value: "12", delta: "+2 本月", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "本月收益", value: "¥3,840", delta: "+¥620", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
        { label: "待处理授权", value: "3", delta: "", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
        { label: "KYC 状态", value: "✅ 已认证", delta: "", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
      ]);
      setRecentPortraits([
        { id: "1", title: "Official Portrait — Jane D.", status: "ACTIVE", thumbnailUrl: null },
        { id: "2", title: "Concert Photo — M.W.", status: "UNDER_REVIEW", thumbnailUrl: null },
        { id: "3", title: "Studio Portrait — S.K.", status: "ACTIVE", thumbnailUrl: null },
      ]);
      setRecentTransactions([
        { id: "1", type: "LICENSE_PURCHASE", amount: 1200, portraitTitle: "Official Portrait — Jane D.", createdAt: new Date().toISOString() },
        { id: "2", type: "ROYALTY_PAYOUT", amount: 480, portraitTitle: "Studio Portrait — S.K.", createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: "3", type: "LICENSE_RENEWAL", amount: 2400, portraitTitle: "Concert Photo — M.W.", createdAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const initials = user?.name?.[0] ?? user?.email[0]?.toUpperCase() ?? "?";

  return (
    <DashboardShell
      title={`欢迎回来，${user?.name ?? user?.email.split("@")[0]} 👋`}
      subtitle="PortraitPay AI 控制台"
      action={
        <Link
          href="/portraits/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          上传肖像
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
            : stats.map((stat) => (
              <div key={stat.label}
                className={`rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow`}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.delta && <p className="text-xs text-green-600 mt-1 font-medium">{stat.delta}</p>}
              </div>
            ))}
        </div>

        {/* Two-col layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Recent Portraits */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">最近肖像</h2>
              <Link href="/portraits" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                查看全部 →
              </Link>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...Array(3)].map((_, i) => <SkeletonTableRow key={i} />)}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentPortraits.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-xl flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {p.status === "ACTIVE" ? "✅ 已上链认证" : "🔍 审核中"}
                      </p>
                    </div>
                    <Link href={`/portraits/${p.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      查看
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">最近收益</h2>
              <Link href="/earnings" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                收益明细 →
              </Link>
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...Array(3)].map((_, i) => <SkeletonTableRow key={i} />)}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {tx.type === "LICENSE_PURCHASE" ? "📋 授权购买" : tx.type === "ROYALTY_PAYOUT" ? "💰 版税收入" : "🔄 续期"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{tx.portraitTitle}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600 flex-shrink-0">
                      +¥{tx.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "上传肖像", href: "/portraits/upload", icon: "📤", desc: "注册新肖像到区块链" },
            { label: "查看收益", href: "/earnings", icon: "💰", desc: "查看授权收益明细" },
            { label: "申请认证", href: "/kyc", icon: "🔐", desc: "完成身份认证" },
            { label: "举报侵权", href: "/report", icon: "🚨", desc: "AI 检测侵权行为" },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all">
              <div className="text-3xl mb-3">{action.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* User Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.name ?? "未设置姓名"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                {user.role !== "USER" && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                    ✅ KYC 已完成
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
              <div className="flex gap-3 mt-3">
                <Link href="/kyc"
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  完成 KYC 认证 →
                </Link>
                <Link href="/settings"
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline">
                  账户设置
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
    const raw = localStorage.getItem("pp_user");
    if (!raw) {
      window.location.href = "/login";
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      window.location.href = "/login";
    } finally {
      setChecking(false);
    }
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">PP</span>
          </div>
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <DashboardContent user={user} />;
}
