"use client";

/**
 * /admin/contacts/[id] — Admin contact submission detail page
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  READ: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PROCESSING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  REPLIED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  READ: "Read",
  PROCESSING: "Processing",
  REPLIED: "Replied",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  ENTERPRISE: "Enterprise",
};

export default function AdminContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(`/api/admin/contacts/${id}`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j) => {
        if (j.success) {
          setContact(j.data);
          setReplyText(j.data.repliedMessage ?? "");
          setAdminNotes(j.data.adminNotes ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!contact) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status: newStatus, adminNotes, repliedMessage: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setContact(json.data);
        setSaveMsg("Saved!");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!contact) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("pp_access_token");
      const res = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status: contact.status, adminNotes, repliedMessage: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setContact(json.data);
        setSaveMsg("Saved!");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Contact not found</p>
          <Link href="/admin/contacts" className="text-blue-600 underline">← Back to Contacts</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/contacts" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            ← Back to Contacts
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[contact.status] || "bg-gray-100"}`}>
                {STATUS_LABELS[contact.status] || contact.status}
              </span>
              <span className="text-xs text-gray-400">ID: {contact.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{TYPE_LABELS[contact.type] || contact.type} Contact — {contact.name}</h1>
          </div>
          <span className="text-xs text-gray-400">{new Date(contact.createdAt).toLocaleString()}</span>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Name</div>
              <div className="font-medium">{contact.name}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Email</div>
              <div className="font-medium">{contact.email}</div>
            </div>
            {contact.company && (
              <div>
                <div className="text-gray-500 mb-1">Company</div>
                <div className="font-medium">{contact.company}</div>
              </div>
            )}
            {contact.contactPhone && (
              <div>
                <div className="text-gray-500 mb-1">Phone</div>
                <div className="font-medium">{contact.contactPhone}</div>
              </div>
            )}
            {contact.subject && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Subject</div>
                <div className="font-medium">{contact.subject}</div>
              </div>
            )}
            {contact.enterpriseName && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Enterprise Name</div>
                <div className="font-medium">{contact.enterpriseName}</div>
              </div>
            )}
            {contact.intendedUse && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Intended Use</div>
                <div className="font-medium">{contact.intendedUse}</div>
              </div>
            )}
            {contact.expectedScale && (
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">Expected Scale</div>
                <div className="font-medium">{contact.expectedScale}</div>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Message</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.message}</p>
        </div>

        {/* Email history */}
        {contact.emailSent && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Email Notification</h2>
            <div className="text-sm space-y-1">
              <div className="flex gap-2 text-gray-500">
                <span className="w-20 flex-shrink-0">Sent at:</span>
                <span className="text-gray-900">{contact.emailSentAt ? new Date(contact.emailSentAt).toLocaleString() : "—"}</span>
              </div>
              {contact.emailError && (
                <div className="flex gap-2 text-red-500">
                  <span className="w-20 flex-shrink-0">Error:</span>
                  <span>{contact.emailError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reply */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Reply Message</h2>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3"
            rows={5}
            placeholder="Enter your reply to the contact..."
          />
          {saveMsg && <p className="text-sm text-green-600 mb-2">{saveMsg}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? "Saving..." : "Save Reply"}
            </button>
          </div>
        </div>

        {/* Admin notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Internal Notes</h2>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3"
            rows={3}
            placeholder="Internal notes (not visible to contact)..."
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
        </div>

        {/* Status change */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Change Status</h2>
          <div className="flex flex-wrap gap-2">
            {["NEW", "READ", "PROCESSING", "REPLIED", "RESOLVED", "CLOSED"].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={saving || contact.status === s}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                  contact.status === s
                    ? `${STATUS_COLORS[s]} border-transparent cursor-default`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}