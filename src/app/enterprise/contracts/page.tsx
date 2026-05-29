/**
 * /enterprise/contracts - Agency Artist Contract Management
 * ENTERTAINMENT_AGENCY core page for managing artist contracts
 */
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";
import { useForm } from "react-hook-form";
import { z } from "zod";

const contractSchema = z.object({
  contractTitle: z.string().min(1, "Contract title is required"),
  artistUserId: z.string().min(1, "Artist is required"),
  contractType: z.enum(["EXCLUSIVE", "NON_EXCLUSIVE", "MANAGER"]),
  royaltySplit: z.string().min(1, "Royalty split is required"),
  minGuarantee: z.string().optional(),
  territories: z.array(z.string()).default([]),
  rightsGranted: z.array(z.string()).default([]),
  contractStart: z.string().min(1, "Start date is required"),
  contractEnd: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

const STATUS_OPTIONS = ["ALL", "ACTIVE", "PENDING", "EXPIRED", "DRAFT", "DISPUTED"];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  DISPUTED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300",
};

const TERRITORY_OPTIONS = ["CN", "HK", "TW", "JP", "KR", "US", "EU", "UK", "SEA", "GLOBAL"];
const RIGHTS_OPTIONS = ["FILM", "ADVERTISING", "MERCHANDISE", "PRINT", "GAMING", "SOCIAL_MEDIA", "EDUCATION", "MUSIC", "BROADCAST"];
const CONTRACT_TYPE_OPTIONS = ["EXCLUSIVE", "NON_EXCLUSIVE", "MANAGER"];

interface Contract {
  id: string;
  contractTitle: string;
  contractType: string;
  status: string;
  royaltySplit: string | null;
  minGuarantee: string | null;
  territories: string[];
  rightsGranted: string[];
  representation: string[];
  contractStart: string | null;
  contractEnd: string | null;
  artistUser: { id: string; displayName: string | null; email: string };
}

interface Artist {
  id: string;
  displayName: string | null;
  email: string;
}

export default function EnterpriseContractsPage() {
  const { t } = useLanguage();
  const td = t.enterpriseContracts || {};

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<ContractFormData>({
    defaultValues: {
      contractTitle: "",
      artistUserId: "",
      contractType: "EXCLUSIVE",
      royaltySplit: "",
      minGuarantee: "",
      territories: [],
      rightsGranted: [],
      contractStart: "",
      contractEnd: "",
    },
  });

  const selectedTerritories = watch("territories") || [];
  const selectedRights = watch("rightsGranted") || [];

  useEffect(() => {
    async function fetchData() {
      try {
        const [contractsRes, artistsRes] = await Promise.allSettled([
          fetch("/api/v1/agency/contracts", { credentials: "include" }),
          fetch("/api/v1/agency/artists", { credentials: "include" }),
        ]);

        if (contractsRes.status === "fulfilled" && contractsRes.value.ok) {
          const data = await contractsRes.value.json();
          if (data.success) setContracts(data.contracts || []);
        }

        if (artistsRes.status === "fulfilled" && artistsRes.value.ok) {
          const data = await artistsRes.value.json();
          if (data.success) setArtists(data.artists || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contracts");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      searchQuery === "" ||
      contract.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.artistUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.artistUser?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      contract.status === statusFilter ||
      (statusFilter === "PENDING" && contract.status === "PENDING_APPROVAL");

    return matchesSearch && matchesStatus;
  });

  const onSubmit = async (formData: ContractFormData) => {
    setModalLoading(true);
    try {
      const payload = {
        contractTitle: formData.contractTitle,
        artistUserId: formData.artistUserId,
        contractType: formData.contractType,
        royaltySplit: formData.royaltySplit,
        minGuarantee: formData.minGuarantee || null,
        territories: formData.territories,
        rightsGranted: formData.rightsGranted,
        contractStart: formData.contractStart,
        contractEnd: formData.contractEnd || null,
      };

      const res = await fetch("/api/v1/agency/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create contract");

      const data = await res.json();
      if (data.success) {
        setContracts((prev) => [data.contract, ...prev]);
        setShowModal(false);
        reset();
      } else {
        throw new Error(data.error || "Failed to create contract");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create contract");
    } finally {
      setModalLoading(false);
    }
  };

  const openModal = () => {
    reset();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    reset();
  };

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {td.title || "Artist Contracts"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {td.subtitle || "Manage your entertainment agency's artist contracts"}
            </p>
          </div>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + {td.newContract || "New Contract"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={td.searchPlaceholder || "Search by title or artist name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {status === "ALL" ? (td.all || "All") : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Contract List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 dark:text-gray-400">
              {contracts.length === 0
                ? (td.noContracts || "No contracts yet")
                : (td.noResults || "No contracts match your filters")}
            </p>
            {contracts.length === 0 && (
              <button
                onClick={openModal}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + {td.createFirst || "Create your first contract"}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">
                    {td.contract || "Contract"}
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">
                    {td.artist || "Artist"}
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">
                    {td.royalty || "Royalty"}
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">
                    {td.status || "Status"}
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 dark:text-gray-400">
                    {td.territories || "Territories"}
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredContracts.map((contract) => {
                  const isOpen = expandedId === contract.id;
                  return (
                    <>
                      <tr
                        key={contract.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setExpandedId(isOpen ? null : contract.id)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {contract.contractTitle}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {contract.contractType}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-gray-900 dark:text-white">
                            {contract.artistUser?.displayName || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {contract.artistUser?.email}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {contract.royaltySplit
                              ? `${(parseFloat(contract.royaltySplit) * 100).toFixed(2)}%`
                              : "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              STATUS_COLORS[contract.status] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {contract.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {contract.territories?.length > 0
                              ? contract.territories.map((territory) => (
                                  <span
                                    key={territory}
                                    className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded"
                                  >
                                    {territory}
                                  </span>
                                ))
                              : "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center text-gray-400">
                          {isOpen ? "▲" : "▼"}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {td.minGuarantee || "Min Guarantee"}
                                </div>
                                <div className="text-gray-900 dark:text-white font-semibold mt-0.5">
                                  {contract.minGuarantee
                                    ? `$${parseFloat(contract.minGuarantee).toLocaleString()}`
                                    : "—"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {td.contractPeriod || "Period"}
                                </div>
                                <div className="text-gray-900 dark:text-white text-xs mt-0.5">
                                  {contract.contractStart
                                    ? new Date(contract.contractStart).toLocaleDateString()
                                    : "—"}
                                  {contract.contractEnd
                                    ? ` → ${new Date(contract.contractEnd).toLocaleDateString()}`
                                    : " → ∞"}
                                </div>
                              </div>
                              {contract.rightsGranted?.length > 0 && (
                                <div className="col-span-2">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {td.rightsGranted || "Rights Granted"}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {contract.rightsGranted.map((right) => (
                                      <span
                                        key={right}
                                        className="px-1.5 py-0.5 text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded"
                                      >
                                        {right}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {contract.representation?.length > 0 && (
                                <div className="col-span-2">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {td.representation || "Representation"}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {contract.representation.map((rep) => (
                                      <span
                                        key={rep}
                                        className="px-1.5 py-0.5 text-xs bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded"
                                      >
                                        {rep}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {td.newContractModal || "New Artist Contract"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Contract Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {td.contractTitle || "Contract Title"} *
                </label>
                <input
                  {...register("contractTitle", { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Exclusive Recording Contract - Zhang San"
                />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {td.artist || "Artist"} *
                </label>
                <select
                  {...register("artistUserId", { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select artist...</option>
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.displayName || artist.email}
                      {artist.displayName ? ` (${artist.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {td.contractType || "Contract Type"} *
                </label>
                <select
                  {...register("contractType", { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CONTRACT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Royalty Split */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {td.royaltySplit || "Royalty Split (%)"} *
                </label>
                <input
                  {...register("royaltySplit", { required: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 15"
                />
              </div>

              {/* Min Guarantee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {td.minGuarantee || "Min Guarantee (USD)"}
                </label>
                <input
                  {...register("minGuarantee")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 50000"
                />
              </div>

              {/* Contract Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {td.startDate || "Start Date"} *
                  </label>
                  <input
                    {...register("contractStart", { required: true })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {td.endDate || "End Date"}
                  </label>
                  <input
                    {...register("contractEnd")}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Territories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {td.territories || "Territories"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TERRITORY_OPTIONS.map((territory) => {
                    const isSelected = selectedTerritories.includes(territory);
                    return (
                      <button
                        key={territory}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setValue(
                              "territories",
                              selectedTerritories.filter((t) => t !== territory)
                            );
                          } else {
                            setValue("territories", [...selectedTerritories, territory]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {territory}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rights Granted */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {td.rightsGranted || "Rights Granted"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {RIGHTS_OPTIONS.map((right) => {
                    const isSelected = selectedRights.includes(right);
                    return (
                      <button
                        key={right}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setValue(
                              "rightsGranted",
                              selectedRights.filter((r) => r !== right)
                            );
                          } else {
                            setValue("rightsGranted", [...selectedRights, right]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {right.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {td.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {modalLoading ? (td.creating || "Creating...") : (td.createContract || "Create Contract")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}