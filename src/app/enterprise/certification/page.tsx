"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const AGENCY_TYPES = [
  { value: "ENTERTAINMENT_AGENCY", label: "Entertainment Agency" },
  { value: "ROOT_SPONSOR", label: "IP Owner / Brand" },
  { value: "ESTATE", label: "Estate / Heritage" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CN", label: "China" },
  { value: "GB", label: "United Kingdom" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "SG", label: "Singapore" },
  { value: "HK", label: "Hong Kong" },
  { value: "OTHER", label: "Other" },
];

export default function EnterpriseCertificationPage() {
  const router = useRouter();
  const [agencyName, setAgencyName] = useState("");
  const [agencyType, setAgencyType] = useState("");
  const [country, setCountry] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!agencyName.trim()) errs.agencyName = "Company / organization name is required";
    if (!agencyType) errs.agencyType = "Please select an agency type";
    if (!country) errs.country = "Please select a country / region";
    if (!contactName.trim()) errs.contactName = "Contact name is required";
    if (!contactEmail.trim()) errs.contactEmail = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errs.contactEmail = "Invalid email format";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/agency/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          agencyType,
          country,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          registrationNo: registrationNo.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Submission failed");
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <img src="/logo.png" alt="Logo" className="block dark:hidden w-8 h-8 rounded-md object-contain" />
              <img src="/logo-dark.png" alt="Logo" className="hidden dark:block w-8 h-8 rounded-md object-contain" />
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">PortraitPay AI</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Your enterprise registration application for <strong>{agencyName}</strong> has been submitted.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We will review your application and notify you once approved.
            </p>
            <Link
              href="/agent/dashboard"
              className="inline-block bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <img src="/logo.png" alt="Logo" className="block dark:hidden w-8 h-8 rounded-md object-contain" />
            <img src="/logo-dark.png" alt="Logo" className="hidden dark:block w-8 h-8 rounded-md object-contain" />
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">PortraitPay AI</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>🏢</span>
            <span>Agency / Enterprise</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Enterprise Registration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            Register your organization to manage IP rights, monetize portraits, and access API integrations.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Company / Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => { setAgencyName(e.target.value); setErrors((p) => ({ ...p, agencyName: "" })); }}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 ${errors.agencyName ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                placeholder="e.g. Triumph Entertainment Inc."
              />
              {errors.agencyName && <p className="mt-1 text-xs text-red-500">{errors.agencyName}</p>}
            </div>

            {/* Agency Type + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Agency Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={agencyType}
                  onChange={(e) => { setAgencyType(e.target.value); setErrors((p) => ({ ...p, agencyType: "" })); }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:[&>option]:bg-gray-800 dark:[&>option]:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 ${errors.agencyType ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <option value="">Select type</option>
                  {AGENCY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.agencyType && <p className="mt-1 text-xs text-red-500">{errors.agencyType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Country / Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setErrors((p) => ({ ...p, country: "" })); }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:[&>option]:bg-gray-800 dark:[&>option]:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 ${errors.country ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
              </div>
            </div>

            {/* Registration No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Registration / License Number <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                placeholder="e.g. Unified credit code or business license number"
              />
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Contact Info */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Contact Person</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => { setContactName(e.target.value); setErrors((p) => ({ ...p, contactName: "" })); }}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 ${errors.contactName ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                    placeholder="Full name"
                  />
                  {errors.contactName && <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => { setContactEmail(e.target.value); setErrors((p) => ({ ...p, contactEmail: "" })); }}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 ${errors.contactEmail ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                    placeholder="you@example.com"
                  />
                  {errors.contactEmail && <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Already have an enterprise account?{" "}
          <Link href="/enterprise/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            Go to Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
