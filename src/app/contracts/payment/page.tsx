/**
 * /contracts/payment — Payment page to unlock Word download
 * Shows PayPal options, then unlocks Word download on confirmation.
 */
"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const CONTRACT_LABELS: Record<string, { label: string; labelZh: string }> = {
  "00-Overview-and-Signing-Guide": { label: "Overview & Signing Guide", labelZh: "概览与签署指南" },
  "01-Standard-License-Agreement": { label: "Standard License Agreement", labelZh: "标准授权协议" },
  "02-Exclusive-License-Agreement": { label: "Exclusive License Agreement", labelZh: "独家授权协议" },
  "03-Endorsement-License-Agreement": { label: "Endorsement License Agreement", labelZh: "代言授权协议" },
  "04-Film-Adaptation-License-Agreement": { label: "Film Adaptation License Agreement", labelZh: "影视改编授权协议" },
};

// PayPal.me link — PortraitPay AI official PayPal account
const PAYPAL_LINK = "https://www.paypal.me/PortraitPayAI/1";

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentPageLoading />}>
      <PaymentPageInner />
    </Suspense>
  );
}

function PaymentPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-[#244169] border-t-transparent rounded-full" />
    </div>
  );
}

function getContractLabel(contract: { label: string; labelZh: string } | undefined, locale: string): string {
  if (!contract) return "";
  return locale === "zh-CN" || locale === "zh-Hant" ? contract.labelZh : contract.label;
}

function PaymentPageInner() {
  const { t, locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";
  const searchParams = useSearchParams();
  const contractName = searchParams.get("name") || "";
  const contract = CONTRACT_LABELS[contractName];

  const [email, setEmail] = useState("");
  const [txId, setTxId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUnlock() {
    if (!email.trim() || !txId.trim()) {
      setError(t.contracts.errorEmailTxId);
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/contracts/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), txId: txId.trim(), contractName }),
      });
      const data = await res.json();
      if (data.unlocked) {
        localStorage.setItem(`wordUnlocked_${contractName}`, "true");
        // Notify the contracts page
        window.dispatchEvent(new Event("contracts:unlock"));
        setSuccess(true);
      } else {
        setError(data.error || t.contracts.errorVerifyFailed);
      }
    } catch {
      setError(t.contracts.errorGeneric);
    } finally {
      setVerifying(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.contracts.unlockSuccess}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.contracts.unlockSuccessDesc}
          </p>
          <Link
            href="/contracts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#244169] hover:bg-[#1a3354] text-white font-medium rounded-lg transition-colors"
          >
            {t.contracts.backToCenter}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Minimal sticky header with back link + theme/language toggles */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/contracts" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">
            {t.contracts.title}
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Contract Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {t.contracts.unlockWord}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t.contracts.contractLabel}
            <span className="font-medium text-gray-900 dark:text-white">
              {contract ? getContractLabel(contract, locale) : contractName}
            </span>
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#244169]/10 rounded-full text-[#244169] dark:bg-[#244169]/20 dark:text-blue-400 text-sm font-medium">
            <span>$1 USD</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t.contracts.selectPayment}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* PayPal */}
            <a
              href={PAYPAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#0070ba] hover:bg-[#0070ba]/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-[#0070ba] flex items-center justify-center">
                <span className="text-white font-bold text-sm">PayPal</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">{t.contracts.paypal}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.contracts.paypalDesc}
                </p>
              </div>
            </a>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
            {t.contracts.paymentHint}
          </div>
        </div>

        {/* Verification Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t.contracts.verifyPayment}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {t.contracts.verifyPaymentDesc}
          </p>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.contracts.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.contracts.emailPlaceholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#244169] focus:border-transparent"
              />
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.contracts.txIdLabel}
              </label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder={t.contracts.txIdPlaceholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#244169] focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t.contracts.txIdHint}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={verifying}
              className="w-full py-3 bg-[#244169] hover:bg-[#1a3354] disabled:opacity-60 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.contracts.verifying}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t.contracts.verifyBtn}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/contracts" className="text-sm text-gray-500 hover:text-[#244169] dark:hover:text-blue-400 transition-colors">
            ← {t.contracts.backToCenter}
          </Link>
        </div>
      </main>
    </div>
  );
}
