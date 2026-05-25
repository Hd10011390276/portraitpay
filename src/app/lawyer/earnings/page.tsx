"use client";
/**
 * /lawyer/earnings — Lawyer fee settings + earnings overview page
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

interface FeeFields {
  minCaseFee: string;
  hourlyRate: string;
  retainerFee: string;
  successFeeRate: string;
}

interface LawyerProfile {
  id: string;
  minCaseFee?: string;
  hourlyRate?: string;
  retainerFee?: string;
  successFeeRate?: number;
}

interface CaseItem {
  id: string;
  status: string;
  compensation: string;
  lawyerFee: string;
  platformFee: string;
  platformConfirmed: boolean;
  infringementReport?: { portrait?: { title?: string } };
  createdAt: string;
}

export default function LawyerEarningsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState<FeeFields>({
    minCaseFee: "",
    hourlyRate: "",
    retainerFee: "",
    successFeeRate: "20",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/lawyers/registration/me", { credentials: "include" }).then(r => r.json()),
      fetch("/api/lawyers/cases", { credentials: "include" }).then(r => r.json()),
    ]).then(([profileRes, casesRes]) => {
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setFees({
          minCaseFee: profileRes.data.minCaseFee ?? "",
          hourlyRate: profileRes.data.hourlyRate ?? "",
          retainerFee: profileRes.data.retainerFee ?? "",
          successFeeRate: String(profileRes.data.successFeeRate ?? "20"),
        });
      }
      if (casesRes.success) setCases(casesRes.data || []);
    }).catch(() => {/* silent */})
    .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/lawyers/registration/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          minCaseFee: fees.minCaseFee ? parseFloat(fees.minCaseFee) : null,
          hourlyRate: fees.hourlyRate ? parseFloat(fees.hourlyRate) : null,
          retainerFee: fees.retainerFee ? parseFloat(fees.retainerFee) : null,
          successFeeRate: fees.successFeeRate ? parseInt(fees.successFeeRate) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setEditing(false);
        toast({ type: "success", title: "Fee settings saved" });
      } else {
        toast({ type: "error", title: json.error || "Failed to save" });
      }
    } catch {
      toast({ type: "error", title: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const totalEarned = cases
    .filter((c) => c.status === "WON" || c.status === "RESOLVED")
    .reduce((s, c) => s + Number(c.lawyerFee || 0), 0);
  const pendingConfirmation = cases
    .filter((c) => !c.platformConfirmed && c.status !== "CLOSED")
    .reduce((s, c) => s + Number(c.lawyerFee || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ← Back to Lawyer Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings & Settings</h1>

        {/* Fee Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Fee Settings</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min. Case Fee (USD)</label>
                  <input
                    type="number"
                    value={fees.minCaseFee}
                    onChange={(e) => setFees({ ...fees, minCaseFee: e.target.value })}
                    placeholder="500"
                    min="0"
                    step="50"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate (USD)</label>
                  <input
                    type="number"
                    value={fees.hourlyRate}
                    onChange={(e) => setFees({ ...fees, hourlyRate: e.target.value })}
                    placeholder="300"
                    min="0"
                    step="10"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retainer Fee (USD)</label>
                  <input
                    type="number"
                    value={fees.retainerFee}
                    onChange={(e) => setFees({ ...fees, retainerFee: e.target.value })}
                    placeholder="1000"
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Success Fee (%)</label>
                  <input
                    type="number"
                    value={fees.successFeeRate}
                    onChange={(e) => setFees({ ...fees, successFeeRate: e.target.value })}
                    placeholder="20"
                    min="5"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">5–50%</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFees({
                      minCaseFee: profile?.minCaseFee ?? "",
                      hourlyRate: profile?.hourlyRate ?? "",
                      retainerFee: profile?.retainerFee ?? "",
                      successFeeRate: String(profile?.successFeeRate ?? "20"),
                    });
                  }}
                  className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Min. Case Fee</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {fees.minCaseFee ? `$${fees.minCaseFee}` : "—"}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hourly Rate</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {fees.hourlyRate ? `$${fees.hourlyRate}/hr` : "—"}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Retainer Fee</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {fees.retainerFee ? `$${fees.retainerFee}` : "—"}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Success Fee</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {fees.successFeeRate}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Earnings Overview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Earnings Overview</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Earned</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${totalEarned.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{cases.length} case(s)</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending Confirmation</div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    ${pendingConfirmation.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">awaiting confirm</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Cases</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {cases.length}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">all time</div>
                </div>
              </div>

              {cases.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No earnings yet. Cases will appear when you take on clients.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Case</th>
                        <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Compensation</th>
                        <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Your Fee</th>
                        <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Platform</th>
                        <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/lawyer/cases/${c.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                            >
                              #{c.id.slice(0, 8)}
                            </Link>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[160px]">
                              {c.infringementReport?.portrait?.title || "Infringement"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                            ${Number(c.compensation || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                            ${Number(c.lawyerFee || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                            ${Number(c.platformFee || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              c.status === "WON" || c.status === "RESOLVED"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : c.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}>
                              {c.status}
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
    </div>
  );
}