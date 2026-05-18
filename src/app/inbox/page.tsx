"use client";
/**
 * Inbox — Conversation List
 * /inbox
 * Lists all conversations for the logged-in user
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

interface ConversationMessage {
  body: string;
  senderId: string;
  createdAt: string;
}

interface ConversationParticipantUser {
  id: string;
  displayName: string | null;
  image: string | null;
}

interface ConversationParticipant {
  userId: string;
  roleInConversation: string;
  user: ConversationParticipantUser;
}

interface ConversationPortrait {
  id: string;
  title: string;
  thumbnailUrl: string | null;
}

interface Conversation {
  id: string;
  type: string;
  subject: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
  portrait: ConversationPortrait | null;
}

export default function InboxPage() {
  const { t } = useLanguage();
  const ti = t.inboxPage || {};
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      if (json.success) {
        setConversations(json.data ?? []);
      } else {
        setError(json.error ?? "Failed to load conversations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find(p => p.roleInConversation === "ACTOR" || p.roleInConversation === "CREATOR" || p.roleInConversation === "LAWYER");
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            PortraitPay AI
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/inbox" className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {ti.title ?? "Inbox"}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ti.title ?? "Inbox"}</h1>
          <p className="text-gray-500 mt-1">{ti.subtitle ?? "Your conversations"}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">{ti.loading ?? "Loading conversations..."}</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={fetchConversations} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {ti.retry ?? "Retry"}
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{ti.emptyTitle ?? "No conversations yet"}</h3>
            <p className="text-gray-500 dark:text-gray-400">{ti.emptyDesc ?? "Contact an actor or lawyer to start a conversation."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(conv => {
              const other = getOtherParticipant(conv);
              const lastMsg = conv.messages?.[0];
              const displayName = other?.user?.displayName || "Unknown";
              const initials = displayName.charAt(0).toUpperCase();

              return (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {other?.user?.image ? (
                        <img src={other.user.image} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {conv.status === "OPEN" && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                              {ti.statusOpen ?? "Open"}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {conv.updatedAt ? formatTime(conv.updatedAt) : ""}
                          </span>
                        </div>
                      </div>
                      {conv.subject && (
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mb-0.5">{conv.subject}</p>
                      )}
                      {lastMsg && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lastMsg.body}</p>
                      )}
                      {conv.portrait && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Portrait: {conv.portrait.title}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}