"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { LanguageToggle } from "./LanguageToggle";
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
  /** Forces light-mode white background, ignoring theme toggle. Use for pages that must always be white. */
  forceLight?: boolean;
}

export function DashboardShell({ children, title, subtitle, action, forceLight }: DashboardShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read current theme from localStorage (matches ThemeToggle)
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "dark" : "light");

    // Listen for theme changes from ThemeToggle
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: string }>;
      setTheme(customEvent.detail.theme as "light" | "dark");
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        setUser(json.data?.user || json.user || null);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
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

  return (
    <div className={`min-h-screen ${forceLight ? "bg-white" : theme === "dark" ? "bg-gray-950" : "bg-gray-50"}`}>
      {/* Sidebar - hidden on mobile, shown on desktop */}
      <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
        <Sidebar />
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
          <Sidebar onClose={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Mobile top bar */}
      <div className={`sm:hidden fixed top-0 left-0 right-0 z-20 h-14 ${forceLight ? "bg-white" : theme === "dark" ? "bg-gray-900" : "bg-white"} border-b ${forceLight ? "border-gray-200" : theme === "dark" ? "border-gray-700" : "border-gray-200"} flex items-center px-4 gap-2 shrink-0`}>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1" />
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Main content — offset by sidebar on desktop, topbar on mobile */}
      <div className="sm:ml-64">
        <Header user={user} title={title} subtitle={subtitle} action={action} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
