"use client";

/**
 * /admin/enterprise/[id] — Admin enterprise detail page
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SUSPENDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function AdminEnterpriseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [enterprise, setEnterprise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/admin/enterprise/${id}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => {
        if (j.success) setEnterprise(j.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReview(action: "APPROVE" | "REJECT") {
    let rejectionReason = "";
    if (action === "REJECT") {
      rejectionReason = prompt("Rejection reason:") ?? "";
      if (!rejectionReason) return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/v1/admin/enterprise/${id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, rejectionReason }),
      });
      const json = await res.json();
      if (json.success) setEnterprise(json.data);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!enterprise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Enterprise not found</p>
          <Link href="/admin/enterprise" className="text-blue-600 underline">← Back to Enterprise</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/enterprise" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ← Back to Enterprise
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[enterprise.status] || "bg-gray-100"}`}>
                {enterprise.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{enterprise.companyName}</h1>
          </div>
          <span className="text-xs text-gray-400">ID: {enterprise.id}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Enterprise Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-gray-500 mb-1">Contact Name</div><div className="font-medium">{enterprise.contactName || "—"}</div></div>
            <div><div className="text-gray-500 mb-1">Email</div><div className="font-medium">{enterprise.contactEmail || "—"}</div></div>
            <div><div className="text-gray-500 mb-1">Phone</div><div className="font-medium">{enterprise.contactPhone || "—"}</div></div>
            <div><div className="text-gray-500 mb-1">Region</div><div className="font-medium">{enterprise.region || "—"}</div></div>
            {enterprise.licenseUrl && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">License URL</div>
                <a href={enterprise.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{enterprise.licenseUrl}</a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Business Details</h2>
          <div className="space-y-3 text-sm">
            {enterprise.businessDescription && (
              <div className="flex gap-2 text-gray-500">
                <span className="w-24 flex-shrink-0">Description:</span>
                <span className="text-gray-900">{enterprise.businessDescription}</span>
              </div>
            )}
            {enterprise.website && (
              <div className="flex gap-2 text-gray-500">
                <span className="w-24 flex-shrink-0">Website:</span>
                <a href={enterprise.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{enterprise.website}</a>
              </div>
            )}
            <div className="flex gap-2 text-gray-500">
              <span className="w-24 flex-shrink-0">Created:</span>
              <span className="text-gray-900">{new Date(enterprise.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {enterprise.status === "PENDING" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-3">
            <button
              onClick={() => handleReview("APPROVE")}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleReview("REJECT")}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}