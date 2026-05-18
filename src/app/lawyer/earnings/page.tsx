"use client";

/**
 * /lawyer/earnings — Lawyer earnings overview page
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export default function LawyerEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/lawyers/cases")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCases(j.data || []);
        else setError(j.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  const totalEarned = cases.reduce((sum: number, c: any) => sum + Number(c.lawyerFee || 0), 0);
  const totalCompensation = cases.reduce((sum: number, c: any) => sum + Number(c.compensation || 0), 0);
  const pendingConfirmation = cases
    .filter((c: any) => !c.platformConfirmed && c.status !== "CLOSED")
    .reduce((sum: number, c: any) => sum + Number(c.lawyerFee || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ← Back to Lawyer Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings Overview</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500 mb-1">Total Earned</div>
                <div className="text-3xl font-bold text-green-600">${totalEarned.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">{cases.length} case(s) total</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500 mb-1">Total Compensation</div>
                <div className="text-3xl font-bold text-blue-600">${totalCompensation.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">from handled cases</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm text-gray-500 mb-1">Pending Confirmation</div>
                <div className="text-3xl font-bold text-yellow-600">${pendingConfirmation.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">awaiting platform confirm</div>
              </div>
            </div>

            {/* Case breakdown */}
            {cases.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">No earnings yet</p>
                <p className="text-sm text-gray-400 mt-1">Earnings from assigned cases will appear here</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Case</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Compensation</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Your Fee</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Platform</th>
                      <th className="text-right px-4 py-3 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c: any) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/lawyer/cases/${c.id}`} className="text-blue-600 hover:underline">
                            {c.id.slice(0, 8)}...
                          </Link>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {c.infringementReport?.portrait?.title || "Infringement Case"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">${Number(c.compensation || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-green-600">${Number(c.lawyerFee || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">${Number(c.platformFee || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.platformConfirmed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {c.platformConfirmed ? "Confirmed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}