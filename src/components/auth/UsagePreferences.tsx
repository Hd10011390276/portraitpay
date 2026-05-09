"use client";

interface UsagePreferencesProps {
  allowLicensing: boolean;
  allowedScopes: string[];
  prohibitedContent: string[];
  onAllowLicensingChange: (value: boolean) => void;
  onAllowedScopesChange: (value: string[]) => void;
  onProhibitedContentChange: (value: string[]) => void;
}

const SCOPE_OPTIONS = [
  { value: "FILM", label: "Film & Short Video" },
  { value: "ANIMATION", label: "Animation & Cartoon" },
  { value: "ADVERTISING", label: "Advertising & Marketing" },
  { value: "GAMING", label: "Gaming & Metaverse" },
  { value: "PRINT", label: "Print & Publishing" },
  { value: "MERCHANDISE", label: "Merchandise & Products" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "EDUCATION", label: "Education & Training" },
  { value: "NEWS", label: "News & Reporting" },
];

const PROHIBITED_OPTIONS = [
  { value: "ADULT", label: "Adult/Pornographic Content" },
  { value: "POLITICAL", label: "Political/Subversive Content" },
  { value: "VIOLENCE", label: "Violent/Gory Content" },
  { value: "HATE", label: "Hate Speech/Discrimination" },
  { value: "FRAUD", label: "Fraud/Scam Content" },
  { value: "WEAPONS", label: "Weapons/Dangerous Items" },
  { value: "ILLEGAL", label: "Illegal Activities" },
];

export function UsagePreferences({
  allowLicensing,
  allowedScopes,
  prohibitedContent,
  onAllowLicensingChange,
  onAllowedScopesChange,
  onProhibitedContentChange,
}: UsagePreferencesProps) {
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
          Portrait Usage Preferences
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Set your portrait licensing scope and prohibited content types
        </p>
      </div>

      {/* Allow Licensing Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Allow Portrait Licensing
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {allowLicensing
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
            Allowed Usage Scope
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Select allowed use cases (leave empty to allow all)
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
                {option.label}
              </button>
            ))}
          </div>
          {allowedScopes.length > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {allowedScopes.length} scopes selected
            </p>
          )}
        </div>
      )}

      {/* Prohibited Content */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Prohibited Content
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Never allow use for the following content, even if licensed
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
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
