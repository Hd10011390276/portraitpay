"use client";
/**
 * Message Thread
 * /inbox/[id]
 * Displays conversation + messages, allows sending new messages
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderType: string;
  senderRole: string;
  subject: string | null;
  createdAt: string;
  sender: {
    id: string;
    displayName: string | null;
    image: string | null;
  };
}

interface ConversationParticipantUser {
  id: string;
  displayName: string | null;
  email: string | null;
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
  participants: ConversationParticipant[];
  portrait: ConversationPortrait | null;
}

interface ThreadData {
  conversation: Conversation;
  messages: Message[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentUserId: string;
}

export default function InboxThreadPage() {
  const { t } = useLanguage();
  const ti = t.inboxPage || {};
  const ts = t.messageThread || {};
  const params = useParams();

  const [thread, setThread] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerTerms, setOfferTerms] = useState("");
  const [offerType, setOfferType] = useState<"LICENSE" | "LEGAL_SERVICE" | "CREATOR_SERVICE">("LICENSE");
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convId = params.id as string;

  useEffect(() => {
    if (convId) fetchThread();
  }, [convId]);

  useEffect(() => {
    if (thread?.messages && thread.messages.length > 0) {
      scrollToBottom();
    }
  }, [thread?.messages?.length]);

  async function fetchThread() {
    setLoading(true);
    setError(null);
    try {
      // Fetch conversation + current user
      const convRes = await fetch(`/api/conversations/${convId}`);
      if (!convRes.ok) throw new Error(String(convRes.status));
      const convJson = await convRes.json();
      if (!convJson.success) throw new Error(convJson.error ?? "Failed to load conversation");

      // Fetch messages separately
      const msgRes = await fetch(`/api/conversations/${convId}/messages`);
      const msgJson = msgRes.ok ? await msgRes.json() : { success: true, data: [], meta: {} };

      setThread({
        conversation: convJson.data,
        messages: msgJson.success ? msgJson.data : [],
        meta: msgJson.meta,
        currentUserId: convJson.currentUserId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!messageBody.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageBody.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMessageBody("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        // Prepend new message (newest first from API, but we display asc)
        setThread(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, json.data],
          };
        });
        setTimeout(scrollToBottom, 50);
      } else {
        setSendError(json.error ?? "Failed to send message");
      }
    } catch {
      setSendError("Network error");
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitOffer() {
    if (!offerTitle.trim() || !offerAmount || !offerTerms.trim()) return;
    setOfferLoading(true);
    setOfferError(null);
    try {
      const otherParticipant = thread?.conversation.participants.find(
        p => p.userId !== currentUserId
      );
      if (!otherParticipant) {
        setOfferError("No participant found");
        return;
      }
      const res = await fetch("/api/marketplace/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: otherParticipant.userId,
          conversationId: convId,
          type: offerType,
          title: offerTitle.trim(),
          terms: offerTerms.trim(),
          amount: parseFloat(offerAmount),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowOfferForm(false);
        setOfferTitle("");
        setOfferAmount("");
        setOfferTerms("");
      } else {
        setOfferError(json.error ?? "Failed to create offer");
      }
    } catch {
      setOfferError("Network error");
    } finally {
      setOfferLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const ta = e.target as HTMLTextAreaElement;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  const isClosed = thread?.conversation.status !== "OPEN";
  const currentUserId = thread?.currentUserId ?? null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inbox" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {thread?.conversation && (
              <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                  {thread.conversation.subject || thread.conversation.portrait?.title || "Conversation"}
                </h1>
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            {ti.loading ?? "Loading..."}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-red-500">{error}</p>
            <button onClick={fetchThread} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {ti.retry ?? "Retry"}
            </button>
          </div>
        ) : thread?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            {ts.noMessages ?? "No messages yet. Send the first message!"}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {thread?.messages.map(msg => {
              const isOwn = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex gap-2`}>
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                        {msg.sender.image ? (
                          <img src={msg.sender.image} alt={msg.sender.displayName || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {(msg.sender.displayName || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                    <div>
                      <div className={`rounded-2xl px-4 py-3 text-sm ${
                        isOwn
                          ? "bg-purple-600 text-white rounded-br-md"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                      }`}>
                        {msg.subject && (
                          <p className="font-semibold mb-1 text-xs opacity-80">{msg.subject}</p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      </div>
                      <p className={`text-xs text-gray-400 dark:text-gray-500 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Create Offer section */}
      {!isClosed && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {!showOfferForm ? (
              <button
                onClick={() => setShowOfferForm(true)}
                className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:underline"
              >
                {ts.createOffer ?? "Create Offer"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Create Offer</p>
                  <button onClick={() => setShowOfferForm(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  {(["LICENSE", "LEGAL_SERVICE", "CREATOR_SERVICE"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setOfferType(type)}
                      className={`px-3 py-1.5 text-xs rounded-full border ${
                        offerType === type
                          ? "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                          : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={e => setOfferTitle(e.target.value)}
                  placeholder="Offer title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder="Amount (USD)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <textarea
                  value={offerTerms}
                  onChange={e => setOfferTerms(e.target.value)}
                  placeholder="Terms and conditions..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                {offerError && <p className="text-xs text-red-500">{offerError}</p>}
                <button
                  onClick={submitOffer}
                  disabled={offerLoading || !offerTitle.trim() || !offerAmount || !offerTerms.trim()}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {offerLoading ? "Sending..." : "Send Offer"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send form */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {isClosed ? (
            <div className="text-center py-3 text-gray-400 dark:text-gray-500 text-sm">
              {ts.conversationClosed ?? "This conversation is closed."}
            </div>
          ) : (
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleTextareaInput}
                placeholder={ts.placeholder ?? "Type a message..."}
                rows={1}
                className="flex-1 resize-none border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm max-h-40"
                style={{ minHeight: "44px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!messageBody.trim() || sending}
                className="px-5 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
              >
                {sending ? (ts.sending ?? "Sending...") : (ts.send ?? "Send")}
              </button>
            </div>
          )}
          {sendError && <p className="text-red-500 text-xs mt-2">{sendError}</p>}
        </div>
      </div>
    </div>
  );
}