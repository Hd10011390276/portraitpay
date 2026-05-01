"use client";

import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setLocale("en-US")}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          locale === "en-US"
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
        title={locale === "en-US" ? "English" : t.common.switchToEnglish}
        aria-label={locale === "en-US" ? "English" : t.common.switchToEnglish}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("es-ES")}
        className={`px-3 py-1.5 text-sm font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${
          locale === "es-ES"
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
        title={locale === "es-ES" ? "Español" : t.common.switchToSpanish}
        aria-label={locale === "es-ES" ? "Español" : t.common.switchToSpanish}
      >
        ES
      </button>
      <button
        onClick={() => setLocale("zh-Hant")}
        className={`px-3 py-1.5 text-sm font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${
          locale === "zh-Hant"
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
        title={locale === "zh-Hant" ? "繁體中文" : t.common.switchToTraditionalChinese}
        aria-label={locale === "zh-Hant" ? "繁體中文" : t.common.switchToTraditionalChinese}
      >
        繁
      </button>
    </div>
  );
}