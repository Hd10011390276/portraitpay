"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import ThemeToggle from "@/components/ThemeToggle";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  forceLight?: boolean;
}

export function DashboardShell({ children, title, subtitle, action, forceLight }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [effectiveRole, setEffectiveRole] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "dark" : "light");

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: string }>;
      setTheme(customEvent.detail.theme as "light" | "dark");
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  // Load effective role from localStorage (after mount to avoid hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("pp_effective_role");
    if (saved) setEffectiveRole(saved);
  }, []);

  const handleRoleSwitch = async (role: string) => {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("pp_access_token", data.data.accessToken);
        localStorage.setItem("pp_user", JSON.stringify(data.data.user));
        localStorage.removeItem("pp_effective_role");
        setEffectiveRole(null);
        if (user) setUser({ ...user, role });
      }
    } catch {
      // Fallback to localStorage-only
      localStorage.setItem("pp_effective_role", role);
      setEffectiveRole(role);
    }
  };

  const [timeoutError, setTimeoutError] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let controller: AbortController;

    const checkAuth = async () => {
      try {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        setUser(json.data?.user || json.user || null);
        setAvailableRoles(json.data?.availableRoles || []);
      } catch (e: any) {
        // Timeout or network error — stop spinner, show retry
        clearTimeout(timeoutId);
        if (e?.name === "AbortError") {
          setTimeoutError(true);
        }
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    return () => { clearTimeout(timeoutId); controller?.abort(); };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="PortraitPay AI" className="w-10 h-10 rounded-lg object-contain" />
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (timeoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <img src="/logo.png" alt="PortraitPay AI" className="w-10 h-10 rounded-lg object-contain" />
          <div className="text-red-500 text-4xl">!</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connection failed</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The authentication server is not responding. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${forceLight ? "bg-white" : theme === "dark" ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
        <Sidebar userRole={effectiveRole || user?.role} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-y-0 left-0 z-40 sm:hidden">
          <Sidebar onClose={() => setMobileMenuOpen(false)} userRole={effectiveRole || user?.role} />
        </div>
      )}

      {/* Mobile top bar */}
      <div
        className={`sm:hidden fixed top-0 left-0 right-0 z-20 h-14 ${forceLight ? "bg-white" : theme === "dark" ? "bg-gray-900" : "bg-white"} border-b ${forceLight ? "border-gray-200" : theme === "dark" ? "border-gray-700" : "border-gray-200"} flex items-center px-4 gap-2 shrink-0`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1" />
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="sm:ml-64">
        <Header user={user} title={title} subtitle={subtitle} action={action}
          effectiveRole={effectiveRole} onRoleSwitch={handleRoleSwitch}
          availableRoles={availableRoles} />
        <main
          key={pathname}
          className="p-4 sm:p-6 sm:pt-6"
          style={{
            paddingTop: `calc(3.5rem + env(safe-area-inset-top))`,
            paddingBottom: `max(2rem, env(safe-area-inset-bottom, 1rem))`,
            minHeight: "100dvh",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}