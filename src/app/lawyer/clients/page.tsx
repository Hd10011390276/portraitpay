"use client";
/**
 * /lawyer/clients — Client management: all cases with contact info
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

interface LawyerCase {
  id: string;
  status: string;
  compensation: string;
  lawyerFee: string;
  platformFee: string;
  platformConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  infringementReport?: {
    description?: string;
    portrait?: { title?: string };
    reporter?: { displayName?: string; email?: string };
  };
}

interface Conversation {
  id: string;
  status: string;
  updatedAt: string;
  subject: string;
  participants: Array<{ user: { id: string; displayName: string; email?: string } }>;
  messages: Array<{ createdAt: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  WON: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  REJECTED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DECLINED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  WON: "Won",
  LOST: "Lost",
  CLOSED: "Closed",
  REJECTED: "Rejected",
  OPEN: "Active",
  DECLINED: "Declined",
};

export default function LawyerClientsPage() {
  const { t } = useLanguage();
  const tc = t.lawyerClients || {};

  const [cases, setCases] = useState<LawyerCase[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/lawyers/cases", { credentials: "include" }),
      fetch("/api/conversations", { credentials: "include" }),
    ]).then(([casesRes, convRes]) => {
      if (casesRes.status === "fulfilled" && casesRes.value.ok) {
        const json = casesRes.value.json();
        json.then((j: any) => { if (j.success) setCases(j.data || []); });
      }
      if (convRes.status === "fulfilled" && convRes.value.ok) {
        const json = convRes.value.json();
        json.then((j: any) => { if (j.success) setConversations(j.data || []); });
      }
    }).finally(() => setLoading(false));
  }, []);

  const getClientInfo = (c: LawyerCase | Conversation) => {
    if ("infringementReport" in c && c.infringementReport?.reporter) {
      return {
        name: c.infringementReport.reporter.displayName || "Client",
        email: "",
      };
    }
    if ("participants" in c) {
      const other = c.participants.find((p) => true);
      return {
        name: other?.user.displayName || "Client",
        email: other?.user.email || "",
      };
    }
    return { name: "Client", email: "" };
  };

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const client = getClientInfo(c);
    const matchesSearch =
      search === "" ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.infringementReport?.portrait?.title || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredConvs = conversations.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    const client = getClientInfo(c);
    return (
      search === "" ||
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const allItems = [
    ...cases.map((c) => ({ type: "case" as const, data: c, updatedAt: c.updatedAt })),
    ...conversations.map((c) => ({ type: "conversation" as const, data: c, updatedAt: c.updatedAt })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filteredItems = allItems.filter((item) => {
    if (item.type === "case") {
      const c = item.data as LawyerCase;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const client = getClientInfo(c);
      const matchesSearch =
        search === "" ||
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesSearch;
    } else {
      const c = item.data as Conversation;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      const client = getClientInfo(c);
      return (
        search === "" ||
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(search.toLowerCase()))
      );
    }
  });

  const statusOptions = [
    { value: "all", label: tc.allStatuses || "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "OPEN", label: "Active Inquiry" },
    { value: "WON", label: "Won" },
    { value: "LOST", label: "Lost" },
    { value: "CLOSED", label: "Closed" },
    { value: "DECLINED", label: "Declined" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/lawyer/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            ‹ Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {tc.title || "My Clients"}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredItems.length} {tc.items || "items"}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={tc.searchPlaceholder || "Search by client name or email..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[160px]"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">{tc.noResults || "No clients found"}</p>
              {(search || statusFilter !== "all") && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  className="mt-3 text-sm text-blue-500 hover:underline"
                >
                  {tc.clearFilters || "Clear filters"}
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{tc.colType || "Type"}</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{tc.colClient || "Client"}</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{tc.colCase || "Case / Subject"}</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{tc.colStatus || "Status"}</th>
                  <th className="text-right px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{tc.colFee || "Fee"}</th>
                  <th className="text-left px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">{tc.colDate || "Updated"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredItems.map((item) => {
                  if (item.type === "case") {
                    const c = item.data as LawyerCase;
                    const client = getClientInfo(c);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">CASE</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                          {client.email && <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-900 dark:text-white truncate max-w-[200px]">
                            {c.infringementReport?.portrait?.title || "Infringement Case"}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                            #{c.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                            {STATUS_LABELS[c.status] || c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-900 dark:text-white">
                          ${Number(c.lawyerFee || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  } else {
                    const c = item.data as Conversation;
                    const client = getClientInfo(c);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">INQUIRY</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                          {client.email && <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-900 dark:text-white truncate max-w-[200px]">
                            {c.subject || "New Inquiry"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100"}`}>
                            {STATUS_LABELS[c.status] || c.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-gray-400">—</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}