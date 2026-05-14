/**
 * /verify-batch — Batch Authorization Status Verification Tool
 * Creator/Actor role required. Query multiple actors at once.
 */

"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface PassportResult {
  id: string;
  fullName: string;
  email: string;
  allowedUses: string[];
  prohibitedUses: string[];
  createdAt: string;
}

interface PortraitOwner {
  id: string;
  email: string;
  displayName: string | null;
  portraits: {
    id: string;
    title: string;
    allowAiLicensing: boolean | null;
    aiLicenseScopes: string[];
    aiProhibitedScopes: string[];
    portraitSettings: {
      allowLicensing: boolean;
      allowedScopes: string[];
      prohibitedContent: string[];
    } | null;
  }[];
}

const SCOPE_LABELS: Record<string, string> = {
  VIDEO_GENERATION: "Video Generation",
  VOICE_CLONE: "Voice Clone",
  DIGITAL_AVATAR: "Digital Avatar",
  ADVERTISING: "Advertising",
  FILM: "Film",
  ANIMATION: "Animation",
  GAMING: "Gaming",
  PRINT: "Print",
  MERCHANDISE: "Merchandise",
  SOCIAL_MEDIA: "Social Media",
  EDUCATION: "Education",
  NEWS: "News",
  ADULT: "Adult",
  POLITICAL: "Political",
  VIOLENCE: "Violence",
  HATE: "Hate",
  FRAUD: "Fraud",
  WEAPONS: "Weapons",
  ILLEGAL: "Illegal",
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function VerifyBatchPage() {
  const { t, locale } = useLanguage();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [passportResults, setPassportResults] = useState<PassportResult[]>([]);
  const [portraitResults, setPortraitResults] = useState<PortraitOwner[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/consent-passport/batch-verify?query=${encodeURIComponent(query.trim())}`
      );
      const json = await res.json();
      if (json.success) {
        setPassportResults(json.data.portraits ?? []);
        setPortraitResults(json.data.portraitOwners ?? []);
        setSearched(true);
      } else {
        setError(json.error ?? "Search failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const rows: string[] = [];

    if (passportResults.length > 0) {
      rows.push("Type,Name,Email,Allowed Uses,Prohibited Uses,Created");
      for (const p of passportResults) {
        rows.push([
          "Consent Passport",
          `"${p.fullName}"`,
          p.email,
          `"${p.allowedUses.map((u) => SCOPE_LABELS[u] ?? u).join(", ")}"`,
          `"${p.prohibitedUses.map((u) => SCOPE_LABELS[u] ?? u).join(", ")}"`,
          new Date(p.createdAt).toLocaleDateString(),
        ].join(","));
      }
    }

    if (portraitResults.length > 0) {
      if (rows.length > 0) rows.push("");
      rows.push("Type,Owner Email,Portrait,AI Licensing,Allowed Scopes,Prohibited Scopes");
      for (const owner of portraitResults) {
        for (const portrait of owner.portraits) {
          const settings = portrait.portraitSettings;
          const allowed = settings?.allowedScopes?.length
            ? settings.allowedScopes.map((s) => SCOPE_LABELS[s] ?? s)
            : portrait.aiLicenseScopes.map((s) => SCOPE_LABELS[s] ?? s);
          const prohibited = settings?.prohibitedContent?.length
            ? settings.prohibitedContent.map((s) => SCOPE_LABELS[s] ?? s)
            : portrait.aiProhibitedScopes.map((s) => SCOPE_LABELS[s] ?? s);
          rows.push([
            "Portrait",
            owner.email,
            `"${portrait.title}"`,
            portrait.allowAiLicensing === null
              ? "Default"
              : portrait.allowAiLicensing ? "Allowed" : "Blocked",
          `"${allowed.join(", ")}"`,
          `"${prohibited.join(", ")}"`,
          ].join(","));
        }
      }
    }

    if (rows.length === 0) return;
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `authorization-status-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasResults = passportResults.length > 0 || portraitResults.length > 0;

  return (
    <DashboardShell title="Batch Authorization Verify" subtitle="Query authorization status for multiple actors at once">
      <div className="space-y-6">

        {/* Search Input */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Search Actors</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enter email addresses or names, one per line or comma-separated.
          </p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`actor@example.com\njane@example.com\nJohn Smith`}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm resize-none mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 bg-[#244169] hover:bg-[#1a3354] disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
            {searched && hasResults && (
              <button
                onClick={exportCSV}
                className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors"
              >
                📤 Export CSV
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {/* Results */}
        {searched && !loading && (
          <>
            {/* Consent Passports */}
            {passportResults.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Consent Passports ({passportResults.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Allowed Uses</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prohibited</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passportResults.map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{p.fullName}</td>
                          <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{p.email}</td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {p.allowedUses.map((u) => (
                                <span key={u} className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">{SCOPE_LABELS[u] ?? u}</span>
                              ))}
                              {p.allowedUses.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {p.prohibitedUses.map((u) => (
                                <span key={u} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">{SCOPE_LABELS[u] ?? u}</span>
                              ))}
                              {p.prohibitedUses.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(p.createdAt).toLocaleDateString(locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Portrait Owners */}
            {portraitResults.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Portrait Licensing Status ({portraitResults.length} owners)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Owner Email</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Portrait</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">AI Licensing</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Allowed Scopes</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prohibited</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portraitResults.flatMap((owner) =>
                        owner.portraits.map((portrait) => {
                          const settings = portrait.portraitSettings;
                          const isAllowed = portrait.allowAiLicensing === null
                            ? (settings?.allowLicensing ?? true)
                            : portrait.allowAiLicensing;
                          const allowed = (settings?.allowedScopes?.length ? settings.allowedScopes : portrait.aiLicenseScopes).map((s) => SCOPE_LABELS[s] ?? s);
                          const prohibited = (settings?.prohibitedContent?.length ? settings.prohibitedContent : portrait.aiProhibitedScopes).map((s) => SCOPE_LABELS[s] ?? s);
                          return (
                            <tr key={`${owner.id}-${portrait.id}`} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{owner.email}</td>
                              <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{portrait.title}</td>
                              <td className="px-5 py-3">
                                {isAllowed ? (
                                  <StatusBadge label="Allowed" color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" />
                                ) : (
                                  <StatusBadge label="Blocked" color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" />
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {allowed.map((s) => (
                                    <span key={s} className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">{s}</span>
                                  ))}
                                  {allowed.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {prohibited.map((s) => (
                                    <span key={s} className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">{s}</span>
                                  ))}
                                  {prohibited.length === 0 && <span className="text-gray-400 text-xs">—</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No results */}
            {searched && !hasResults && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Results Found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No matching Consent Passports or Portrait owners were found for the given queries.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
