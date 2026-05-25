"use client";
/**
 * Enterprise Certification Page
 * /enterprise/certification
 * CN/US country-aware registration with agencyType selection
 * One form: Step 1 (country + type) → Step 2 (fields) → Step 3 (pending)
 */
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

type Country = "CN" | "US";
type AgencyType = "ROOT_SPONSOR" | "ENTERTAINMENT_AGENCY" | "ESTATE";

type Step = "type" | "form" | "pending";

function cnSchema(t: any) {
  return z.object({
    companyName: z.string().min(2, t.companyNameMin2 || "Min 2 characters"),
    unifiedCreditCode: z.string().length(18, t.unifiedCreditCodeLen18 || "Must be 18 digits"),
    legalPersonName: z.string().min(2, t.legalPersonNameMin2 || "Required"),
    legalPersonIdCard: z.string().length(18, t.legalPersonIdCardLen18 || "Must be 18 digits"),
    registeredCapital: z.string().optional(),
    establishedDate: z.string().optional(),
    businessTerm: z.string().optional(),
    businessScope: z.string().optional(),
    licenseImageUrl: z.string().url(t.uploadLicense || "Required"),
    legalPersonIdCardFrontUrl: z.string().url().optional(),
    legalPersonIdCardBackUrl: z.string().url().optional(),
    contactName: z.string().min(2, t.enterContactName || "Required"),
    contactPhone: z.string().min(11, t.phoneFormatInvalid || "Invalid phone"),
    contactEmail: z.string().email(t.emailFormatInvalid || "Invalid email"),
  });
}

function usSchema() {
  return z.object({
    companyName: z.string().min(2, "Min 2 characters"),
    ein: z.string().regex(/^\d{2}-\d{7}$/, "Format: XX-XXXXXXX"),
    registeredAgent: z.string().min(2, "Required"),
    stateOfIncorporation: z.string().min(1, "Required"),
    dateOfIncorporation: z.string().optional(),
    authorizedShares: z.string().optional(),
    businessPurpose: z.string().optional(),
    licenseImageUrl: z.string().url("Required"),
    w9Url: z.string().url().optional(),
    contactName: z.string().min(2, "Required"),
    contactPhone: z.string().min(11, "Invalid phone"),
    contactEmail: z.string().email("Invalid email"),
  });
}

type CNFormData = z.infer<ReturnType<typeof cnSchema>>;
type USFormData = z.infer<ReturnType<typeof usSchema>>;

const AGENCY_TYPE_LABELS: Record<AgencyType, string> = {
  ROOT_SPONSOR: "IP Owner / Brand",
  ENTERTAINMENT_AGENCY: "Entertainment Agency",
  ESTATE: "Estate / Heritage",
};

const AGENCY_TYPE_DESCS: Record<AgencyType, string> = {
  ROOT_SPONSOR: "Brand or IP holder (e.g., Triumph, Sony Music)",
  ENTERTAINMENT_AGENCY: "Agency managing artist portraits and licensing",
  ESTATE: "Heritage manager for deceased celebrity estates",
};

