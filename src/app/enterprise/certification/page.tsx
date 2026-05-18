"use client";
/**
 * Enterprise Certification Page
 * /enterprise/certification
 * Business license + contact info + certification fee payment
 */
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

function createSchema(t: any) {
  return z.object({
    companyName: z.string().min(2, t.companyNameMin2 || "Company name must be at least 2 characters"),
    unifiedCreditCode: z.string().length(18, t.unifiedCreditCodeLen18 || "Unified social credit code must be 18 digits"),
    legalPersonName: z.string().min(2, t.legalPersonNameMin2 || "Please enter the legal representative name"),
    legalPersonIdCard: z.string().length(18, t.legalPersonIdCardLen18 || "ID card number must be 18 digits"),
    registeredCapital: z.string().optional(),
    establishedDate: z.string().optional(),
    businessTerm: z.string().optional(),
    businessScope: z.string().optional(),
    licenseImageUrl: z.string().url(t.uploadLicense || "Please upload business license"),
    legalPersonIdCardFrontUrl: z.string().url(t.uploadIdCardFront || "Please upload ID card front").optional(),
    legalPersonIdCardBackUrl: z.string().url(t.uploadIdCardBack || "Please upload ID card back").optional(),
    contactName: z.string().min(2, t.enterContactName || "Please enter contact name"),
    contactPhone: z.string().min(11, t.phoneFormatInvalid || "Invalid phone number format"),
    contactEmail: z.string().email(t.emailFormatInvalid || "Invalid email format"),
    isAgency: z.boolean().optional(),
    agencyLicenseUrl: z.string().url(t.uploadAgencyLicense || "Please upload agency license").optional(),
  });
}

type FormData = z.infer<ReturnType<typeof createSchema>>;

// PayPal.me links — amounts: personal/agency=$199, enterprise=$299
const PAYPAL_ENTERPRISE = "https://www.paypal.me/PortraitPayAI/299";
const PAYPAL_PERSONAL = "https://www.paypal.me/PortraitPayAI/199";

export default function EnterpriseCertificationPage() {
  const { t } = useLanguage();

  const [step, setStep] = useState<"form" | "payment" | "pending">("form");
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tc = t.enterpriseCert;

  const schema = createSchema(tc);

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const isAgency = watch("isAgency");
  const certificationFee = isAgency ? 299 : 199;
  const paypalLink = isAgency ? PAYPAL_ENTERPRISE : PAYPAL_PERSONAL;

  const onFormSubmit = (data: FormData) => {
    setPendingData(data);
    setStep("payment");
  };

  const handlePaymentConfirm = async () => {
    if (!pendingData) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/enterprise/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingData),
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

  const feeLabel = isAgency ? tc.feeAgency : tc.feePersonal;

  if (step === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{tc.submittedSuccessfully}</h2>
          <p className="text-gray-600 mb-6">
            {tc.submittedDesc}
          </p>
          <button
            onClick={() => setStep("form")}
            className="text-purple-600 font-medium hover:underline"
          >
            {tc.backToForm}
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {tc.payCertificationFee}
            </h2>
            <p className="text-gray-500 text-sm">
              {tc.payDesc}
            </p>
          </div>

          {/* Fee card */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{feeLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tc.validFor1Year}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-purple-600">${certificationFee}</span>
              <span className="text-gray-400 text-sm ml-1">USD</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Payment options */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">{tc.selectPaymentMethod}</p>

            <a
              href={paypalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border-2 border-[#0070ba] rounded-xl hover:bg-[#0070ba]/5 transition-colors"
            >
              <div className="w-10 h-10 bg-[#0070ba] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">PayPal</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{tc.paypal}</p>
                <p className="text-xs text-gray-500">{tc.paypalDesc}</p>
              </div>
              <span className="font-bold text-gray-900">${certificationFee}</span>
            </a>
          </div>

          {/* Payment note */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 mb-6">
            💡 {tc.paymentNote}
          </div>

          {/* Confirm + back buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← {tc.goBack}
            </button>
            <button
              onClick={handlePaymentConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {tc.submitting}
                </>
              ) : (
                tc.paymentDoneSubmit
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: form step
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="nav-glass sticky top-0 z-30">
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
              <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{tc.title}</h1>
            <p className="text-purple-200 mt-1">
              {tc.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Fee notice */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-purple-600 text-lg flex-shrink-0 mt-0.5">💡</span>
              <div className="text-sm text-purple-800">
                <p className="font-semibold">{tc.certificationFee}</p>
                <p className="mt-0.5">
                  {tc.feeExplanation}
                </p>
              </div>
            </div>

            {/* Basic Company Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                {tc.basicInfo}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.companyName} *</label>
                  <input {...register("companyName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder={tc.companyNamePlaceholder} />
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.unifiedCreditCode} *</label>
                  <input {...register("unifiedCreditCode")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.unifiedCreditCodePlaceholder} maxLength={18} />
                  {errors.unifiedCreditCode && <p className="text-red-500 text-xs mt-1">{errors.unifiedCreditCode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.legalRep} *</label>
                  <input {...register("legalPersonName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.legalRepPlaceholder} />
                  {errors.legalPersonName && <p className="text-red-500 text-xs mt-1">{errors.legalPersonName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.idCardNumber} *</label>
                  <input {...register("legalPersonIdCard")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.idCardNumberPlaceholder} maxLength={18} />
                  {errors.legalPersonIdCard && <p className="text-red-500 text-xs mt-1">{errors.legalPersonIdCard.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.registeredCapital}</label>
                  <input {...register("registeredCapital")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.registeredCapitalPlaceholder} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.establishedDate}</label>
                  <input {...register("establishedDate")} type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.businessTerm}</label>
                  <input {...register("businessTerm")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.businessTermPlaceholder} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.businessScope}</label>
                  <textarea {...register("businessScope")} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.businessScopePlaceholder} />
                </div>
              </div>
            </section>

            {/* Document Upload */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                {tc.documentUpload}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.businessLicense} *</label>
                  <input {...register("licenseImageUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.businessLicenseUrlPlaceholder} />
                  <p className="text-xs text-gray-500 mt-1">{tc.businessLicenseHint}</p>
                  {errors.licenseImageUrl && <p className="text-red-500 text-xs mt-1">{errors.licenseImageUrl.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tc.idCardFront}</label>
                    <input {...register("legalPersonIdCardFrontUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.idCardFrontUrlPlaceholder} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tc.idCardBack}</label>
                    <input {...register("legalPersonIdCardBackUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.idCardBackUrlPlaceholder} />
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                {tc.contactInfo}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.contactName} *</label>
                  <input {...register("contactName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                  {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.phone} *</label>
                  <input {...register("contactPhone")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.phonePlaceholder} maxLength={11} />
                  {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.email} *</label>
                  <input {...register("contactEmail")} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" />
                  {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail.message}</p>}
                </div>
              </div>
            </section>

            {/* Agency Company */}
            <section className="bg-purple-50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register("isAgency")} className="w-5 h-5 text-purple-600 rounded" />
                <div>
                  <span className="font-medium text-gray-800">{tc.iAmAgency}</span>
                  <p className="text-xs text-gray-500">{tc.agencyDesc}</p>
                </div>
              </label>
              {isAgency && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc.agencyLicenseUrl}</label>
                  <input {...register("agencyLicenseUrl")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500" placeholder={tc.agencyLicenseUrlPlaceholder} />
                </div>
              )}
            </section>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              {tc.nextPayFee}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}