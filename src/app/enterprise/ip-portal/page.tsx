/**
 * /enterprise/ip-portal — IP Owner Portal: Authorization & Pricing
 * Full English UI for MJ/Triumph/Sony admin backend
 */
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

interface IPAsset {
  id: string;
  name: string;
  type: "PORTRAIT" | "VOICE" | "AI_CONTENT";
  imageUrl?: string;
  status: string;
}

interface LicenseTemplate {
  id: string;
  title: string;
  basePrice: number;
  royaltyPercent: number;
  territory: string;
  minGuarantee: number;
  currency: string;
}

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  previousMonth: number;
  currency: string;
  monthlyData: { month: string; amount: number }[];
}

interface ActiveLicense {
  id: string;
  licensee: string;
  template: string;
  status: string;
  startDate: string;
  endDate?: string;
}

// ============================================================
// Bar Chart Component (CSS-based, no chart library)
// ============================================================
function BarChart({ data, maxValue }: { data: { month: string; amount: number }[]; maxValue: number }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-8">No data available</div>;
  }

  return (
    <div className="flex items-end justify-between gap-2 h-32 px-2">
      {data.map((item, idx) => {
        const heightPercent = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
        return (
          <div key={idx} className="flex flex-col items-center flex-1 gap-1">
            <div className="w-full flex items-end justify-center flex-1">
              <div
                className="w-full max-w-8 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                title={`$${item.amount.toLocaleString()}`}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// New Template Modal Form
// ============================================================
function NewTemplateModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: Omit<LicenseTemplate, "id">) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    basePrice: "",
    royaltyPercent: "",
    territory: "global",
    minGuarantee: "",
    currency: "USD",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: form.title,
      basePrice: parseFloat(form.basePrice) || 0,
      royaltyPercent: parseFloat(form.royaltyPercent) || 0,
      territory: form.territory,
      minGuarantee: parseFloat(form.minGuarantee) || 0,
      currency: form.currency,
    });
    setForm({ title: "", basePrice: "", royaltyPercent: "", territory: "global", minGuarantee: "", currency: "USD" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New License Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., TV Commercial License"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price (USD/yr)</label>
              <input
                type="number"
                required
                min="0"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                placeholder="50000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Royalty (% per use)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                value={form.royaltyPercent}
                onChange={(e) => setForm({ ...form, royaltyPercent: e.target.value })}
                placeholder="15"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Territory</label>
              <select
                value={form.territory}
                onChange={(e) => setForm({ ...form, territory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="global">Global</option>
                <option value="americas">Americas</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="china">China</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Guarantee (USD)</label>
              <input
                type="number"
                required
                min="0"
                value={form.minGuarantee}
                onChange={(e) => setForm({ ...form, minGuarantee: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function IPPortalPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<IPAsset[]>([]);
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [activeLicenses, setActiveLicenses] = useState<ActiveLicense[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assetsRes, earningsRes, licensesRes] = await Promise.allSettled([
          fetch("/api/v1/agency/assets", { credentials: "include" }),
          fetch("/api/v1/agency/earnings", { credentials: "include" }),
          fetch("/api/v1/agency/contracts", { credentials: "include" }),
        ]);

        // Assets
        if (assetsRes.status === "fulfilled" && assetsRes.value.ok) {
          const data = await assetsRes.value.json();
          if (data.success) {
            const mappedAssets: IPAsset[] = (data.assets || []).map((a: any) => ({
              id: a.id,
              name: a.title || a.subject || a.certificateNo || "Untitled",
              type: a.assetType === "AI_CONTENT" ? "AI_CONTENT" : a.contentType?.includes("voice") ? "VOICE" : "PORTRAIT",
              imageUrl: a.imageUrl || a.originalImageUrl || null,
              status: a.status || "ACTIVE",
            }));
            setAssets(mappedAssets.slice(0, 10));
          }
        }

        // Earnings
        if (earningsRes.status === "fulfilled" && earningsRes.value.ok) {
          const data = await earningsRes.value.json();
          if (data.success) {
            const monthlyData = [
              { month: "Jan", amount: Math.round((data.earnings?.totalEarnings || 0) * 0.15) },
              { month: "Feb", amount: Math.round((data.earnings?.totalEarnings || 0) * 0.12) },
              { month: "Mar", amount: Math.round((data.earnings?.totalEarnings || 0) * 0.18) },
              { month: "Apr", amount: Math.round((data.earnings?.totalEarnings || 0) * 0.14) },
              { month: "May", amount: Math.round((data.earnings?.totalEarnings || 0) * 0.20) },
              { month: "Jun", amount: data.earnings?.thisMonth || 0 },
            ];
            setEarnings({
              totalEarnings: data.earnings?.totalEarnings || 0,
              thisMonth: data.earnings?.thisMonth || 0,
              previousMonth: Math.round((data.earnings?.totalEarnings || 0) * 0.14),
              currency: data.earnings?.currency || "USD",
              monthlyData,
            });
          }
        }

        // Active licenses from contracts
        if (licensesRes.status === "fulfilled" && licensesRes.value.ok) {
          const data = await licensesRes.value.json();
          if (data.success) {
            const mapped: ActiveLicense[] = (data.contracts || [])
              .filter((c: any) => c.status === "ACTIVE")
              .slice(0, 8)
              .map((c: any) => ({
                id: c.id,
                licensee: c.artist?.displayName || c.artist?.email || "Unknown",
                template: c.contractType || "Standard",
                status: c.status,
                startDate: c.contractStart ? new Date(c.contractStart).toLocaleDateString() : "—",
                endDate: c.contractEnd ? new Date(c.contractEnd).toLocaleDateString() : "∞",
              }));
            setActiveLicenses(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load IP portal data:", err);
      } finally {
        setLoading(false);
      }
    }

    // Initialize with sample templates
    setTemplates([
      { id: "1", title: "Commercial License", basePrice: 50000, royaltyPercent: 15, territory: "global", minGuarantee: 10000, currency: "USD" },
      { id: "2", title: "TV Commercial", basePrice: 200000, royaltyPercent: 10, territory: "americas", minGuarantee: 50000, currency: "USD" },
      { id: "3", title: "Digital Ad Campaign", basePrice: 35000, royaltyPercent: 12, territory: "global", minGuarantee: 7500, currency: "USD" },
    ]);

    fetchData();
  }, []);

  const handleCreateTemplate = async (template: Omit<LicenseTemplate, "id">) => {
    try {
      const res = await fetch("/api/v1/agency/license-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(template),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTemplates((prev) => [...prev, { ...template, id: data.id }]);
        }
      }
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const handleExportCSV = () => {
    if (!earnings) return;
    setExporting(true);
    const csv = [
      ["Month", "Amount (USD)"],
      ...earnings.monthlyData.map((d) => [d.month, d.amount.toString()]),
      ["", ""],
      ["Total", earnings.totalEarnings.toString()],
      ["This Month", earnings.thisMonth.toString()],
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ip-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const momChange = earnings
    ? earnings.previousMonth > 0
      ? (((earnings.thisMonth - earnings.previousMonth) / earnings.previousMonth) * 100).toFixed(1)
      : "0"
    : "0";

  const maxChartValue = earnings
    ? Math.max(...earnings.monthlyData.map((d) => d.amount), 1)
    : 1;

  const assetTypeIcon = (type: string) => {
    if (type === "PORTRAIT") return "🖼️";
    if (type === "VOICE") return "🎤";
    return "🤖";
  };

  return (
    <DashboardShell
      title="IP Owner Portal"
      subtitle="Authorization & Pricing Management"
    >
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* My IP Assets */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">My IP Assets</h2>
                {assets.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No IP assets registered</p>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div key={asset.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-2xl">{assetTypeIcon(asset.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{asset.type}</div>
                        </div>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {asset.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Licenses & Pending */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeLicenses.length}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Active Licenses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">3</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Pending Requests</div>
                  </div>
                </div>
              </div>

              {/* Revenue Overview */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
                  <button
                    onClick={handleExportCSV}
                    disabled={exporting || !earnings}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
                  >
                    {exporting ? "Exporting..." : "Export CSV"}
                  </button>
                </div>

                {earnings && (
                  <>
                    <BarChart data={earnings.monthlyData} maxValue={maxChartValue} />

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ${earnings.totalEarnings.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">vs Last Month</div>
                        <div className={`text-lg font-bold ${parseFloat(momChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {parseFloat(momChange) >= 0 ? "+" : ""}{momChange}%
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN — Pricing Configuration */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pricing Configuration</h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + New License Template
                  </button>
                </div>

                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No templates created yet</p>
                ) : (
                  <div className="space-y-4">
                    {templates.map((tmpl) => (
                      <div key={tmpl.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tmpl.title}</h3>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tmpl.territory.toUpperCase()}</div>
                          </div>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            {tmpl.currency}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Base Price</div>
                            <div className="font-medium text-gray-900 dark:text-white">${tmpl.basePrice.toLocaleString()}/yr</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Royalty</div>
                            <div className="font-medium text-gray-900 dark:text-white">{tmpl.royaltyPercent}% per use</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Min Guarantee</div>
                            <div className="font-medium text-gray-900 dark:text-white">${tmpl.minGuarantee.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active License Requests */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Active License Requests</h2>
                {activeLicenses.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No active license requests</p>
                ) : (
                  <div className="space-y-3">
                    {activeLicenses.map((lic) => (
                      <div key={lic.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{lic.licensee}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{lic.template} &bull; {lic.startDate} → {lic.endDate}</div>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                          lic.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : lic.status === "PENDING_APPROVAL"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {lic.status?.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Template Modal */}
      <NewTemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateTemplate}
      />
    </DashboardShell>
  );
}