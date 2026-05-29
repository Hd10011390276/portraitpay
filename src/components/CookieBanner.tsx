"use client";
import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-800 dark:border-t dark:border-gray-700 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6">
      <p className="text-xs sm:text-sm">This site uses cookies for authentication and security purposes. By continuing, you accept our Privacy Policy.</p>
      <button onClick={() => { localStorage.setItem("cookie-consent", "true"); setVisible(false); }}
        className="px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap min-h-[44px] min-w-[80px]">
        Accept
      </button>
    </div>
  );
}