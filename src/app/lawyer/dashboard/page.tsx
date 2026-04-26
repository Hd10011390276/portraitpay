"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface Case {
  id: string;
  plaintiffName: string;
  defendantName: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  description: string;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

export default function LawyerDashboard() {
  const { t, isZh } = useLanguage();
  // In a real app, fetch from /api/lawyers/cases
  const cases: Case[] = [];

  const pendingCount = 0;
  const inProgressCount = 0;
  const resolvedCount = 0;

  return (
    <DashboardShell
      title={isZh ? "律师工作台" : "Lawyer Dashboard"}
      subtitle={isZh ? "管理您的肖像权保护案件" : "Manage your portrait rights protection cases"}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={isZh ? "待处理案件" : "Pending Cases"}
          value={pendingCount}
          color="#f59e0b"
        />
        <StatCard
          label={isZh ? "处理中案件" : "In Progress"}
          value={inProgressCount}
          color="#3b82f6"
        />
        <StatCard
          label={isZh ? "已解决案件" : "Resolved"}
          value={resolvedCount}
          color="#22c55e"
        />
        <StatCard
          label={isZh ? "案件总数" : "Total Cases"}
          value={cases.length}
          color="#1e293b"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {isZh ? "案件列表" : "Cases List"}
          </h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          {isZh ? "暂无案件" : "No cases yet"}
        </div>
      </div>
    </DashboardShell>
  );
}
