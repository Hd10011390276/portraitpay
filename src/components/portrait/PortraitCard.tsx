"use client";

import React from "react";

type PortraitStatus = "DRAFT" | "UNDER_REVIEW" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

interface Portrait {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: PortraitStatus;
  thumbnailUrl?: string | null;
  originalImageUrl?: string | null;
  imageHash?: string | null;
  blockchainTxHash?: string | null;
  ipfsCid?: string | null;
  certifiedAt?: string | null;
  createdAt: string;
  isPublic: boolean;
}

const STATUS_CONFIG: Record<PortraitStatus, { label: string; labelZh: string; color: string; bg: string; darkBg: string }> = {
  DRAFT:        { label: "Draft",        labelZh: "草稿",       color: "text-gray-600",   bg: "bg-gray-100",       darkBg: "dark:bg-gray-800 dark:text-gray-400" },
  UNDER_REVIEW: { label: "Under Review", labelZh: "审核中",     color: "text-yellow-700", bg: "bg-yellow-50",      darkBg: "dark:bg-yellow-900/30 dark:text-yellow-400" },
  ACTIVE:       { label: "Active",       labelZh: "已认证",     color: "text-green-700",  bg: "bg-green-50",       darkBg: "dark:bg-green-900/30 dark:text-green-400" },
  SUSPENDED:    { label: "Suspended",     labelZh: "已暂停",     color: "text-red-700",    bg: "bg-red-50",         darkBg: "dark:bg-red-900/30 dark:text-red-400" },
  ARCHIVED:     { label: "Archived",     labelZh: "已归档",     color: "text-gray-400",   bg: "bg-gray-50",        darkBg: "dark:bg-gray-800 dark:text-gray-500" },
};

interface PortraitCardProps {
  portrait: Portrait;
  onView: (id: string) => void;
  onCertify?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function PortraitCard({ portrait, onView, onCertify, onDelete }: PortraitCardProps) {
  const cfg = STATUS_CONFIG[portrait.status] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200">
      {/* Thumbnail */}
      <div
        className="relative w-full cursor-pointer overflow-hidden flex-shrink-0"
        style={{ height: "200px" }}
        onClick={() => onView(portrait.id)}
      >
        {portrait.thumbnailUrl || portrait.originalImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait.thumbnailUrl ?? portrait.originalImageUrl!}
            alt={portrait.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-4xl">
            👤
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.color} ${cfg.darkBg}`}>
            {cfg.labelZh}
          </span>
        </div>

        {/* Blockchain badge */}
        {portrait.blockchainTxHash && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              🔗 已上链
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{portrait.title}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date(portrait.createdAt).toLocaleDateString("zh-CN")}
          </p>
        </div>

        {portrait.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{portrait.description}</p>
        )}

        {/* Category tag */}
        {portrait.category && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit">
            {portrait.category}
          </span>
        )}

        {/* Blockchain info */}
        {portrait.blockchainTxHash && (
          <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
              Tx: {portrait.blockchainTxHash.slice(0, 8)}…{portrait.blockchainTxHash.slice(-6)}
            </p>
            {portrait.ipfsCid && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                IPFS: {portrait.ipfsCid.slice(0, 10)}…
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onView(portrait.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            查看
          </button>

          {portrait.status === "DRAFT" && portrait.originalImageUrl && onCertify && (
            <button
              onClick={() => onCertify(portrait.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔗 认证
            </button>
          )}

          {portrait.status !== "ARCHIVED" && onDelete && (
            <button
              onClick={() => { if (confirm("归档此肖像?")) onDelete(portrait.id); }}
              className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
