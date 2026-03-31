"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Locale } from "@/lib/i18n/translations";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  const toggle = () => {
    setLocale(locale === "zh-CN" ? "en-US" : "zh-CN");
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setLocale("en-US")}
        className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
          locale === "en-US"
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLocale("zh-CN")}
        className={`px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
          locale === "zh-CN"
            ? "bg-blue-600 text-white"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        title="中文"
      >
        中
      </button>
    </div>
  );
}
