"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, defaultLocale, translations, TranslationKeys } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // Using `any` because translations vary by locale and we use runtime fallback
  t: any;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: translations[defaultLocale],
});

// Normalize zh-CN → zh-Hant so the correct translations block is found
function normalizeLocale(loc: Locale): Locale {
  if (loc === "zh-CN") return "zh-Hant";
  return loc;
}

// Deep get with fallback to en-US
function getWithFallback<T>(obj: T, path: string): any {
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object" || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

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
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Read initial locale from cookie on mount
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("pp_locale="));
    if (cookie) {
      const val = cookie.split("=")[1] as Locale;
      if (val === "en-US" || val === "es-ES" || val === "zh-Hant" || val === "zh-CN") {
        setLocaleState(val);
      }
    }
  }, []);

  // Sync locale → cookie + document lang + document title/meta
  useEffect(() => {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `pp_locale=${locale}; path=/; expires=${expires}; SameSite=Lax`;
    document.documentElement.lang = normalizeLocale(locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  // Build merged translation with en-US fallback (zh-CN normalizes to zh-Hant for translations lookup)
  const t = deepFallback(translations[normalizeLocale(locale)] || {}, translations["en-US"]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
