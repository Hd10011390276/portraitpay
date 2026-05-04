"use client";

import { useLanguage } from "@/context/LanguageContext";

interface UsagePreferencesProps {
  allowLicensing: boolean;
  allowedScopes: string[];
  prohibitedContent: string[];
  onAllowLicensingChange: (value: boolean) => void;
  onAllowedScopesChange: (value: string[]) => void;
  onProhibitedContentChange: (value: string[]) => void;
}

const SCOPE_OPTIONS = [
  { value: "FILM", labelZh: "影视/短视频", labelEn: "Film & Short Video" },
  { value: "ANIMATION", labelZh: "动漫/卡通", labelEn: "Animation & Cartoon" },
  { value: "ADVERTISING", labelZh: "广告宣传", labelEn: "Advertising & Marketing" },
  { value: "GAMING", labelZh: "游戏/元宇宙", labelEn: "Gaming & Metaverse" },
  { value: "PRINT", labelZh: "印刷/出版", labelEn: "Print & Publishing" },
  { value: "MERCHANDISE", labelZh: "周边商品", labelEn: "Merchandise & Products" },
  { value: "SOCIAL_MEDIA", labelZh: "社交媒体", labelEn: "Social Media" },
  { value: "EDUCATION", labelZh: "教育/培训", labelEn: "Education & Training" },
  { value: "NEWS", labelZh: "新闻/报道", labelEn: "News & Reporting" },
];

const PROHIBITED_OPTIONS = [
  { value: "ADULT", labelZh: "成人/色情内容", labelEn: "Adult/Pornographic Content" },
  { value: "POLITICAL", labelZh: "政治/反动内容", labelEn: "Political/Subversive Content" },
  { value: "VIOLENCE", labelZh: "暴力/血腥内容", labelEn: "Violent/Gory Content" },
  { value: "HATE", labelZh: "仇恨/歧视内容", labelEn: "Hate Speech/Discrimination" },
  { value: "FRAUD", labelZh: "欺诈/诈骗内容", labelEn: "Fraud/Scam Content" },
  { value: "WEAPONS", labelZh: "武器/危险品", labelEn: "Weapons/Dangerous Items" },
  { value: "ILLEGAL", labelZh: "违法行为", labelEn: "Illegal Activities" },
];

export function UsagePreferences({
  allowLicensing,
  allowedScopes,
  prohibitedContent,
  onAllowLicensingChange,
  onAllowedScopesChange,
  onProhibitedContentChange,
}: UsagePreferencesProps) {
  const { locale } = useLanguage();
  const isZh = locale === "zh-CN" || locale === "zh-Hant";

  const toggleScope = (value: string) => {
    if (allowedScopes.includes(value)) {
      onAllowedScopesChange(allowedScopes.filter((s) => s !== value));
    } else {
      onAllowedScopesChange([...allowedScopes, value]);
    }
  };

  const toggleProhibited = (value: string) => {
    if (prohibitedContent.includes(value)) {
      onProhibitedContentChange(prohibitedContent.filter((s) => s !== value));
    } else {
      onProhibitedContentChange([...prohibitedContent, value]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {isZh ? "肖像使用偏好" : "Portrait Usage Preferences"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isZh
            ? "设置您的肖像授权范围和禁止使用的内容类型"
            : "Set your portrait licensing scope and prohibited content types"}
        </p>
      </div>

      {/* Allow Licensing Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {isZh ? "允许肖像授权" : "Allow Portrait Licensing"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isZh
              ? allowLicensing
                ? "允许他人申请使用您的肖像"
                : "保留所有权利，禁止授权"
              : allowLicensing
              ? "Allow others to license your portrait"
              : "All rights reserved, licensing disabled"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAllowLicensingChange(!allowLicensing)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${allowLicensing ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${allowLicensing ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Allowed Scopes - Only show if licensing is allowed */}
      {allowLicensing && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {isZh ? "允许的使用范围" : "Allowed Usage Scope"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {isZh
              ? "选择允许的使用场景（不选则全部允许）"
              : "Select allowed use cases (leave empty to allow all)"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleScope(option.value)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors text-left
                  ${
                    allowedScopes.includes(option.value)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
              >
                {isZh ? option.labelZh : option.labelEn}
              </button>
            ))}
          </div>
          {allowedScopes.length > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {isZh
                ? `已选择 ${allowedScopes.length} 个使用范围`
                : `${allowedScopes.length} scopes selected`}
            </p>
          )}
        </div>
      )}

      {/* Prohibited Content */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {isZh ? "禁止使用于" : "Prohibited Content"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {isZh
            ? "即使已授权，也绝对禁止用于以下内容"
            : "Never allow use for the following content, even if licensed"}
        </p>
        <div className="space-y-2">
          {PROHIBITED_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors
                ${
                  prohibitedContent.includes(option.value)
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <input
                type="checkbox"
                checked={prohibitedContent.includes(option.value)}
                onChange={() => toggleProhibited(option.value)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
              />
              <span
                className={`text-sm ${
                  prohibitedContent.includes(option.value)
                    ? "text-red-700 dark:text-red-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {isZh ? option.labelZh : option.labelEn}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
