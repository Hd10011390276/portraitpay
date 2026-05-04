"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Transfer {
  id: string;
  portraitId: string;
  portraitTitle: string;
  fromUserId: string;
  toUserId: string;
  toEmail: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REJECTED";
  createdAt: string;
  completedAt?: string;
}

interface Portrait {
  id: string;
  title: string;
  status: string;
}

export default function OwnerPage() {
  const { t, locale } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [selectedPortraitId, setSelectedPortraitId] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) { window.location.href = "/login"; return; }
        const json = await res.json();
        setUser(json.data?.user || json.user || null);
      } catch { window.location.href = "/login"; }
      finally { setChecking(false); }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [portraitsRes, transfersRes] = await Promise.all([
          fetch("/api/portraits", { credentials: "include" }),
          fetch("/api/v1/transfers", { credentials: "include" }),
        ]);
        if (portraitsRes.ok) {
          const portraitsData = await portraitsRes.json();
          setPortraits(portraitsData.data || []);
        }
        if (transfersRes.ok) {
          const transfersData = await transfersRes.json();
          setTransfers(transfersData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, [user]);

  const handleInitiateTransfer = () => {
    if (!selectedPortraitId) {
      setError(t.owner.selectPortraitRequired);
      return;
    }
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      setError(t.owner.enterValidEmail);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmTransfer = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/transfers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portraitId: selectedPortraitId, toEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.owner.transferFailed);
        setShowConfirm(false);
        return;
      }
      setSuccess(true);
      setShowConfirm(false);
      setSelectedPortraitId("");
      setToEmail("");
      const transfersRes = await fetch("/api/v1/transfers", { credentials: "include" });
      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setTransfers(transfersData.data || []);
      }
    } catch {
      setError(t.owner.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Transfer["status"]) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels = {
      PENDING: t.owner.pending,
      COMPLETED: t.owner.completed,
      CANCELLED: t.owner.cancelled,
      REJECTED: t.owner.rejected,
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardShell
      title={t.owner.title}
      subtitle={t.owner.subtitle}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Transfer Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              🔄 {t.owner.initiateTransfer}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t.owner.initiateTransferDesc}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Portrait selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.owner.selectPortrait}
              </label>
              <select
                value={selectedPortraitId}
                onChange={(e) => setSelectedPortraitId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t.owner.selectPortraitOption}</option>
                {portraits.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                ))}
              </select>
            </div>

            {/* Recipient email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.owner.recipientEmail}
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder={t.owner.recipientEmailPlaceholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                ✅ {t.owner.transferRequestSent}
              </div>
            )}

            <button
              onClick={handleInitiateTransfer}
              disabled={submitting}
              className="w-full px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.owner.processing : t.owner.initiateTransfer}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t.owner.confirmTransfer}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t.owner.confirmTransferDesc.replace("{email}", toEmail)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.owner.cancel}
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? t.owner.processing : t.owner.confirm}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer History */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.owner.transferHistory}
            </h2>
          </div>

          {transfers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              {t.owner.noTransferHistory}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="p-4 sm:p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-lg flex-shrink-0">
                    🔄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {transfer.portraitTitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.owner.to}: {transfer.toEmail}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(transfer.createdAt).toLocaleDateString(locale === "zh-CN" || locale === "zh-Hant" ? "zh-CN" : "en-US", {
                        timeZone: "Asia/Shanghai",
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(transfer.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}