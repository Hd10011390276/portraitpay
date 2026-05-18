"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { useParams } from "next/navigation";

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

export default function LawyerProfilePage() {
  const { t } = useLanguage();
  const tl = t.lawyerProfilePage || {};
  const nav = t.nav || {};
  const params = useParams();

  const [lawyer, setLawyer] = useState<{
    id: string;
    userId: string;
    companyName: string;
    lawyerType: string;
    country: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    createdAt: string;
    totalCases: number;
    wonCases: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchLawyer(params.id as string);
    }
  }, [params.id]);

  const fetchLawyer = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lawyers/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLawyer(data.data);
      } else {
        setError(data.error || "Lawyer not found");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  const getCountryName = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code);
    return c ? c.name : code;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            PortraitPay AI
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/lawyers" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {tl.backToList || "← Back to Lawyers"}
            </Link>
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {nav.signIn || "Sign In"}
            </Link>
            <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {nav.getStarted || "Get Started Free"}
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">{tl.loading || "Loading..."}</p>
            </div>
          </div>
        ) : error || !lawyer ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {tl.notFoundTitle || "Lawyer not found"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || (tl.notFoundDesc || "This lawyer profile may not exist or has been removed.")}
            </p>
            <Link
              href="/lawyers"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {tl.backToList || "← Back to Lawyers"}
            </Link>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 mb-6">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold flex-shrink-0">
                  {lawyer.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {lawyer.companyName}
                    </h1>
                    <span className="px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                      {lawyer.lawyerType === "firm" ? "Law Firm" : "Solo Lawyer"}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>🌍</span>
                    {getCountryName(lawyer.country)}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {tl.verifiedSince?.replace("{date}", formatDate(lawyer.createdAt)) || `Verified since ${formatDate(lawyer.createdAt)}`}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{tl.contactPerson || "Contact Person"}</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{lawyer.contactName}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{tl.email || "Email"}</p>
                  <p className="text-gray-900 dark:text-white">{lawyer.contactEmail || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{tl.phone || "Phone"}</p>
                  <p className="text-gray-900 dark:text-white">{lawyer.contactPhone || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{tl.type || "Type"}</p>
                  <p className="text-gray-900 dark:text-white">
                    {lawyer.lawyerType === "firm" ? (tl.lawFirm || "Law Firm") : (tl.personalLawyer || "Personal Lawyer")}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{tl.casesLabel || "Cases"}</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {lawyer.totalCases > 0
                      ? `${lawyer.wonCases || 0} won / ${lawyer.totalCases} total`
                      : "No cases yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {tl.servicesTitle || "Services Provided"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: "⚖️", title: tl.svcInfringement || "Infringement Handling", desc: tl.svcInfringementDesc || "Handle unauthorized AI portrait usage cases" },
                  { icon: "📋", title: tl.svcConsultation || "Legal Consultation", desc: tl.svcConsultationDesc || "AI portrait rights licensing advisory" },
                  { icon: "📄", title: tl.svcContracts || "Contract Review", desc: tl.svcContractsDesc || "Review and draft AI portrait licensing agreements" },
                  { icon: "🔍", title: tl.svcVerification || "Certificate Verification", desc: tl.svcVerificationDesc || "Verify consent certificates for litigation" },
                ].map((svc) => (
                  <div key={svc.title} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="text-2xl">{svc.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{svc.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{svc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Engage */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {tl.engageTitle || "How to Engage"}
              </h2>
              <ol className="space-y-4">
                {[
                  { step: "1", desc: tl.step1Desc || "Create an account on PortraitPay AI" },
                  { step: "2", desc: tl.step2Desc || "Submit an infringement report with evidence" },
                  { step: "3", desc: tl.step3Desc || "Our team matches you with a suitable lawyer" },
                  { step: "4", desc: tl.step4Desc || "The lawyer contacts you directly for case assessment" },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4 items-start">
                    <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 pt-1">{item.desc}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex gap-3 flex-wrap">
                {lawyer && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/conversations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type: "LAWYER_CASE",
                            participantIds: [lawyer.userId],
                            subject: "Legal inquiry: portrait rights",
                          }),
                        });
                        const json = await res.json();
                        if (json.success) window.location.href = `/inbox/${json.data.id}`;
                        else if (res.status === 401) window.location.href = "/login";
                      } catch { /* silent */ }
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                  >
                    {tl.contactLawyer || "Contact Lawyer"}
                  </button>
                )}
                <Link
                  href="/register"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                >
                  {tl.getStarted || "Get Started"}
                </Link>
                <Link
                  href="/lawyers"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl transition-colors"
                >
                  {tl.backToList || "← Back to Lawyers"}
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
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