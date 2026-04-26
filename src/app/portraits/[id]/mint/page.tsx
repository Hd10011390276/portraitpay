/**
 * /portraits/[id]/mint — Portrait NFT Minting Page
 *
 * Dedicated page for minting a portrait as an NFT on Sepolia.
 * Flow:
 *  1. Fetch portrait details from API
 *  2. Show mint confirmation dialog
 *  3. Call /api/portraits/[id]/mint to mint on Sepolia
 *  4. Display transaction hash on success
 *
 * The API handles IPFS metadata upload + contract call server-side.
 * PRIVATE_KEY stays on the server — never exposed to the client.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";
import { getIpfsGatewayUrl } from "@/lib/ipfs";

interface PortraitDetail {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  originalImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageHash?: string | null;
  blockchainTxHash?: string | null;
  blockchainNetwork?: string | null;
  ipfsCid?: string | null;
  certifiedAt?: string | null;
  isPublic: boolean;
  createdAt: string;
  owner: {
    id: string;
    displayName?: string | null;
    email?: string | null;
    walletAddress?: string | null;
  };
}

type MintStep =
  | "idle"
  | "confirm"
  | "minting"
  | "uploading_ipfs"
  | "confirming"
  | "success"
  | "error";

export default function MintPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const tc = t.portraits.detail;

  const [portrait, setPortrait] = useState<PortraitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mintResult, setMintResult] = useState<{
    txHash: string;
    blockNumber: number;
    ipfsCid: string;
    network: string;
    certifiedAt: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/portraits/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPortrait(j.data);
        else router.push("/portraits");
      })
      .catch(() => router.push("/portraits"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleMint = async () => {
    setMintStep("minting");
    setErrorMsg("");

    try {
      // Step messages shown in the UI as we progress
      setMintStep("minting");
      await delay(1500);

      setMintStep("uploading_ipfs");
      await delay(1500);

      setMintStep("confirming");

      const res = await fetch(`/api/portraits/${id}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMsg(json.error ?? "Minting failed");
        setMintStep("error");
        return;
      }

      setMintResult({
        txHash: json.data.blockchainTxHash,
        blockNumber: json.data.blockNumber,
        ipfsCid: json.data.ipfsCid,
        network: json.data.network,
        certifiedAt: json.data.certifiedAt,
      });
      setMintStep("success");
    } catch {
      setErrorMsg(tc.certifyNetworkError);
      setMintStep("error");
    }
  };

  if (loading) {
    return (
      <DashboardShell
        title={t.portraits.detail.certifyOnBlockchain}
        subtitle=""
        forceLight
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </DashboardShell>
    );
  }

  if (!portrait) {
    return (
      <DashboardShell title={t.portraits.detail.certifyOnBlockchain} forceLight>
        <div className="text-center py-20 text-gray-500">{(t.faceTrace as Record<string, string>).portraitNotFound ?? "Portrait not found"}</div>
      </DashboardShell>
    );
  }

  // Already minted
  if (portrait.blockchainTxHash) {
    return (
      <DashboardShell title={t.portraits.detail.blockchainCertificate} forceLight>
        <MintAlreadyDone portrait={portrait} tc={tc} t={t} />
      </DashboardShell>
    );
  }

  // Confirmation dialog
  if (mintStep === "confirm") {
    return (
      <DashboardShell title={t.portraits.detail.certifyOnBlockchain} forceLight>
        <div className="max-w-lg mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚠️</span>
            <h2 className="text-xl font-semibold">{tc.certifyConfirm}</h2>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Portrait</span>
              <span className="font-medium">{portrait.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network</span>
              <span className="font-medium">Ethereum Sepolia (Testnet)</span>
            </div>
            {portrait.imageHash && (
              <div className="flex justify-between">
                <span className="text-gray-500">Image Hash</span>
                <span className="font-mono text-xs break-all">{portrait.imageHash}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">IPFS</span>
              <span className="font-medium text-xs">Metadata will be uploaded</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            This action will send a transaction to the Sepolia testnet.
            No real funds will be spent. A burner wallet is used for signing.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setMintStep("idle")}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              {tc.certifyOnBlockchain}
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Success state
  if (mintStep === "success" && mintResult) {
    return (
      <DashboardShell title={t.portraits.detail.blockchainCertificate} forceLight>
        <div className="max-w-lg mx-auto mt-8 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">{tc.certifySuccess}</h2>
          <p className="text-gray-500 mb-6">{t.portraits.certifySuccessDesc}</p>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-3">
            <MintField label={tc.network} value={getNetworkLabel(mintResult.network)} />
            <MintField
              label={tc.txHash}
              value={
                <a
                  href={`https://sepolia.etherscan.io/tx/${mintResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {mintResult.txHash}
                </a>
              }
            />
            <MintField
              label={tc.ipfsCid}
              value={
                <a
                  href={`https://ipfs.io/ipfs/${mintResult.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {mintResult.ipfsCid}
                </a>
              }
            />
            <MintField
              label={tc.certifiedAt}
              value={new Date(mintResult.certifiedAt).toLocaleString()}
            />
            <MintField
              label="Block #"
              value={`#${mintResult.blockNumber}`}
            />
            {portrait.imageHash && (
              <MintField
                label={tc.imageHash}
                value={
                  <span className="font-mono text-xs break-all">{portrait.imageHash}</span>
                }
              />
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/portraits/${id}`}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
            >
              ← {tc.back}
            </Link>
            <Link
              href="/portraits"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-center"
            >
              {t.portraits.title}
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (mintStep === "error") {
    return (
      <DashboardShell title={t.portraits.detail.certifyOnBlockchain} forceLight>
        <div className="max-w-lg mx-auto mt-8 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-red-200 dark:border-red-900 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">{tc.certifyFailed}</h2>
          <p className="text-red-500 mb-2">{errorMsg}</p>
          <p className="text-xs text-gray-400 mb-6">
            Please try again. If the problem persists, contact support.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setMintStep("idle")}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleMint}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // Progress states
  const stepLabels: Record<string, string> = {
    minting: tc.certifyStepHash,
    uploading_ipfs: tc.certifyStepUploadMeta,
    confirming: tc.certifyStepMint,
  };

  // Default idle state — show mint button
  return (
    <DashboardShell title={t.portraits.detail.certifyOnBlockchain} forceLight>
      <div className="max-w-2xl mx-auto mt-8">
        {/* Portrait preview */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          <div className="flex gap-0">
            {/* Image */}
            <div className="w-48 h-48 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
              {portrait.originalImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portrait.originalImageUrl}
                  alt={portrait.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-5">
              <h2 className="text-xl font-bold mb-1">{portrait.title}</h2>
              {portrait.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{portrait.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">{tc.details}</span>
                  <div className="font-medium capitalize">{portrait.category}</div>
                </div>
                <div>
                  <span className="text-gray-400">{tc.created}</span>
                  <div className="font-medium">{new Date(portrait.createdAt).toLocaleDateString()}</div>
                </div>
                {portrait.imageHash && (
                  <div className="col-span-2">
                    <span className="text-gray-400">{tc.imageHash}</span>
                    <div className="font-mono text-xs break-all text-gray-600 dark:text-gray-400">
                      {portrait.imageHash}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔗</span>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
              {t.portraits.detail.blockchainCertificate}
            </h3>
          </div>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <p>
              Your portrait will be permanently recorded on the <strong>Ethereum Sepolia testnet</strong>.
              This creates an immutable proof-of-existence with:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your portrait image SHA-256 hash (fingerprint)</li>
              <li>IPFS metadata storage (decentralized)</li>
              <li>Blockchain timestamp (Sepolia block)</li>
              <li>Transaction hash (verifiable on Etherscan)</li>
            </ul>
          </div>
        </div>

        {/* Progress (shown during minting) */}
        {mintStep !== "idle" && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
              <span className="font-medium">{stepLabels[mintStep] ?? tc.certifying}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse transition-all duration-500"
                style={{ width: mintStep === "confirming" ? "80%" : "50%" }} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        {mintStep === "idle" && (
          <div className="flex gap-4">
            <Link
              href={`/portraits/${id}`}
              className="flex-1 py-3 px-6 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center font-medium"
            >
              ← {tc.back}
            </Link>
            <button
              onClick={() => setMintStep("confirm")}
              className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              {tc.certifyOnBlockchain}
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MintField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="font-medium text-sm mt-0.5 break-all">{value}</div>
    </div>
  );
}

function MintAlreadyDone({ portrait, tc, t }: { portrait: PortraitDetail; tc: typeof t.portraits.detail; t: typeof t }) {
  const ipfsUrl = portrait.ipfsCid ? `https://ipfs.io/ipfs/${portrait.ipfsCid}` : null;
  const etherscanUrl = portrait.blockchainTxHash
    ? `https://sepolia.etherscan.io/tx/${portrait.blockchainTxHash}`
    : null;

  return (
    <div className="max-w-lg mx-auto mt-8 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-green-200 dark:border-green-900 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-2">{tc.certifySuccess}</h2>
      <p className="text-gray-500 mb-6">{t.portraits.certifySuccessDesc}</p>

      {portrait.blockchainTxHash && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-left space-y-3">
          <MintField label={tc.network} value={portrait.blockchainNetwork ?? "Sepolia"} />
          <MintField
            label={tc.txHash}
            value={
              etherscanUrl ? (
                <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {portrait.blockchainTxHash}
                </a>
              ) : (
                <span className="break-all">{portrait.blockchainTxHash}</span>
              )
            }
          />
          {portrait.ipfsCid && (
            <MintField
              label={tc.ipfsCid}
              value={
                ipfsUrl ? (
                  <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {portrait.ipfsCid}
                  </a>
                ) : (
                  <span className="break-all">{portrait.ipfsCid}</span>
                )
              }
            />
          )}
          {portrait.certifiedAt && (
            <MintField
              label={tc.certifiedAt}
              value={new Date(portrait.certifiedAt).toLocaleString()}
            />
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/portraits/${portrait.id}`}
          className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center"
        >
          ← {tc.back}
        </Link>
        <Link
          href="/portraits"
          className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-center"
        >
          {t.portraits.title}
        </Link>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNetworkLabel(network: string): string {
  const labels: Record<string, string> = {
    sepolia: "Ethereum Sepolia (Testnet)",
    base: "Base Mainnet",
  };
  return labels[network] ?? network;
}
