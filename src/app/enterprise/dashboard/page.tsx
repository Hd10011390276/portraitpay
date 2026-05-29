"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AgencyHeader } from "@/components/enterprise/AgencyHeader";
import { MemberFolderTree } from "@/components/enterprise/MemberFolderTree";
import { Skeleton } from "@/components/ui/Skeleton";

interface AgencyData {
  agencyName: string;
  agencyType: string;
  memberCount?: number;
}

export default function EnterpriseDashboardPage() {
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgencyProfile() {
      try {
        const res = await fetch("/api/v1/agency/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAgency(data.agency);
          } else {
            setError(data.error || "Failed to load agency profile");
          }
        } else {
          setError("Failed to load agency profile");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchAgencyProfile();
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Enterprise Dashboard" subtitle="IP Member Management">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !agency) {
    return (
      <DashboardShell title="Enterprise Dashboard" subtitle="IP Member Management">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error || "No agency profile found"}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Enterprise Dashboard" subtitle="IP Member Management">
      <AgencyHeader
        agencyName={agency.agencyName}
        agencyType={agency.agencyType}
        memberCount={agency.memberCount || 0}
      />
      <MemberFolderTree />
    </DashboardShell>
  );
}