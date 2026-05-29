"use client";

import React, { useEffect, useState } from "react";
import { MemberCard } from "./MemberCard";
import { MemberDetail } from "./MemberDetail";
import { Skeleton } from "@/components/ui/Skeleton";

interface Folder {
  id: string;
  name: string;
  _count?: { members: number };
}

interface IPMember {
  id: string;
  name: string;
  email: string;
  rightType: string;
  revenueShare: number;
  status: string;
  folderId: string | null;
}

export function MemberFolderTree() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [members, setMembers] = useState<IPMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRightType, setNewMemberRightType] = useState("OWNER");
  const [newMemberRevenueShare, setNewMemberRevenueShare] = useState("1.0");
  const [showMoveDropdownFor, setShowMoveDropdownFor] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRightType, setEditRightType] = useState("OWNER");
  const [editRevenueShare, setEditRevenueShare] = useState("1.0");

  useEffect(() => {
    fetchData();
  }, []);

  async function createMember() {
    if (!newMemberName.trim()) return;
    try {
      const res = await fetch("/api/v1/agent/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newMemberName.trim(),
          email: newMemberEmail.trim() || undefined,
          rightType: newMemberRightType,
          revenueShare: parseFloat(newMemberRevenueShare) || 1.0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => [...prev, data.data]);
        setNewMemberName("");
        setNewMemberEmail("");
        setNewMemberRightType("OWNER");
        setNewMemberRevenueShare("1.0");
        setShowAddMemberForm(false);
      }
    } catch (err) {
      console.error("Failed to create member:", err);
    }
  }

  function startEdit(member: IPMember) {
    setEditingMemberId(member.id);
    setEditName(member.name);
    setEditEmail(member.email || "");
    setEditRightType(member.rightType);
    setEditRevenueShare(String(member.revenueShare));
  }

  async function saveEdit(memberId: string) {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/v1/agent/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim() || undefined,
          rightType: editRightType,
          revenueShare: parseFloat(editRevenueShare) || 1.0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, ...data.data } : m));
        setEditingMemberId(null);
      }
    } catch (err) {
      console.error("Failed to update member:", err);
    }
  }

  async function deleteMember(memberId: string) {
    const member = members.find((m) => m.id === memberId);
    if (!confirm(`Delete member "${member?.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v1/agent/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        if (expandedMemberId === memberId) setExpandedMemberId(null);
      }
    } catch (err) {
      console.error("Failed to delete member:", err);
    }
  }

  async function fetchData() {
    try {
      const [foldersRes, membersRes] = await Promise.allSettled([
        fetch("/api/v1/agent/folders", { credentials: "include" }),
        fetch("/api/v1/agent/members", { credentials: "include" }),
      ]);

      if (foldersRes.status === "fulfilled" && foldersRes.value.ok) {
        const data = await foldersRes.value.json();
        if (data.success) setFolders(data.data || []);
      }

      if (membersRes.status === "fulfilled" && membersRes.value.ok) {
        const data = await membersRes.value.json();
        if (data.success) setMembers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch folders/members:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/v1/agent/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFolders((prev) => [...prev, data.data]);
        setNewFolderName("");
        setShowNewFolderInput(false);
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  }

  async function renameFolder(folderId: string) {
    if (!editingFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    try {
      const res = await fetch(`/api/v1/agent/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingFolderName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, name: editingFolderName.trim() } : f))
        );
        setEditingFolderId(null);
      }
    } catch (err) {
      console.error("Failed to rename folder:", err);
    }
  }

  async function deleteFolder(folderId: string) {
    if (!confirm("Delete this folder? Members will be moved to Ungrouped.")) return;
    try {
      const res = await fetch(`/api/v1/agent/folders/${folderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setMembers((prev) =>
          prev.map((m) => (m.folderId === folderId ? { ...m, folderId: null } : m))
        );
      }
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  }

  async function moveMember(memberId: string, newFolderId: string | null) {
    try {
      const res = await fetch(`/api/v1/agent/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folderId: newFolderId }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, folderId: newFolderId } : m))
        );
      }
    } catch (err) {
      console.error("Failed to move member:", err);
    }
  }

  function toggleExpanded(memberId: string) {
    setExpandedMemberId((prev) => (prev === memberId ? null : memberId));
  }

  function toggleFolderCollapse(folderId: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  const ungroupedMembers = members.filter((m) => !m.folderId);

  const getMembersInFolder = (folderId: string) => members.filter((m) => m.folderId === folderId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Folder + Add Member */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {showNewFolderInput ? (
            <>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createFolder();
                  if (e.key === "Escape") setShowNewFolderInput(false);
                }}
                placeholder="Folder name"
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={createFolder}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewFolderInput(false)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-800 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Folder
              </button>
              <button
                onClick={() => setShowAddMemberForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-800 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </button>
            </>
          )}
        </div>

        {showAddMemberForm && (
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createMember();
                if (e.key === "Escape") setShowAddMemberForm(false);
              }}
              placeholder="Member name (required)"
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <select
                value={newMemberRightType}
                onChange={(e) => setNewMemberRightType(e.target.value)}
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="OWNER">Owner</option>
                <option value="CO_OWNER">Co-Owner</option>
                <option value="BENEFICIARY">Beneficiary</option>
                <option value="HEIR">Heir</option>
                <option value="TRUSTEE">Trustee</option>
              </select>
              <input
                type="number"
                value={newMemberRevenueShare}
                onChange={(e) => setNewMemberRevenueShare(e.target.value)}
                step="0.01"
                min="0"
                max="1"
                placeholder="Revenue share"
                className="w-40 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createMember}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                Add Member
              </button>
              <button
                onClick={() => setShowAddMemberForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Folders */}
      {folders.map((folder) => {
        const folderMembers = getMembersInFolder(folder.id);
        const isCollapsed = collapsedFolders.has(folder.id);

        return (
          <div key={folder.id} className="space-y-2">
            {/* Folder Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFolderCollapse(folder.id)}
                className="flex items-center gap-2 flex-1 text-left px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {editingFolderId === folder.id ? (
                  <input
                    type="text"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameFolder(folder.id);
                      if (e.key === "Escape") setEditingFolderId(null);
                    }}
                    onBlur={() => renameFolder(folder.id)}
                    className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {folder.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">({folderMembers.length})</span>
              </button>

              {/* Folder Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingFolderId(folder.id);
                    setEditingFolderName(folder.name);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title="Rename"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Folder Members */}
            {!isCollapsed && (
              <div className="pl-4 space-y-2">
                {folderMembers.map((member) => (
                  <div key={member.id}>
                    <MemberCard
                      member={member}
                      isExpanded={expandedMemberId === member.id}
                      onToggle={toggleExpanded}
                    />
                    {expandedMemberId === member.id && (
                      <>
                        {/* Action Bar */}
                        <div className="flex items-center gap-2 px-1 py-2">
                          {/* Move to folder dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setShowMoveDropdownFor(showMoveDropdownFor === member.id ? null : member.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                              Move to
                            </button>
                            {showMoveDropdownFor === member.id && (
                              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-2 z-50 min-w-[160px]">
                                <button
                                  onClick={() => { moveMember(member.id, null); setShowMoveDropdownFor(null); }}
                                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                                >
                                  Ungrouped
                                </button>
                                {folders.map((folder) => (
                                  <button
                                    key={folder.id}
                                    onClick={() => { moveMember(member.id, folder.id); setShowMoveDropdownFor(null); }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                                      member.folderId === folder.id
                                        ? "text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {folder.name} {member.folderId === folder.id ? "✓" : ""}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Edit button */}
                          <button
                            onClick={() => startEdit(member)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => deleteMember(member.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>

                        {/* Edit Form (shows instead of MemberDetail when editing) */}
                        {editingMemberId === member.id ? (
                          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3 mb-4">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Name"
                              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Email"
                              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <div className="flex gap-3">
                              <select
                                value={editRightType}
                                onChange={(e) => setEditRightType(e.target.value)}
                                className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                <option value="OWNER">Owner</option>
                                <option value="CO_OWNER">Co-Owner</option>
                                <option value="BENEFICIARY">Beneficiary</option>
                                <option value="HEIR">Heir</option>
                                <option value="TRUSTEE">Trustee</option>
                              </select>
                              <input
                                type="number"
                                value={editRevenueShare}
                                onChange={(e) => setEditRevenueShare(e.target.value)}
                                step="0.01"
                                min="0"
                                max="1"
                                className="w-40 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(member.id)}
                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMemberId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <MemberDetail
                            memberId={member.id}
                            memberName={member.name}
                            memberEmail={member.email}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
                {folderMembers.length === 0 && (
                  <p className="text-sm text-gray-400 pl-4 py-2">No members in this folder</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Ungrouped</span>
          <span className="text-xs text-gray-400">({ungroupedMembers.length})</span>
        </div>

        <div className="space-y-2">
          {ungroupedMembers.map((member) => (
            <div key={member.id}>
              <MemberCard
                member={member}
                isExpanded={expandedMemberId === member.id}
                onToggle={toggleExpanded}
              />
              {expandedMemberId === member.id && (
                <>
                  {/* Action Bar */}
                  <div className="flex items-center gap-2 px-1 py-2">
                    {/* Move to folder dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMoveDropdownFor(showMoveDropdownFor === member.id ? null : member.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Move to
                      </button>
                      {showMoveDropdownFor === member.id && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-2 z-50 min-w-[160px]">
                          <button
                            onClick={() => { moveMember(member.id, null); setShowMoveDropdownFor(null); }}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                          >
                            Ungrouped
                          </button>
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => { moveMember(member.id, folder.id); setShowMoveDropdownFor(null); }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                                member.folderId === folder.id
                                  ? "text-blue-600 dark:text-blue-400 font-medium"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {folder.name} {member.folderId === folder.id ? "✓" : ""}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => startEdit(member)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteMember(member.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>

                  {/* Edit Form (shows instead of MemberDetail when editing) */}
                  {editingMemberId === member.id ? (
                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3 mb-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-3">
                        <select
                          value={editRightType}
                          onChange={(e) => setEditRightType(e.target.value)}
                          className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="CO_OWNER">Co-Owner</option>
                          <option value="BENEFICIARY">Beneficiary</option>
                          <option value="HEIR">Heir</option>
                          <option value="TRUSTEE">Trustee</option>
                        </select>
                        <input
                          type="number"
                          value={editRevenueShare}
                          onChange={(e) => setEditRevenueShare(e.target.value)}
                          step="0.01"
                          min="0"
                          max="1"
                          className="w-40 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(member.id)}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMemberId(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MemberDetail
                      memberId={member.id}
                      memberName={member.name}
                      memberEmail={member.email}
                    />
                  )}
                </>
              )}
            </div>
          ))}
          {ungroupedMembers.length === 0 && (
            <p className="text-sm text-gray-400 pl-4 py-2">No ungrouped members</p>
          )}
        </div>
      </div>
    </div>
  );
}