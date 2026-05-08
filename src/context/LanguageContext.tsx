"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, translations } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // Using `any` because translations vary by locale and we use runtime fallback
  t: any;
}

const EN_ONLY = "en-US";

const LanguageContext = createContext<LanguageContextValue>({
  locale: EN_ONLY,
  setLocale: () => {},
  t: translations[EN_ONLY],
});

// Deep merge fallback: current locale overrides, en-US fills in gaps
function deepFallback<T extends object>(current: T, fallback: T): T {
  const result: any = { ...fallback };
  for (const key in current) {
    if (current[key] !== null && typeof current[key] === "object" && !Array.isArray(current[key])) {
      result[key] = deepFallback(current[key], (fallback as any)[key] || {});
    } else {
      result[key] = current[key];
    }
  }
  return result as T;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale] = useState<Locale>(EN_ONLY);

  // Force en-US always — language switch is disabled
  useEffect(() => {
    document.cookie = `pp_locale=${EN_ONLY}; path=/; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}; SameSite=Lax`;
    document.documentElement.lang = EN_ONLY;
  }, []);

  // Block all locale changes — English only
  const setLocale = (_newLocale: Locale) => {
    // no-op: language switching is disabled
  };

  // Always use en-US translations (with en-US fallback for any missing keys)
  const t = deepFallback(translations[EN_ONLY] || {}, translations[EN_ONLY]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}