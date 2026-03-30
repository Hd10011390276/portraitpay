"use client";

import React from "react";
import type { TraceResult } from "./FaceTraceUploader";

interface FaceTraceResultsProps {
  results: TraceResult[];
  onReset: () => void;
}

const STATUS_META = {
  claimed: {
    label: "已登记",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    desc: "已在链上登记权属",
  },
  pending: {
    label: "审核中",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    desc: "正在申请登记",
  },
  unclaimed: {
    label: "未登记",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    desc: "暂未开放授权",
  },
};

const CATEGORY_ICON: Record<string, string> = {
  musician: "🎵",
  athlete: "⚽",
  actor: "🎬",
  politician: "🏛️",
  creator: "✨",
  default: "👤",
};

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round(score * 100));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-gray-300";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>相似度</span>
        <span className="font-mono font-semibold text-gray-700">
          {(score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MatchCard({ result, rank }: { result: TraceResult; rank: number }) {
  const meta = STATUS_META[result.ownershipStatus] ?? STATUS_META.unclaimed;
  const catIcon = CATEGORY_ICON[result.category] ?? CATEGORY_ICON.default;
  const similarityPct = (result.similarityScore * 100).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
            #{rank}
          </div>

          {/* Avatar placeholder */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg shrink-0">
            {catIcon}
          </div>

          {/* Name + category */}
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">
              {result.name}
            </h3>
            <span className="text-xs text-gray-400 capitalize">
              {result.category}
            </span>
          </div>
        </div>

        {/* Ownership badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* Similarity bar */}
      <div className="mb-3">
        <SimilarityBar score={result.similarityScore} />
      </div>

      {/* Note */}
      {result.note && (
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          {result.note}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {meta.desc}
        </span>
        {result.claimable && result.ownershipStatus === "unclaimed" && (
          <a
            href="/enterprise/authorization/apply"
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
          >
            申请授权 →
          </a>
        )}
        {result.ownershipStatus === "claimed" && (
          <span className="ml-auto text-xs font-medium text-emerald-600">
            ✓ 可授权
          </span>
        )}
        {result.ownershipStatus === "pending" && (
          <span className="ml-auto text-xs font-medium text-amber-600">
            ⏳ 审核中
          </span>
        )}
      </div>
    </div>
  );
}

export default function FaceTraceResults({
  results,
  onReset,
}: FaceTraceResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="text-4xl">🔎</div>
        <div>
          <p className="font-semibold text-gray-700">未匹配到名人</p>
          <p className="text-sm text-gray-400 mt-1">
            该人脸与数据库中已登记的名人相似度均低于阈值
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          上传其他图片
        </button>
      </div>
    );
  }

  const top = results[0];
  const rest = results.slice(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">溯源结果</h2>
          <p className="text-sm text-gray-500">
            共匹配到 {results.length} 个结果
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
        >
          ← 再测一张
        </button>
      </div>

      {/* Top match — highlighted */}
      {top && (
        <div className="relative">
          <div className="absolute -top-3 left-4 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 border border-amber-300 rounded-full text-xs font-semibold text-amber-700">
              🏆 Top Match
            </span>
          </div>
          <MatchCard result={top} rank={1} />
        </div>
      )}

      {/* Other matches */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((r, i) => (
            <MatchCard key={r.name + i} result={r} rank={i + 2} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed">
        ⚠️ 溯源结果基于人脸向量相似度算法，仅供参考。如需正式权属认定，请通过正规渠道提交资料审核。
        系统预留真实名人数据库接口（pgvector / Qdrant），上线时可直接替换{" "}
        <code className="bg-gray-100 px-1 rounded">celebrityDb.ts</code>。
      </p>
    </div>
  );
}
