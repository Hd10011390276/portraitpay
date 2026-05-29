"use client";

import React, { useState, useEffect, useCallback } from "react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
  PENDING:     { label: "Pending",     color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  APPROVED:    { label: "Approved",    color: "text-green-600", bg: "bg-green-50 border-green-200" },
  REJECTED:    { label: "Rejected",    color: "text-red-600", bg: "bg-red-50 border-red-200" },
  EXPIRED:     { label: "Expired",     color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
};

interface KycUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  kycStatus: string;
  kycVerifiedAt: string | null;
  kycLevel: number | null;
  createdAt: string;
}

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "EXPIRED"];

export default function AdminKycPage() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("PENDING");
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("pp_access_token");
      const statusParam = activeStatus === "ALL" ? "" : `?status=${activeStatus}`;
      const res = await fetch(`/api/admin/kyc${statusParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) { setError("Access denied. Admin role required."); setUsers([]); return; }
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setUsers(json.data?.users ?? []);
    } catch (err) { setError("Failed to load users."); }
    finally { setLoading(false); }
  }, [activeStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: string, action: "APPROVED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ kycStatus: action }),
      });
      if (!res.ok) throw new Error(String(res.status));
      fetchUsers();
    } catch { alert("Action failed. Check console."); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ID Verification</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and manage user identity verification statuses.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeStatus === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Email</th>
                <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Level</th>
                <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Verified</th>
                <th className="text-right px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{u.name || "—"}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_MAP[u.kycStatus]?.bg ?? "bg-gray-50 border-gray-200"} ${STATUS_MAP[u.kycStatus]?.color ?? "text-gray-500"}`}>
                      {STATUS_MAP[u.kycStatus]?.label ?? u.kycStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{u.kycLevel ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-400 dark:text-gray-500 text-xs">
                    {u.kycVerifiedAt ? u.kycVerifiedAt.slice(0, 10) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.kycStatus === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleAction(u.id, "APPROVED")}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(u.id, "REJECTED")}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg ml-2"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
