"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, defaultLocale, translations } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (typeof translations)[Locale];
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  get t() {
    return translations[defaultLocale];
  },
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Read initial locale from cookie on mount
  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("pp_locale="));
    if (cookie) {
      const val = cookie.split("=")[1] as Locale;
      if (val === "en-US" || val === "zh-CN") {
        setLocaleState(val);
      }
    }
  }, []);

  // Sync locale → cookie + document lang + document title/meta
  useEffect(() => {
    // Cookie (30 day expiry)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `pp_locale=${locale}; path=/; expires=${expires}; SameSite=Lax`;

    // Update <html lang>
    document.documentElement.lang = locale;

    // Update page title
    const t = translations[locale];
    const pageTitle = t.meta.title;
    if (document.title !== pageTitle) {
      document.title = pageTitle;
    }

    // Update meta description
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement("meta");
      descEl.setAttribute("name", "description");
      document.head.appendChild(descEl);
    }
    descEl.setAttribute("content", t.meta.description);

    // Update OG title + description
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute("content", t.meta.title);
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute("content", t.meta.description);

    // Update Twitter title + description
    const twTitleEl = document.querySelector('meta[name="twitter:title"]');
    if (twTitleEl) twTitleEl.setAttribute("content", t.meta.title);
    const twDescEl = document.querySelector('meta[name="twitter:description"]');
    if (twDescEl) twDescEl.setAttribute("content", t.meta.description);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
