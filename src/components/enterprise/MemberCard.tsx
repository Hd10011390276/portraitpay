"use client";

interface Member {
  id: string;
  name: string;
  email: string;
  rightType: string;
  revenueShare: number;
  status: string;
  folderId: string | null;
}

interface MemberCardProps {
  member: Member;
  isExpanded: boolean;
  onToggle: (memberId: string) => void;
}

const rightTypeLabels: Record<string, string> = {
  OWNER: "Owner",
  CO_OWNER: "Co-Owner",
  BENEFICIARY: "Beneficiary",
  HEIR: "Heir",
  TRUSTEE: "Trustee",
};

export function MemberCard({ member, isExpanded, onToggle }: MemberCardProps) {
  return (
    <button
      onClick={() => onToggle(member.id)}
      className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md ${
        isExpanded
          ? "bg-white dark:bg-gray-800 border-purple-500 dark:border-purple-400 shadow-md"
          : "bg-gray-800 dark:bg-gray-900 border-gray-700 dark:border-gray-700 hover:bg-gray-750 dark:hover:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
          {member.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
          <p className="text-xs text-gray-400 truncate">{member.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
            {rightTypeLabels[member.rightType] || member.rightType}
          </span>
          <span className="text-xs text-gray-400">
            {Math.round(member.revenueShare * 100)}% share
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );
}