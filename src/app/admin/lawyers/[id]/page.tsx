"use client";

/**
 * /admin/lawyers/[id] — Admin lawyer registration detail page
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  REVIEWING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function AdminLawyerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/lawyers/${id}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => {
        if (j.success) setLawyer(j.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/admin/lawyers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const json = await res.json();
      if (json.success) setLawyer(json.data);
      else alert(json.error || "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/admin/lawyers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "REJECT", rejectionReason: reason }),
      });
      const json = await res.json();
      if (json.success) setLawyer(json.data);
      else alert(json.error || "Failed");
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

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Lawyer registration not found</p>
          <Link href="/admin/lawyers" className="text-blue-600 underline">← Back to Lawyers</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/lawyers" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ← Back to Lawyers
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[lawyer.status] || "bg-gray-100"}`}>
                {STATUS_LABELS[lawyer.status] || lawyer.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{lawyer.companyName}</h1>
            <p className="text-sm text-gray-500 mt-1">{lawyer.region} · {lawyer.contactEmail}</p>
          </div>
          <span className="text-xs text-gray-400">ID: {lawyer.id.slice(0, 8)}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Registration Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-gray-500 mb-1">Contact Name</div><div className="font-medium">{lawyer.contactName || "—"}</div></div>
            <div><div className="text-gray-500 mb-1">Contact Email</div><div className="font-medium">{lawyer.contactEmail || "—"}</div></div>
            <div><div className="text-gray-500 mb-1">Contact Phone</div><div className="font-medium">{lawyer.contactPhone || "—"}</div></div>
            <div><div className="text-gray-500 mb-1">Region</div><div className="font-medium">{lawyer.region || "—"}</div></div>
            {lawyer.registrationType && (
              <div><div className="text-gray-500 mb-1">Type</div><div className="font-medium">{lawyer.registrationType}</div></div>
            )}
            {lawyer.licenseUrl && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">License URL</div>
                <a href={lawyer.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{lawyer.licenseUrl}</a>
              </div>
            )}
          </div>
        </div>

        {lawyer.status === "PENDING" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              Reject
            </button>
          </div>
        )}

        {lawyer.status === "REJECTED" && lawyer.rejectionReason && (
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h2 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h2>
            <p className="text-sm text-gray-600">{lawyer.rejectionReason}</p>
          </div>
        )}

        <div className="text-xs text-gray-400">
          <p>Submitted: {new Date(lawyer.createdAt).toLocaleString()}</p>
          {lawyer.reviewedAt && <p>Reviewed: {new Date(lawyer.reviewedAt).toLocaleString()}</p>}
        </div>
      </div>
    </div>
  );
}