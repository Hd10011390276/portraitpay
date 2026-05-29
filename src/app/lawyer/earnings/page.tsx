"use client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function LawyerEarningsPage() {
  const { t } = useLanguage();

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t.dashboard?.earnings || "Earnings"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t.earnings?.comingSoon || "Earnings dashboard coming soon."}
        </p>
      </div>
    </DashboardShell>
  );
}