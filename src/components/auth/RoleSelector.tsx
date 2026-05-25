"use client";
import { useLanguage } from "@/context/LanguageContext";
import { UserRole } from "@/lib/auth/schemas";

interface RoleSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  const { t } = useLanguage();

  const roles = [
    {
      value: "TALENT",
      label: t.register.roleTalent || "Actor/Creator",
      description: t.register.roleTalentDesc || "Actors, models, influencers - can upload portraits and create content",
      icon: "🎭",
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {t.register.selectRole}
      </label>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`
              flex flex-col items-start p-3 rounded-xl border text-left transition-all
              ${
                value === role.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
              }
            `}
          >
            <span className="text-xl mb-1">{role.icon}</span>
            <span
              className={`text-sm font-semibold ${
                value === role.value
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {role.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
              {role.description}
            </span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}