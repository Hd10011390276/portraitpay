"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/context/LanguageContext";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface HeaderProps {
  user?: User | null;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  effectiveRole?: string | null;
  onRoleSwitch?: (role: string) => void;
  availableRoles?: string[];
}

export function Header({ user, title, subtitle, action, effectiveRole, onRoleSwitch, availableRoles }: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Check for unread notifications
    const checkUnread = async () => {
      try {
        const res = await fetch("/api/v1/notifications/unread-count");
        const json = await res.json();
        setHasUnread(json.data?.count > 0);
      } catch {
        setHasUnread(false);
      }
    };
    checkUnread();
    // Refresh every 60 seconds
    const interval = setInterval(checkUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("pp_access_token");
      localStorage.removeItem("pp_refresh_token");
      localStorage.removeItem("pp_user");
      toast({ type: "success", title: t.header.logoutSuccess });
      router.push("/login");
    } catch {
      toast({ type: "error", title: t.header.logoutFailed, message: t.header.pleaseRetry });
      setLoggingOut(false);
    }
  };

  const initials = user?.name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 hidden sm:block">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Title */}
        <div>
          {title && <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {action && <div className="hidden sm:block">{action}</div>}

{/* Role switcher — shown when user has multiple account types */}
          {availableRoles && availableRoles.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  {effectiveRole || user?.role}
                </span>
                <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {roleSwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRoleSwitcherOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                      Switch Role
                    </p>
                    {availableRoles?.map((role) => {
                      const label = role === "AGENCY" ? "Agency / Entertainment" : role === "LAWYER" ? "Lawyer" : "Actor / Creator";
                      const href = role === "LAWYER" ? "/lawyer/dashboard" : role === "AGENCY" ? "/enterprise/dashboard" : "/dashboard";
                      return (
                        <button
                          key={role}
                          onClick={async () => {
                            setRoleSwitcherOpen(false);
                            if (onRoleSwitch) {
                              await onRoleSwitch(role);
                            } else {
                              localStorage.setItem("pp_effective_role", role);
                            }
                            router.push(href);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                            (effectiveRole || user?.role) === role
                              ? "text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {label}
                          {(effectiveRole || user?.role) === role && (
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* User avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    {user?.role && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {loggingOut ? (t.header?.loggingOut || 'Logging out...') : (t.header?.logout || 'Sign out')}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.header?.notifications || 'Notifications'}</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      {t.header?.noNotifications || 'No new notifications'}
                    </div>
                  </div>
                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block px-4 py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
                  >
                    {t.header?.viewAll || 'View all notifications'}
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Notifications bell */}
        </div>
      </div>
    </header>
  );
}
