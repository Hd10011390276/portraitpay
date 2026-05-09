"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast, ToastProvider } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

function SettingsContent() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role?: string; mediaKitUrl?: string | null; mediaKitShareConfirmed?: boolean; mediaKitReviewOnlyAcknowledged?: boolean; mediaKitVisibility?: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [infringementAlerts, setInfringementAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  // Actor Media Kit state
  const [mediaKitUrl, setMediaKitUrl] = useState("");
  const [mediaKitShareConfirmed, setMediaKitShareConfirmed] = useState(false);
  const [mediaKitReviewOnlyAcknowledged, setMediaKitReviewOnlyAcknowledged] = useState(false);
  const [mediaKitVisibility, setMediaKitVisibility] = useState("PRIVATE");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) { window.location.href = "/login"; return; }
        const json = await res.json();
        const u = json.data?.user || json.user;
        setUser(u ? { id: u.id, email: u.email, name: u.name, role: u.role, mediaKitUrl: u.mediaKitUrl, mediaKitShareConfirmed: u.mediaKitShareConfirmed, mediaKitReviewOnlyAcknowledged: u.mediaKitReviewOnlyAcknowledged, mediaKitVisibility: u.mediaKitVisibility } : null);
        if (u) {
          setMediaKitUrl(u.mediaKitUrl || "");
          setMediaKitShareConfirmed(u.mediaKitShareConfirmed || false);
          setMediaKitReviewOnlyAcknowledged(u.mediaKitReviewOnlyAcknowledged || false);
          setMediaKitVisibility(u.mediaKitVisibility || "PRIVATE");
        }
      } catch { window.location.href = "/login"; }
      finally { setChecking(false); }
    };
    checkAuth();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (user?.role === "ACTOR") {
        payload.mediaKitUrl = mediaKitUrl;
        payload.mediaKitShareConfirmed = mediaKitShareConfirmed;
        payload.mediaKitReviewOnlyAcknowledged = mediaKitReviewOnlyAcknowledged;
        payload.mediaKitVisibility = mediaKitVisibility;
      }
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: t.settings.settingsSaved });
      } else {
        toast({ type: "error", title: json.error || t.settings.settingsSavedError });
      }
    } catch {
      toast({ type: "error", title: t.settings.settingsSavedError });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(t.settings.deleteAccountConfirm || "Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
      toast({ type: "error", title: t.settings.deleteAccountError || "Account deletion requires contacting support" });
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardShell
      title={t.settings.title}
      subtitle={t.settings.subtitle}
    >
      <div className="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t.settings.notificationSettings}</h2>
            <div className="space-y-4">
              {[
                {
                  id: "emailNotifications",
                  label: t.settings.emailNotifications,
                  desc: t.settings.emailNotificationsDesc,
                  checked: emailNotifications,
                  onChange: setEmailNotifications,
                },
                {
                  id: "infringementAlerts",
                  label: t.settings.infringementAlerts,
                  desc: t.settings.infringementAlertsDesc,
                  checked: infringementAlerts,
                  onChange: setInfringementAlerts,
                },
                {
                  id: "marketingEmails",
                  label: t.settings.marketingEmails,
                  desc: t.settings.marketingEmailsDesc,
                  checked: marketingEmails,
                  onChange: setMarketingEmails,
                },
              ].map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.checked}
                    onClick={() => item.onChange(!item.checked)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      item.checked ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        item.checked ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t.settings.accountInfo}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.settings.emailAddress}</label>
                <input
                  type="email"
                  id="email"
                  defaultValue={user?.email || ""}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.settings.displayName}</label>
                <input
                  type="text"
                  id="name"
                  defaultValue={user?.name || ""}
                  placeholder={t.settings.namePlaceholder || "设置您的显示名称"}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* TEMP: show for all roles for preview */}
          {true && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-blue-900 dark:text-blue-200 mb-1">
                {t.register.mediaKitTitle || "Media Kit / Casting Link"}
              </h2>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-5">
                {t.register.mediaKitHelp || "Optional. Link to your headshots, demo reel, or casting profile for creator review."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1.5">
                    {t.register.mediaKitUrlLabel || "Media Kit URL"}
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    placeholder={t.register.mediaKitPlaceholder || "https://drive.google.com/..."}
                    value={mediaKitUrl}
                    onChange={(e) => setMediaKitUrl(e.target.value)}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mediaKitShareConfirmed}
                      onChange={(e) => setMediaKitShareConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      {t.register.mediaKitShareConfirm || "I confirm this link is provided by me and I have the right to share it."}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mediaKitReviewOnlyAcknowledged}
                      onChange={(e) => setMediaKitReviewOnlyAcknowledged(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      {t.register.mediaKitReviewOnly || "I understand this link is for review purposes only and does not grant AI likeness usage rights."}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                    {t.register.mediaKitVisibility || "Media Kit Visibility"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: "PRIVATE", label: t.register.mediaKitVisibilityPrivate || "Hidden, share by request only" },
                      { value: "VERIFIED_CREATORS", label: t.register.mediaKitVisibilityVerified || "Visible to verified creators only" },
                      { value: "PUBLIC", label: t.register.mediaKitVisibilityPublic || "Public" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMediaKitVisibility(opt.value)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                          mediaKitVisibility === opt.value
                            ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                            : "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Settings - only for ADMIN role */}
          {user?.role === "ADMIN" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-200 dark:border-orange-800/50 p-6">
              <h2 className="text-base font-semibold text-orange-600 dark:text-orange-400 mb-1">{t.settings.adminSettings}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">{t.settings.adminSettingsDesc}</p>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.settings.userManagement}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.settings.userManagementDesc}</p>
                  </div>
                  <Link href="/admin/users" className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition">
                    {t.settings.manageUsers}
                  </Link>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.settings.enterpriseReview}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.settings.enterpriseReviewDesc}</p>
                  </div>
                  <Link href="/admin/enterprise" className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition">
                    {t.settings.processReview}
                  </Link>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.settings.systemSettings}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.settings.systemSettingsDesc}</p>
                  </div>
                  <Link href="/admin/settings" className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 transition">
                    {t.settings.systemConfiguration}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
            <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-5">{t.settings.dangerZone}</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.settings.deleteAccount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.settings.deleteAccountDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                >
                  {t.settings.deleteAccountBtn}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {saving ? t.settings.saving : t.settings.saveSettings}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}
