"use client";

import React, { useState } from "react";
import type { TraceResult } from "./FaceTraceUploader";

interface FaceTraceResultsProps {
  results: TraceResult[];
  onReset: () => void;
}

interface SavedState {
  [key: string]: "idle" | "saving" | "saved";
}

const STATUS_META = {
  claimed: {
    label: "Registered",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    desc: "Ownership registered on-chain",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    desc: "Registration in progress",
  },
  unclaimed: {
    label: "Unregistered",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    desc: "Not open for licensing",
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
        <span>Similarity</span>
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

function MatchCard({
  result,
  rank,
  savedState,
  onSave,
}: {
  result: TraceResult;
  rank: number;
  savedState: "idle" | "saving" | "saved";
  onSave: (result: TraceResult) => void;
}) {
  const meta = STATUS_META[result.ownershipStatus] ?? STATUS_META.unclaimed;
  const catIcon = CATEGORY_ICON[result.category] ?? CATEGORY_ICON.default;

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
        <span className="text-xs text-gray-400">{meta.desc}</span>
        {result.claimable && result.ownershipStatus === "unclaimed" && (
          <a
            href="/enterprise/authorization/apply"
            className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
          >
            Apply for License →
          </a>
        )}
        {result.ownershipStatus === "claimed" && (
          <span className="ml-auto text-xs font-medium text-emerald-600">
            ✓ Available for license
          </span>
        )}
        {result.ownershipStatus === "pending" && (
          <span className="ml-auto text-xs font-medium text-amber-600">
            ⏳ Under Review
          </span>
        )}
        {savedState === "idle" && (
          <button
            onClick={() => onSave(result)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            💾 Save to Gallery
          </button>
        )}
        {savedState === "saving" && (
          <span className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600">
            <span className="animate-spin h-3 w-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
            Saving…
          </span>
        )}
        {savedState === "saved" && (
          <span className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
            ✓ Saved
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
  const [saved, setSaved] = useState<SavedState>({});

  async function handleSave(result: TraceResult) {
    const key = `${result.name}-${result.category}`;
    setSaved((prev) => ({ ...prev, [key]: "saving" }));

    try {
      const res = await fetch("/api/portraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.name,
          description: result.note ?? `Face trace match — ${result.category}`,
          category: result.category,
          tags: ["face-trace", result.ownershipStatus],
          isPublic: false,
        }),
      });
      if (res.ok) {
        setSaved((prev) => ({ ...prev, [key]: "saved" }));
      } else {
        setSaved((prev) => ({ ...prev, [key]: "idle" }));
      }
    } catch {
      setSaved((prev) => ({ ...prev, [key]: "idle" }));
    }
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="text-4xl">🔎</div>
        <div>
          <p className="font-semibold text-gray-700">No celebrity match found</p>
          <p className="text-sm text-gray-400 mt-1">
            The uploaded face has low similarity with all registered celebrities in our database
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Upload another image
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
          <h2 className="text-lg font-bold text-gray-900">Trace Results</h2>
          <p className="text-sm text-gray-500">
            Found {results.length} match{results.length !== 1 ? "es" : ""}
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
        >
          ← Try another
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
          <MatchCard
            result={top}
            rank={1}
            savedState={(saved[`${top.name}-${top.category}`] ?? "idle") as "idle" | "saving" | "saved"}
            onSave={handleSave}
          />
        </div>
      )}

      {/* Other matches */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((r, i) => (
            <MatchCard
              key={r.name + i}
              result={r}
              rank={i + 2}
              savedState={(saved[`${r.name}-${r.category}`] ?? "idle") as "idle" | "saving" | "saved"}
              onSave={handleSave}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed">
        ⚠️ Results are based on face vector similarity algorithms and are for reference only. For official ownership recognition, please submit documents through official channels.
        The system has a celebrity database interface reserved (pgvector / Qdrant) and can be replaced directly at launch.{" "}
        <code className="bg-gray-100 px-1 rounded">celebrityDb.ts</code>.
      </p>
    </div>
  );
}
