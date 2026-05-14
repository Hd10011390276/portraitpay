/**
 * /consent-passport/[token] — Public Consent Passport View
 * Anyone can view this page with the share token. No login required.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const USE_LABELS: Record<string, string> = {
  VIDEO_GENERATION: "Video Generation",
  VOICE_CLONE: "Voice Clone",
  DIGITAL_AVATAR: "Digital Avatar",
  ADVERTISING: "Advertising",
  FILM: "Film / Animation",
  SOCIAL_MEDIA: "Social Media",
  EDUCATION: "Education",
  OTHER: "Other",
  ADULT: "Adult content",
  POLITICAL: "Political endorsement",
  VIOLENCE: "Violence / Illegal",
  HATE: "Hate speech / Discrimination",
  FRAUD: "Fraud / Scam",
  WEAPONS: "Weapons promotion",
  ILLEGAL: "Illegal activities",
};

export default function ConsentPassportViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [passport, setPassport] = useState<{
    fullName: string;
    allowedUses: string[];
    prohibitedUses: string[];
    contactInfo?: string | null;
    additionalTerms?: string | null;
    threeViewFront?: string | null;
    threeViewSide?: string | null;
    threeViewTop?: string | null;
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/consent-passport/${token}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPassport(j.data);
        else if (j.error === "Consent Passport not found") setNotFound(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-3 border-[#244169] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !passport) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Passport Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This Consent Passport does not exist or has been removed.</p>
          <Link href="/consent-passport" className="px-6 py-2.5 bg-[#244169] text-white rounded-lg font-medium hover:bg-[#1a3354] transition-colors">
            Create Your Own
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">← PortraitPay AI</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Passport Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] px-6 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🪪</span>
            </div>
            <h1 className="text-xl font-bold text-white">Consent Passport</h1>
            <p className="text-white/70 text-sm mt-1">Public Portrait Authorization Record</p>
          </div>

          {/* Name */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Holder</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{passport.fullName}</p>
          </div>

          {/* Allowed Uses */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 text-xs">✓</span>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Allowed Uses</p>
            </div>
            {passport.allowedUses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {passport.allowedUses.map((use) => (
                  <span key={use} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full font-medium">
                    {USE_LABELS[use] ?? use}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No uses specified</p>
            )}
          </div>

          {/* Prohibited Uses */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 text-xs">✗</span>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Prohibited Uses</p>
            </div>
            {passport.prohibitedUses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {passport.prohibitedUses.map((use) => (
                  <span key={use} className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-full font-medium">
                    {USE_LABELS[use] ?? use}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No prohibitions specified</p>
            )}
          </div>

          {/* Additional Terms */}
          {passport.additionalTerms && (
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Additional Terms</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{passport.additionalTerms}</p>
            </div>
          )}

          {/* Three-View Materials */}
          {(passport.threeViewFront || passport.threeViewSide || passport.threeViewTop) && (
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Three-View Materials</p>
              <div className="space-y-2">
                {passport.threeViewFront && (
                  <a href={passport.threeViewFront} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    <span>📁</span> Front View
                  </a>
                )}
                {passport.threeViewSide && (
                  <a href={passport.threeViewSide} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    <span>📁</span> Side View
                  </a>
                )}
                {passport.threeViewTop && (
                  <a href={passport.threeViewTop} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    <span>📁</span> Top View
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Issued {new Date(passport.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <a
              href="/consent-passport"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your own →
            </a>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 mb-4">
          This is a publicly verifiable record from PortraitPay AI.
          <br />
          Issued on {new Date(passport.createdAt).toLocaleString()} — tamper-evident and publicly verifiable.
        </p>
      </main>
    </div>
  );
}
