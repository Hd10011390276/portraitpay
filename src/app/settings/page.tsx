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
  // Portrait Settings state
  const [allowLicensing, setAllowLicensing] = useState(true);
  const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
  const [prohibitedContent, setProhibitedContent] = useState<string[]>([]);
  const [defaultLicenseFee, setDefaultLicenseFee] = useState(0);
  const [defaultTerritorialScope, setDefaultTerritorialScope] = useState("global");
  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
        // Fetch portrait settings
        const psRes = await fetch("/api/user", { credentials: "include" });
        if (psRes.ok) {
          const psJson = await psRes.json();
          const ps = psJson.data?.user?.portraitSettings;
          if (ps) {
            setAllowLicensing(ps.allowLicensing ?? true);
            setAllowedScopes(ps.allowedScopes ?? []);
            setProhibitedContent(ps.prohibitedContent ?? []);
            setDefaultLicenseFee(Number(ps.defaultLicenseFee) || 0);
            setDefaultTerritorialScope(ps.defaultTerritorialScope ?? "global");
          }
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
      if (user?.role === "TALENT") {
        payload.mediaKitUrl = mediaKitUrl;
        payload.mediaKitShareConfirmed = mediaKitShareConfirmed;
        payload.mediaKitReviewOnlyAcknowledged = mediaKitReviewOnlyAcknowledged;
        payload.mediaKitVisibility = mediaKitVisibility;
      }
      // Portrait Licensing Settings
      payload.portraitAllowLicensing = allowLicensing;
      payload.portraitAllowedScopes = allowedScopes;
      payload.portraitProhibitedContent = prohibitedContent;
      payload.portraitDefaultLicenseFee = defaultLicenseFee;
      payload.portraitDefaultTerritorialScope = defaultTerritorialScope;
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Account deleted. Goodbye!" });
        setTimeout(() => { window.location.href = "/"; }, 1500);
      } else {
        toast({ type: "error", title: json.error || "Failed to delete account" });
      }
    } catch {
      toast({ type: "error", title: "Failed to delete account" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(newPassword)) { setPasswordError("Password must contain at least one uppercase letter"); return; }
    if (!/[a-z]/.test(newPassword)) { setPasswordError("Password must contain at least one lowercase letter"); return; }
    if (!/[0-9]/.test(newPassword)) { setPasswordError("Password must contain at least one number"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match"); return; }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ type: "success", title: t.settings.passwordChanged });
      } else {
        setPasswordError(json.error || "Failed to change password");
      }
    } catch {
      setPasswordError("Network error, please try again");
    } finally {
      setChangingPassword(false);
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

          {/* Password Change */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t.settings.changePassword || "Change Password"}</h2>
            {passwordSuccess ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                <p className="text-sm text-green-700 dark:text-green-300">{t.settings.passwordChangedSuccess || "Password changed successfully!"}</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.settings.currentPassword || "Current Password"}</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.settings.newPassword || "New Password"}</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.settings.newPasswordHint || "Min 8 chars, uppercase, lowercase, number"}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.settings.confirmNewPassword || "Confirm New Password"}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.settings.confirmPasswordHint || "Repeat new password"}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                </div>
                {passwordError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{passwordError}</div>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={changingPassword}
                    className="px-5 py-2 text-sm font-medium bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition">
                    {changingPassword ? (t.settings.changing || "Changing...") : (t.settings.changePasswordBtn || "Change Password")}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Talent Media Kit — only for TALENT role */}
          {user?.role === "TALENT" && (
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

          {/* Portrait Licensing Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800/50 p-6">
            <h2 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-1">Portrait Licensing Preferences</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Define how others can use your portrait. These defaults apply to new consent authorizations.</p>

            {/* Allow Licensing Toggle */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Licensing</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">When off, all licensing requests are declined by default.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allowLicensing}
                onClick={() => setAllowLicensing(!allowLicensing)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${allowLicensing ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowLicensing ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Allowed Scopes */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Allowed Usage Types</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["FILM", "ANIMATION", "ADVERTISING", "GAMING", "PRINT", "MERCHANDISE", "SOCIAL_MEDIA", "EDUCATION", "NEWS"].map((scope) => (
                  <label key={scope} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowedScopes.includes(scope)}
                      onChange={() => {
                        setAllowedScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{scope.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Leave all unchecked = all types allowed</p>
            </div>

            {/* Prohibited Content */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Prohibited Content</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["ADULT", "POLITICAL", "VIOLENCE", "HATE", "FRAUD", "WEAPONS", "ILLEGAL"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prohibitedContent.includes(type)}
                      onChange={() => {
                        setProhibitedContent(prev => prev.includes(type) ? prev.filter(c => c !== type) : [...prev, type]);
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{type}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Content types NEVER allowed regardless of licensing</p>
            </div>

            {/* Default Fee + Territory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default License Fee (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={defaultLicenseFee}
                  onChange={(e) => setDefaultLicenseFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">0 = case by case</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Territory</label>
                <select
                  value={defaultTerritorialScope}
                  onChange={(e) => setDefaultTerritorialScope(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="global">Global</option>
                  <option value="china">China</option>
                  <option value="asia">Asia</option>
                  <option value="europe">Europe</option>
                  <option value="americas">Americas</option>
                </select>
              </div>
            </div>
          </div>

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
