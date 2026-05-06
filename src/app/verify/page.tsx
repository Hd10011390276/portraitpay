"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

const ETHERSCAN_BASE = "https://sepolia.etherscan.io/tx/";
const CONTRACT_ADDRESS = "0x2D5F2B7Ae9eBe1e9Aa1B8b8c6E7b6F3F5fBfF0fE";

export default function VerifyPage() {
  const { t } = useLanguage();
  const tv = t.verifyPage || {};
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    txHash?: string;
    portraitHash?: string;
    owner?: string;
    timestamp?: string;
    error?: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Try API call first
      const res = await fetch(
        `/api/verify-portrait?hash=${encodeURIComponent(input.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResult(data);
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
          setResult({ found: true, txHash: "via RPC" });
        } else {
          setResult({ found: false });
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
              {t.nav?.signIn || "登录"}
            </a>
            <a href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              {t.nav?.getStarted || "免费开始"}
            </a>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>🔗</span>
            <span>Sepolia 区块链公开可查</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {tv.title || "验证区块链存证"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            {tv.subtitle || "输入肖像哈希或交易哈希，查询任意肖像是否已在以太坊 Sepolia 区块链上完成时间戳认证。无需登录，完全公开。"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {tv.inputLabel || "肖像哈希 / Transaction Hash"}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0xabcd... 或 portrait ID"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? "查询中..." : (tv.verifyBtn || "验证")}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {tv.hint || "支持 64 位十六进制哈希或交易哈希。区块链查询无需任何费用。"}
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
                  <span>{tv.found || "已找到链上记录"}</span>
                </div>
                {result.txHash && (
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{tv.txHash || "交易哈希"}:</span>
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
                )}
                {result.portraitHash && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{tv.portraitHash || "肖像哈希"}:</span>{" "}
                    <span className="font-mono text-xs">{result.portraitHash}</span>
                  </p>
                )}
                {result.owner && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{tv.owner || "注册人"}:</span>{" "}
                    <span className="font-mono text-xs">{result.owner}</span>
                  </p>
                )}
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  在 Etherscan 上查看合约 →
                </a>
              </div>
            ) : result.error ? (
              <div className="text-red-700 dark:text-red-300">
                <p className="font-semibold">查询失败</p>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{tv.notFound || "未找到链上记录"}</p>
                <p className="text-sm mt-1">{tv.notFoundDesc || "该哈希未在 Sepolia 区块链上找到认证记录。"}</p>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="mt-10 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{tv.howTitle || "如何验证？"}</h2>
          <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>在肖像详情页找到「{tv.certHashLabel || "链上哈希"}」（64位十六进制）</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>复制哈希，粘贴到上方输入框</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>点击「{tv.verifyBtn || "验证"}」，实时查询以太坊 Sepolia 区块链</span>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400">
            <p>📋 {tv.factLabel || "事实"}: 所有认证记录公开存储在以太坊 Sepolia 区块链上（合约地址 {CONTRACT_ADDRESS}），任何人在任何时候都可以通过 Etherscan 自行验证，无需通过本平台。</p>
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
