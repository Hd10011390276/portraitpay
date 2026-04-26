"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

interface Case {
  id: string;
  plaintiffName: string;
  defendantName: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  description: string;
}

function CaseCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

export default function LawyerDashboard() {
  // In a real app, fetch from /api/lawyers/cases
  const cases: Case[] = [];

  return (
    <DashboardShell
      title="律师工作台"
      subtitle="管理您的肖像权保护案件"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CaseCard label="待处理案件" value={0} color="#f59e0b" />
        <CaseCard label="处理中案件" value={0} color="#3b82f6" />
        <CaseCard label="已解决案件" value={0} color="#22c55e" />
        <CaseCard label="案件总数" value={0} color="#1e293b" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">案件列表</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          暂无案件
        </div>
      </div>
    </DashboardShell>
  );
}
