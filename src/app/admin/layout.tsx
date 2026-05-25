"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Admin Dashboard" subtitle="Manage platform operations">
      {children}
    </DashboardShell>
  );
}