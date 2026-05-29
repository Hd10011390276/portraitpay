"use client";

interface AgencyHeaderProps {
  agencyName: string;
  agencyType: string;
  memberCount: number;
}

const typeLabels: Record<string, string> = {
  ROOT_SPONSOR: "IP Owner / Brand",
  ENTERTAINMENT_AGENCY: "Entertainment Agency",
  ESTATE: "Estate / Heritage",
};

export function AgencyHeader({ agencyName, agencyType, memberCount }: AgencyHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{agencyName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {typeLabels[agencyType] || agencyType}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}