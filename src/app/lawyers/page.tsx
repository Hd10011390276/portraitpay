"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "NZ", name: "New Zealand" },
  { code: "AE", name: "UAE" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
];

export default function LawyersPage() {
  const { t } = useLanguage();
  const tl = t.lawyersPage || {};
  const nav = t.nav || {};

  const [lawyers, setLawyers] = useState<Array<{
    id: string;
    userId: string;
    companyName: string;
    lawyerType: string;
    country: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    totalCases: number;
    wonCases: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLawyers();
  }, [selectedCountry]);

  const fetchLawyers = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedCountry
        ? `/api/lawyers?country=${selectedCountry}`
        : "/api/lawyers";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLawyers(data.data || []);
      } else {
        setError(data.error || "Failed to load lawyers");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  const filteredLawyers = lawyers.filter((l) =>
    search === "" ||
    l.companyName.toLowerCase().includes(search.toLowerCase()) ||
    l.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const getCountryName = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code);
    return c ? c.name : code;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            PortraitPay AI
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {nav.faq || "FAQ"}
            </Link>
            <Link href="/celebrity" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {nav.celebrity || "For Actors"}
            </Link>
            <Link href="/lawyer/apply" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {nav.lawyer || "Lawyer Registration"}
            </Link>
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {nav.signIn || "Sign In"}
            </Link>
            <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {nav.getStarted || "Get Started Free"}
            </Link>
            <ThemeToggle />
          </nav>
          <div className="flex md:hidden items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400">Sign In</Link>
            <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>⚖️</span>
            <span>Platform-certified portrait rights agencies</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {tl.title || "Find a Portrait Rights Lawyer"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
            {tl.subtitle || "Browse platform-authorized law firms and lawyers specializing in AI portrait rights protection. All listed lawyers are vetted by PortraitPay AI."}
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={tl.searchPlaceholder || "Search by firm name or contact..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px]"
            >
              <option value="">{tl.allCountries || "All Countries"}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Lawyer Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">{tl.loading || "Loading lawyers..."}</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchLawyers}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              {tl.retry || "Retry"}
            </button>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {tl.noLawyersTitle || "No lawyers found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {search || selectedCountry
                ? (tl.noLawyersDesc || "Try adjusting your search or filters.")
                : (tl.noLawyersEmpty || "No approved lawyers yet. Check back soon.")}
            </p>
            {(search || selectedCountry) && (
              <button
                onClick={() => { setSearch(""); setSelectedCountry(""); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {tl.clearFilters || "Clear filters"}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {tl.showingCount?.replace("{count}", String(filteredLawyers.length)) || `${filteredLawyers.length} lawyer${filteredLawyers.length !== 1 ? "s" : ""} found`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLawyers.map((lawyer) => (
                <Link
                  key={lawyer.id}
                  href={`/lawyers/${lawyer.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-bold">
                      {lawyer.companyName.charAt(0).toUpperCase()}
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                      {lawyer.lawyerType === "firm" ? "Law Firm" : "Solo Lawyer"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {lawyer.companyName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {getCountryName(lawyer.country)}
                  </p>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">{tl.contactLabel || "Contact"}:</span> {lawyer.contactName}</p>
                    {lawyer.contactEmail && (
                      <p className="truncate"><span className="font-medium">{tl.emailLabel || "Email"}:</span> {lawyer.contactEmail}</p>
                    )}
                    {typeof lawyer.totalCases === "number" && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {lawyer.totalCases > 0 ? `${lawyer.wonCases || 0} won / ${lawyer.totalCases} total cases` : "No cases yet"}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                      {tl.viewProfile || "View Profile →"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* CTA */}
      <section className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {tl.ctaTitle || "Are you a lawyer?"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {tl.ctaDesc || "Join PortraitPay AI as a platform-certified portrait rights agency."}
          </p>
          <Link
            href="/lawyer/apply"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            {nav.lawyer || "Lawyer Registration"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">PortraitPay AI — {new Date().getFullYear()}</p>
          <nav className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}