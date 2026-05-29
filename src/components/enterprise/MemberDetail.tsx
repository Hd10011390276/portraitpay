"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonStatCard, SkeletonTableRow } from "@/components/ui/Skeleton";

interface MemberDetailProps {
  memberId: string;
  memberName: string;
  memberEmail: string;
}

interface Portrait {
  id: string;
  title: string;
  status: string;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  gender?: string;
  roleType?: string;
}

interface Summary {
  certifiedPortraits: number;
  availableBalance: number;
  pendingAuthorizations: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  portrait?: { title: string };
  description?: string;
}

export function MemberDetail({ memberId, memberName, memberEmail }: MemberDetailProps) {
  const [loading, setLoading] = useState(true);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Voice ID state
  const [voiceRegistered, setVoiceRegistered] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceMediaRecorder, setVoiceMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceChunks, setVoiceChunks] = useState<Blob[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "recording" | "processing" | "verified" | "failed">("idle");
  const [verificationResult, setVerificationResult] = useState<{similarity: number; samePerson: boolean} | null>(null);
  const [showVoiceReRegister, setShowVoiceReRegister] = useState(false);
  const [voiceNoAccount, setVoiceNoAccount] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [portraitsRes, summaryRes] = await Promise.allSettled([
          fetch(`/api/portraits?ownerId=${memberId}`, { credentials: "include" }),
          fetch("/api/v1/earnings/summary", { credentials: "include" }),
        ]);

        if (portraitsRes.status === "fulfilled" && portraitsRes.value.ok) {
          const data = await portraitsRes.value.json();
          setPortraits(data.data?.slice(0, 5) || []);
        }

        if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
          const data = await summaryRes.value.json();
          setSummary(data.data || {});
        }

        // Fetch voice profile
        try {
          const vpRes = await fetch(`/api/v1/agent/members/${memberId}/voice/profile`, { credentials: "include" });
          if (vpRes.ok) {
            const vpJson = await vpRes.json();
            if (vpJson.data?.noAccount) {
              setVoiceNoAccount(true);
            } else if (vpJson.data?.hasEmbedding) {
              setVoiceRegistered(true);
            }
          }
        } catch (e) {
          console.error("Failed to fetch voice profile:", e);
        }
      } catch (err) {
        console.error("Failed to fetch member data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [memberId]);

  async function startVoiceRecord() {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setVoiceStatus("processing");
        const blob = new Blob(chunks, { type: "audio/webm" });
        await submitVoiceBlob(blob, true);
      };
      mr.start();
      setVoiceMediaRecorder(mr);
      setVoiceChunks(chunks);
      setVoiceStatus("recording");
    } catch {
      setVoiceError("Microphone access denied. Please allow microphone access.");
    }
  }

  function stopVoiceRecord() {
    if (voiceMediaRecorder && voiceMediaRecorder.state !== "inactive") voiceMediaRecorder.stop();
    setVoiceChunks([]);
    setVoiceStatus("processing");
  }

  async function submitVoiceBlob(blob: Blob, isRegister: boolean) {
    setVoiceError("");
    try {
      const form = new FormData();
      form.append("file", blob, "voice.webm");
      const url = isRegister
        ? `/api/v1/agent/members/${memberId}/voice/register`
        : `/api/v1/agent/members/${memberId}/voice/verify`;
      const res = await fetch(url, { method: "POST", body: form, credentials: "include" });
      const json = await res.json();
      if (json.success) {
        if (isRegister) {
          setVoiceRegistered(true);
          setShowVoiceReRegister(false);
          setVoiceStatus("idle");
        } else {
          const data = json.data;
          setVerificationResult({ similarity: Math.round(data.similarity * 100), samePerson: data.samePerson });
          setVoiceStatus(data.samePerson ? "verified" : "failed");
          if (!data.samePerson) setVoiceError(`Similarity ${Math.round(data.similarity * 100)}% — below 80% threshold.`);
        }
      } else {
        setVoiceStatus("failed");
        setVoiceError(json.message || json.error || "Voice processing failed.");
      }
    } catch {
      setVoiceStatus("failed");
      setVoiceError("Network error. Please try again.");
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {memberName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{memberName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{memberEmail}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Certified Portraits
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary?.certifiedPortraits || 0}
                </p>
              </div>
              <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${(summary?.availableBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Pending Auths
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary?.pendingAuthorizations || 0}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Portraits */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Portraits</h3>
        </div>
        {loading ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[...Array(3)].map((_, i) => <SkeletonTableRow key={i} />)}
          </div>
        ) : portraits.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No portraits yet
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {portraits.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                  {(p.thumbnailUrl || p.originalImageUrl) ? (
                    <img src={p.thumbnailUrl || p.originalImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                  ) : null}
                  <span className={(p.thumbnailUrl || p.originalImageUrl) ? 'hidden' : ''}>👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {p.title || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.status === "ACTIVE" ? "On Chain" : p.status === "UNDER_REVIEW" ? "Under Review" : p.status}
                  </p>
                </div>
                <Link
                  href={`/portraits/${p.id}`}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-5">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/portraits/upload"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload Portrait
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report Infringement
          </Link>
        </div>
      </div>

      {/* Voice ID */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xl flex-shrink-0">
            🎤
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Voice ID</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Register voice to enable voice-based ownership verification for this member.
            </p>

            {voiceNoAccount ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Member needs a linked PortraitPay account for Voice ID.
              </p>
            ) : (
              <>
                {voiceStatus === "idle" && !voiceRegistered && !showVoiceReRegister && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={startVoiceRecord}
                      className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      Record Voice
                    </button>
                    <label className="px-4 py-2 text-sm font-medium border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/30 transition cursor-pointer flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload File
                      <input type="file" accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setVoiceError(""); setVoiceStatus("processing"); await submitVoiceBlob(file, true); }} />
                    </label>
                  </div>
                )}

                {voiceStatus === "recording" && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-red-700 dark:text-red-300">Recording... Speak naturally 10-30s</span>
                    <button onClick={stopVoiceRecord} className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Stop</button>
                  </div>
                )}

                {voiceStatus === "processing" && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Processing...</span>
                  </div>
                )}

                {voiceStatus === "verified" && verificationResult && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Verified ({verificationResult.similarity}%) — {verificationResult.samePerson ? "Voice matched" : "No match"}
                    </span>
                    <button onClick={() => { setVoiceStatus("idle"); setVerificationResult(null); }} className="text-xs text-teal-600 hover:underline">Again</button>
                  </div>
                )}

                {voiceStatus === "failed" && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span className="text-sm text-red-600 dark:text-red-300">{voiceError || "Failed"}</span>
                    <button onClick={() => setVoiceStatus("idle")} className="text-xs text-teal-600 hover:underline">Retry</button>
                    <button onClick={() => setShowVoiceReRegister(true)} className="text-xs text-gray-400 hover:underline">Re-register</button>
                  </div>
                )}

                {voiceRegistered && !showVoiceReRegister && voiceStatus === "idle" && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">🎤 Voice Registered</span>
                    <button onClick={startVoiceRecord} className="px-3 py-1 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">Verify</button>
                    <label className="px-3 py-1 text-xs font-medium border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 transition cursor-pointer">
                      Upload Verify
                      <input type="file" accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setVoiceError(""); setVoiceStatus("processing"); await submitVoiceBlob(file, false); }} />
                    </label>
                  </div>
                )}

                {showVoiceReRegister && voiceStatus === "idle" && (
                  <div className="flex items-center gap-2">
                    <button onClick={startVoiceRecord} className="px-3 py-1 text-xs font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">Record &amp; Re-register</button>
                    <label className="px-3 py-1 text-xs font-medium border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 transition cursor-pointer">
                      Upload &amp; Re-register
                      <input type="file" accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setVoiceError(""); setVoiceStatus("processing"); await submitVoiceBlob(file, true); }} />
                    </label>
                    <button onClick={() => setShowVoiceReRegister(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}