export default function EnterpriseCertificationPage() {
  const { t } = useLanguage();
  const tc = t.enterpriseCert || {};

  const [step, setStep] = useState<Step>("type");
  const [country, setCountry] = useState<Country | null>(null);
  const [agencyType, setAgencyType] = useState<AgencyType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cnForm = useForm<CNFormData>({
    resolver: zodResolver(cnSchema(tc)),
  });

  const usForm = useForm<USFormData>({
    resolver: zodResolver(usSchema()),
  });

  const handleSelectCountry = (c: Country) => {
    setCountry(c);
  };

  const handleSubmitCN = async (data: CNFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/enterprise/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, _country: "CN", _agencyType: agencyType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setStep("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : (tc.submitError || "Submission failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUS = async (data: USFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/enterprise/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, _country: "US", _agencyType: agencyType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setStep("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : (tc.submitError || "Submission failed"));
    } finally {
      setLoading(false);
    }
  };

  // ── Pending step ──────────────────────────────────────────────────────────
  if (step === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="nav-glass sticky top-0 z-30">
          <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tc.submittedSuccessfully}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{tc.submittedDesc}</p>
            <button onClick={() => setStep("select")} className="text-blue-600 font-medium hover:underline">
              {tc.backToForm}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Select company type ───────────────────────────────────────────
  if (step === "type") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center px-2">
            <Link href="/" className="inline-block">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 hover:opacity-80 transition-opacity">
                PortraitPay AI
              </div>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{tc.title}</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{tc.subtitle}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                {tc.agencyTypeLabel || "Agency Type"} *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(AGENCY_TYPE_LABELS) as AgencyType[]).map((type) => (
                  <button key={type} type="button" onClick={() => setAgencyType(type)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${agencyType === type ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}>
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{AGENCY_TYPE_LABELS[type]}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{AGENCY_TYPE_DESCS[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            {agencyType && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  {tc.selectCountry || "Select Country / Region"} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleSelectCountry("CN")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${country === "CN" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}>
                    <span className="text-3xl">🇨🇳</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">China (CN)</span>
                    <span className="text-xs text-gray-500">统一社会信用代码</span>
                  </button>
                  <button type="button" onClick={() => handleSelectCountry("US")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${country === "US" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}>
                    <span className="text-3xl">🇺🇸</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">United States (US)</span>
                    <span className="text-xs text-gray-500">EIN + W-9</span>
                  </button>
                </div>
              </div>
            )}

            <button type="button" disabled={!agencyType || !country} onClick={() => setStep("form")}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {tc.nextStep || "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Country-specific form ────────────────────────────────────────
  const isCN = country === "CN";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center px-2">
          <Link href="/" className="inline-block">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 hover:opacity-80 transition-opacity">
              PortraitPay AI
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{tc.title}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm text-gray-500">{country === "CN" ? "🇨🇳 China" : "🇺🇸 United States"}</span>
            <span className="text-gray-400">›</span>
            <span className="text-sm font-medium text-blue-600">{AGENCY_TYPE_LABELS[agencyType!]}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button type="button" onClick={() => setStep("type")} className="text-sm text-blue-600 hover:underline">
            ← {tc.backToSelect || "Back to selection"}
          </button>

          {/* CN Form */}
          {isCN && (
            <form onSubmit={cnForm.handleSubmit(handleSubmitCN)} className="space-y-5">
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{tc.basicInfo}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.companyName} *</label>
                    <input {...cnForm.register("companyName")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder={tc.companyNamePlaceholder} />
                    {cnForm.formState.errors.companyName && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.companyName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.unifiedCreditCode} *</label>
                    <input {...cnForm.register("unifiedCreditCode")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" maxLength={18} />
                    {cnForm.formState.errors.unifiedCreditCode && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.unifiedCreditCode.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.legalRep} *</label>
                    <input {...cnForm.register("legalPersonName")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                    {cnForm.formState.errors.legalPersonName && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.legalPersonName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.idCardNumber} *</label>
                    <input {...cnForm.register("legalPersonIdCard")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" maxLength={18} />
                    {cnForm.formState.errors.legalPersonIdCard && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.legalPersonIdCard.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.registeredCapital}</label>
                    <input {...cnForm.register("registeredCapital")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.establishedDate}</label>
                    <input {...cnForm.register("establishedDate")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="YYYY-MM-DD" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.businessTerm}</label>
                    <input {...cnForm.register("businessTerm")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.businessScope}</label>
                    <textarea {...cnForm.register("businessScope")} rows={3} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400 resize-none" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{tc.documentUpload}</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.businessLicense} *</label>
                  <input {...cnForm.register("licenseImageUrl")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="https://" />
                  <p className="text-xs text-gray-500 mt-1">{tc.businessLicenseHint}</p>
                  {cnForm.formState.errors.licenseImageUrl && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.licenseImageUrl.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.idCardFront}</label>
                    <input {...cnForm.register("legalPersonIdCardFrontUrl")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="https://" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.idCardBack}</label>
                    <input {...cnForm.register("legalPersonIdCardBackUrl")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="https://" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{tc.contactInfo}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.contactName} *</label>
                    <input {...cnForm.register("contactName")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    {cnForm.formState.errors.contactName && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.contactName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.phone} *</label>
                    <input {...cnForm.register("contactPhone")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" maxLength={11} />
                    {cnForm.formState.errors.contactPhone && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.contactPhone.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{tc.email} *</label>
                    <input {...cnForm.register("contactEmail")} type="email" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    {cnForm.formState.errors.contactEmail && <p className="text-red-500 text-xs mt-1">{cnForm.formState.errors.contactEmail.message}</p>}
                  </div>
                </div>
              </section>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? (tc.submitting || "Submitting...") : (tc.nextPayFee || "Submit")}
              </button>
            </form>
          )}

          {/* US Form */}
          {!isCN && (
            <form onSubmit={usForm.handleSubmit(handleSubmitUS)} className="space-y-5">
              <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Company Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Company Name *</label>
                    <input {...usForm.register("companyName")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                    {usForm.formState.errors.companyName && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.companyName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">EIN * (XX-XXXXXXX)</label>
                    <input {...usForm.register("ein")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="12-3456789" maxLength={10} />
                    {usForm.formState.errors.ein && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.ein.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Registered Agent *</label>
                    <input {...usForm.register("registeredAgent")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                    {usForm.formState.errors.registeredAgent && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.registeredAgent.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">State of Incorporation *</label>
                    <input {...usForm.register("stateOfIncorporation")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                    {usForm.formState.errors.stateOfIncorporation && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.stateOfIncorporation.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date of Incorporation</label>
                    <input {...usForm.register("dateOfIncorporation")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="YYYY-MM-DD" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Authorized Shares</label>
                    <input {...usForm.register("authorizedShares")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Business Purpose</label>
                    <textarea {...usForm.register("businessPurpose")} rows={3} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400 resize-none" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Document Upload</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Business License / Certificate of Incorporation *</label>
                  <input {...usForm.register("licenseImageUrl")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="https://" />
                  <p className="text-xs text-gray-500 mt-1">JPG/PNG under 5MB, or paste URL</p>
                  {usForm.formState.errors.licenseImageUrl && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.licenseImageUrl.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">W-9 / Tax Document (optional)</label>
                  <input {...usForm.register("w9Url")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" placeholder="https://" />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Contact Name *</label>
                    <input {...usForm.register("contactName")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    {usForm.formState.errors.contactName && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.contactName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone *</label>
                    <input {...usForm.register("contactPhone")} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300" maxLength={11} />
                    {usForm.formState.errors.contactPhone && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.contactPhone.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email *</label>
                    <input {...usForm.register("contactEmail")} type="email" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    {usForm.formState.errors.contactEmail && <p className="text-red-500 text-xs mt-1">{usForm.formState.errors.contactEmail.message}</p>}
                  </div>
                </div>
              </section>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? (tc.submitting || "Submitting...") : (tc.nextPayFee || "Submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}