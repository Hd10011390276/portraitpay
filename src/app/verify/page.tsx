"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

const ETHERSCAN_BASE = "https://sepolia.etherscan.io/tx/";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x2D5F2B7Ae9eBe1e9Aa1B8b8c6E7b6F3F5fBfF0fE";

export default function VerifyPage() {
  const { t } = useLanguage();
  const tv = t.verifyPage || {};
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    source?: "InfringementReport" | "EvidenceExport" | "onchain";
    txHash?: string;
    portraitHash?: string;
    owner?: string;
    timestamp?: string;
    error?: string;
    reportId?: number;
    reportHash?: string;
    reportStatus?: string;
    reportType?: string;
    portraitTitle?: string | null;
    evidenceId?: string;
    exportedAt?: string;
    caseId?: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // 1. Check evidence records first (DB lookup)
      const evidenceRes = await fetch(
        `/api/verify?hash=${encodeURIComponent(input.trim())}`
      );
      if (evidenceRes.ok) {
        const evidenceData = await evidenceRes.json();
        if (evidenceData.found) {
          if (evidenceData.source === "InfringementReport") {
            setResult({
              found: true,
              source: "InfringementReport",
              reportId: evidenceData.data.reportId,
              reportHash: evidenceData.data.reportHash,
              reportStatus: evidenceData.data.status,
              reportType: evidenceData.data.type,
              portraitTitle: evidenceData.data.portraitTitle,
              timestamp: evidenceData.data.createdAt,
            });
            setLoading(false);
            return;
          } else if (evidenceData.source === "EvidenceExport") {
            setResult({
              found: true,
              source: "EvidenceExport",
              evidenceId: evidenceData.data.evidenceId,
              reportHash: evidenceData.data.fileHash,
              exportedAt: evidenceData.data.exportedAt,
              caseId: evidenceData.data.caseId,
              timestamp: evidenceData.data.exportedAt,
            });
            setLoading(false);
            return;
          }
        }
      }

      // 2. Fallback: on-chain verification via API
      const res = await fetch(
        `/api/verify-portrait?hash=${encodeURIComponent(input.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResult({ ...data, source: "onchain" });
      } else {
        // Direct blockchain check via public RPC
        const body = {
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: "0x" + // selector for verifyPortraitOnChain
                "a3b8f" +
                input.trim().replace(/^0x/, "").padStart(64, "0"),
            },
            "latest",
          ],
          id: 1,
        };

        const rpcRes = await fetch(
          "https://gateway.tenderly.co/public/sepolia",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const rpcData = await rpcRes.json();
        if (rpcData.result && rpcData.result !== "0x") {
          setResult({ found: true, source: "onchain", txHash: "via RPC" });
        } else {
          setResult({ found: false, source: "onchain" });
        }
      }
    } catch (err) {
      setResult({ found: false, error: "Network error" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            PortraitPay AI
          </a>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              {t.nav?.signIn || "Sign In"}
            </a>
            <a href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {t.nav?.getStarted || "Get Started Free"}
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>🔗</span>
            <span>Publicly verifiable on Sepolia</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {tv.title || "Verify Certificate"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            {tv.subtitle || "Enter a portrait hash or transaction hash to verify if any portrait has been timestamped on Ethereum Sepolia. No login required, fully public."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {tv.inputLabel || "Portrait Hash / Transaction Hash"}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0xabcd... or portrait ID"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? "Verifying..." : (tv.verifyBtn || "Verify")}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {tv.hint || "Supports 64-char hex hash or transaction hash. Queries are free."}
          </p>
        </form>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-6 border ${
            result.found
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : result.error
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          }`}>
            {result.found ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold">
                  <span>✓</span>
                  <span>{tv.found || "Certificate found"}</span>
                </div>

                {result.source === "InfringementReport" && (
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Evidence record created by PortraitPay</span>
                    </p>
                    {result.timestamp && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.date || "Date"}:</span>{" "}
                        {new Date(result.timestamp).toLocaleDateString()}
                      </p>
                    )}
                    {result.reportType && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.type || "Type"}:</span>{" "}
                        {result.reportType}
                      </p>
                    )}
                    {result.reportStatus && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.status || "Status"}:</span>{" "}
                        {result.reportStatus}
                      </p>
                    )}
                    {result.portraitTitle && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.portrait || "Portrait"}:</span>{" "}
                        {result.portraitTitle}
                      </p>
                    )}
                    {result.reportHash && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.hash || "Hash"}:</span>{" "}
                        <span className="font-mono text-xs">{result.reportHash}</span>
                      </p>
                    )}
                  </div>
                )}

                {result.source === "EvidenceExport" && (
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Evidence package exported</span>
                    </p>
                    {result.exportedAt && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.date || "Date"}:</span>{" "}
                        {new Date(result.exportedAt).toLocaleDateString()}
                      </p>
                    )}
                    {result.caseId && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.case || "Case ID"}:</span>{" "}
                        <span className="font-mono text-xs">{result.caseId}</span>
                      </p>
                    )}
                    {result.reportHash && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.hash || "Hash"}:</span>{" "}
                        <span className="font-mono text-xs">{result.reportHash}</span>
                      </p>
                    )}
                  </div>
                )}

                {(result.source === "onchain" || !result.source) && (
                  <div className="text-sm space-y-1">
                    {result.txHash && result.txHash !== "via RPC" ? (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{tv.txHash || "Transaction Hash"}:</span>
                        </p>
                        <a
                          href={ETHERSCAN_BASE + result.txHash}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-blue-600 dark:text-blue-400 break-all hover:underline"
                        >
                          {result.txHash}
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Certified on Ethereum Sepolia</span>
                      </p>
                    )}
                    {result.portraitHash && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.portraitHash || "Portrait Hash"}:</span>{" "}
                        <span className="font-mono text-xs">{result.portraitHash}</span>
                      </p>
                    )}
                    {result.owner && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{tv.owner || "Owner"}:</span>{" "}
                        <span className="font-mono text-xs">{result.owner}</span>
                      </p>
                    )}
                    <a
                      href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View contract on block explorer →
                    </a>
                  </div>
                )}
              </div>
            ) : result.error ? (
              <div className="text-red-700 dark:text-red-300">
                <p className="font-semibold">Verification failed</p>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{tv.notFound || "No certificate found"}</p>
                <p className="text-sm mt-1">{tv.notFoundDesc || "This hash has no certification record on Sepolia."}</p>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mt-10 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{tv.howTitle || "How to verify?"}</h2>
          <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Find the digital hash (64-char hex) on the portrait detail page</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Copy the hash and paste it into the input field above</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Click "{tv.verifyBtn || "Verify"}" for a live query on Ethereum Sepolia</span>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400">
            <p>📋 {tv.factLabel || "Note"}: All certification records are publicly stored on Ethereum Sepolia (contract address {CONTRACT_ADDRESS}), and anyone can verify them independently via block explorer at any time — no need to go through this platform.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">PortraitPay AI — {new Date().getFullYear()}</p>
          <nav className="flex gap-6 text-sm text-gray-500">
            <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
            <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
