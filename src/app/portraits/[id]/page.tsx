/**
 * /portraits/[id] — Portrait detail page
 * Shows portrait info, blockchain certificate, and action buttons
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getIpfsGatewayUrl } from "@/lib/ipfs";

interface PortraitDetail {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  tags: string[];
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
  updatedAt: string;
  owner: {
    id: string;
    displayName?: string | null;
    walletAddress?: string | null;
    kycStatus: string;
  };
}

export default function PortraitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [portrait, setPortrait] = useState<PortraitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [certifying, setCertifying] = useState(false);
  const [certifyMsg, setCertifyMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const handleCertify = async () => {
    if (!confirm("Certify this portrait on Ethereum Sepolia? This will upload to IPFS and mint an on-chain transaction.")) return;

    setCertifying(true);
    setCertifyMsg("Starting certification...");

    try {
      const steps = [
        "Computing image hash...",
        "Uploading image to IPFS...",
        "Uploading metadata to IPFS...",
        "Minting on Sepolia (confirming wallet)...⌛",
        "Waiting for block confirmation...",
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length - 1) setCertifyMsg(steps[++stepIdx]);
      }, 3000);

      const res = await fetch(`/api/portraits/${id}/certify`, { method: "POST" });
      clearInterval(interval);

      const json = await res.json();
      if (!json.success) {
        setCertifyMsg(`❌ Failed: ${json.error}`);
        setTimeout(() => setCertifyMsg(""), 5000);
        return;
      }

      setCertifyMsg(`✅ Certified! Block #${json.data.blockNumber}`);

      // Refresh portrait
      const refreshed = await fetch(`/api/portraits/${id}`).then((r) => r.json());
      if (refreshed.success) setPortrait(refreshed.data);

      setTimeout(() => setCertifyMsg(""), 5000);
    } catch (err) {
      setCertifyMsg("❌ Network error. Please try again.");
      setTimeout(() => setCertifyMsg(""), 5000);
    } finally {
      setCertifying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Archive this portrait? It will be hidden but not permanently deleted.")) return;

    setDeleting(true);
    try {
      await fetch(`/api/portraits/${id}`, { method: "DELETE" });
      router.push("/portraits");
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!portrait) return null;

  const ipfsGatewayUrl = portrait.ipfsCid ? getIpfsGatewayUrl(portrait.ipfsCid) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/portraits" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">←</Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{portrait.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              portrait.status === "ACTIVE" ? "bg-green-50 text-green-700" :
              portrait.status === "DRAFT" ? "bg-gray-100 text-gray-600" :
              "bg-yellow-50 text-yellow-700"
            }`}>
              {portrait.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Image */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="relative" style={{ aspectRatio: "1" }}>
                {portrait.originalImageUrl ? (
                  <img
                    src={portrait.originalImageUrl}
                    alt={portrait.title}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-6xl">👤</div>
                )}
              </div>
            </div>

            {/* Blockchain certificate */}
            {portrait.blockchainTxHash && (
              <div className="mt-4 bg-white rounded-xl border border-purple-200 p-5">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  🔗 Blockchain Certificate
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Network</span>
                    <span className="text-gray-900 font-medium">{portrait.blockchainNetwork?.toUpperCase() ?? "Sepolia"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-28 shrink-0">Tx Hash</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${portrait.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-mono text-xs hover:underline break-all"
                    >
                      {portrait.blockchainTxHash}
                    </a>
                  </div>
                  {portrait.ipfsCid && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-28 shrink-0">IPFS CID</span>
                      <a
                        href={ipfsGatewayUrl ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-mono text-xs hover:underline break-all"
                      >
                        {portrait.ipfsCid}
                      </a>
                    </div>
                  )}
                  {portrait.imageHash && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-28 shrink-0">Image Hash</span>
                      <span className="text-gray-700 font-mono text-xs break-all">{portrait.imageHash}</span>
                    </div>
                  )}
                  {portrait.certifiedAt && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-28 shrink-0">Certified At</span>
                      <span className="text-gray-900 text-xs">
                        {new Date(portrait.certifiedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                      </span>
                    </div>
                  )}
                  {portrait.owner.walletAddress && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-28 shrink-0">Owner</span>
                      <span className="text-gray-900 font-mono text-xs">{portrait.owner.walletAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col gap-6">

            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3 text-sm">
                {portrait.description && (
                  <div>
                    <p className="text-gray-500 mb-1">Description</p>
                    <p className="text-gray-800">{portrait.description}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-900">{portrait.category}</span>
                </div>
                {portrait.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {portrait.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-gray-500">Visibility</span>
                  <span className={portrait.isPublic ? "text-green-600" : "text-gray-400"}>
                    {portrait.isPublic ? "Public" : "Private"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">
                    {new Date(portrait.createdAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Certification CTA */}
            {!portrait.blockchainTxHash && portrait.status !== "ARCHIVED" && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-6">
                <h2 className="font-semibold text-purple-900 mb-2">🔐 Not Yet Certified</h2>
                <p className="text-sm text-purple-700 mb-4">
                  Certify this portrait on Ethereum Sepolia to create an immutable proof of authorship.
                  Your portrait metadata will be stored on IPFS.
                </p>

                {certifyMsg && (
                  <div className="mb-3 p-3 bg-white rounded-lg text-sm text-purple-800 border border-purple-200">
                    {certifying && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                    {certifyMsg}
                  </div>
                )}

                <button
                  onClick={handleCertify}
                  disabled={certifying || !portrait.originalImageUrl}
                  className="w-full px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {certifying ? "Certifying..." : "🔗 Certify on Blockchain"}
                </button>

                {!portrait.originalImageUrl && (
                  <p className="text-xs text-center text-purple-500 mt-2">Upload an image first to certify</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/portraits/${id}/edit`}
                className="flex-1 px-4 py-2 text-center text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Archive"}
              </button>
            </div>

            {/* Owner info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Owner</p>
              <p className="font-medium text-gray-900">{portrait.owner.displayName ?? "—"}</p>
              {portrait.owner.walletAddress && (
                <p className="text-xs font-mono text-gray-500 mt-0.5">{portrait.owner.walletAddress}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
