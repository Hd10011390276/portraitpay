"use client";
import { UserRole } from "@/lib/auth/schemas";

const ROLES = [
  {
    value: "USER",
    label: "普通用户",
    description: "浏览和购买数字艺术品",
    icon: "👤",
  },
  {
    value: "ARTIST",
    label: "艺人",
    description: "上传和出售个人艺术作品",
    icon: "🎨",
  },
  {
    value: "AGENCY",
    label: "经纪公司",
    description: "管理旗下艺人账号和作品",
    icon: "🏢",
  },
  {
    value: "ENTERPRISE",
    label: "企业",
    description: "批量采购和企业级合作",
    icon: "🏭",
  },
] as const;

interface RoleSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        选择角色
      </label>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((role) => (
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
