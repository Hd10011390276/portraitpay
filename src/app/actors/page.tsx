"use client";
/**
 * Actor Discovery Page
 * /actors
 * Browse and discover TALENT users (actors/creators) with public portraits
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

interface ActorPortrait {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  frontViewUrl: string | null;
  sideViewUrl: string | null;
  backViewUrl: string | null;
  gender: string | null;
  roleType: string | null;
  productionType: string | null;
  status: string;
}

interface Actor {
  id: string;
  name: string | null;
  displayName: string | null;
  bio: string | null;
  image: string | null;
  role: string;
  mediaKitUrl: string | null;
  mediaKitVisibility: string;
  portraits: ActorPortrait[];
}

export default function ActorsPage() {
  const { t } = useLanguage();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<string>("all");

  useEffect(() => {
    fetchActors();
  }, []);

  async function fetchActors() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/actors");
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      if (json.success) {
        setActors(json.data ?? []);
      } else {
        setError(json.error ?? "Failed to load actors");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const visibleActors = actors.filter(a => {
    if (filterVisibility === "all") return true;
    if (filterVisibility === "mediaKit") return a.mediaKitUrl !== null;
    return true;
  });

  const hasMediaKit = (a: Actor) => a.mediaKitVisibility === "PUBLIC" ||
    a.mediaKitVisibility === "VERIFIED_CREATORS";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="nav-glass sticky top-0 z-30">
        <div className="container" style={{ height: "var(--header-height)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" className="logo-light" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <img src="/logo-dark.png" alt="Logo" className="logo-dark" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px" }} />
            <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>PortraitPay AI</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.actors?.title ?? "Discover Actors"}</h1>
            <p className="text-gray-500 mt-1">{t.actors?.subtitle ?? "Browse verified actors and creators for licensing"}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterVisibility}
              onChange={e => setFilterVisibility(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t.actors?.filterAll ?? "All Actors"}</option>
              <option value="mediaKit">{t.actors?.filterWithMediaKit ?? "Has Media Kit"}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">{t.actors?.loading ?? "Loading..."}</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={fetchActors} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {t.actors?.retry ?? "Retry"}
            </button>
          </div>
        ) : visibleActors.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">{t.actors?.noActors ?? "No actors found"}</p>
            <p className="text-sm text-gray-400 mt-2">{t.actors?.noActorsHint ?? "Be the first to register as an actor"}</p>
            <Link href="/register" className="inline-block mt-4 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              {t.actors?.registerCta ?? "Register as Actor"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleActors.map(actor => (
              <ActorCard key={actor.id} actor={actor} t={t} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-default)", padding: "24px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/logo.png" alt="PortraitPay AI Logo" className="logo-light" style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }} />
            <img src="/logo-dark.png" alt="PortraitPay AI Logo" className="logo-dark" style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>PortraitPay AI</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>{t.footer?.copyright ?? "© 2024 PortraitPay AI. All rights reserved."}</p>
        </div>
      </footer>
    </div>
  );
}

function ActorCard({ actor, t }: { actor: Actor; t: any }) {
  const activePortraits = actor.portraits?.filter(p => p.status === "ACTIVE") ?? [];
  const displayName = actor.displayName || actor.name || "Unnamed Actor";
  const mediaKitAvailable = actor.mediaKitVisibility === "PUBLIC" || actor.mediaKitVisibility === "VERIFIED_CREATORS";

  async function handleContact(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const activePortraits = actor.portraits?.filter(p => p.status === "ACTIVE") ?? [];
      const primaryPortrait = activePortraits[0] ?? null;
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: primaryPortrait ? "LICENSING" : "GENERAL",
          participantIds: [actor.id],
          portraitId: primaryPortrait?.id ?? undefined,
          subject: primaryPortrait
            ? `Licensing inquiry: ${primaryPortrait.title}`
            : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        window.location.href = `/inbox/${json.data.id}`;
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } catch {
      // silent fail
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Actor header */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {actor.image ? (
              <img src={actor.image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{actor.role}</p>
          </div>
          {mediaKitAvailable && actor.mediaKitUrl && (
            <a
              href={actor.mediaKitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline flex-shrink-0"
            >
              {t.actors?.mediaKit ?? "Media Kit"}
            </a>
          )}
        </div>
        {actor.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">{actor.bio}</p>
        )}
      </div>

      {/* Portraits grid */}
      {activePortraits.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t.actors?.portraits ?? "Portraits"} ({activePortraits.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {activePortraits.slice(0, 3).map(p => (
              <div key={p.id} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {p.frontViewUrl ? "📷" : "—"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {activePortraits.length > 0 && (
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleContact}
            className="flex-1 block text-center py-2.5 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            {t.actors?.contact ?? "Contact"}
          </button>
          <Link
            href={`/enterprise/authorization/apply`}
            className="flex-1 block text-center py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            {t.actors?.requestLicense ?? "Request License"}
          </Link>
        </div>
      )}
    </div>
  );
}