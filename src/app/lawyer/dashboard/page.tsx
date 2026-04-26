"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

interface Case {
  id: string;
  plaintiffName: string;
  defendantName: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  description: string;
}

export default function LawyerDashboard() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { isZh } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "dark" : "light");

    const handleThemeChange = (e: Event) => {
      setTheme((e as CustomEvent<{ theme: "light" | "dark" }>).detail.theme);
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    try {
      const res = await fetch("/api/lawyers/cases");
      const json = await res.json();
      if (json.success) {
        setCases(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
    }
  }

  const statusLabels = {
    PENDING: isZh ? "待处理" : "Pending",
    IN_PROGRESS: isZh ? "处理中" : "In Progress",
    RESOLVED: isZh ? "已解决" : "Resolved",
    REJECTED: isZh ? "已拒绝" : "Rejected",
  };

  const statusColors = {
    PENDING: "#f59e0b",
    IN_PROGRESS: "#3b82f6",
    RESOLVED: "#22c55e",
    REJECTED: "#ef4444",
  };

  return (
    <div style={{ minHeight: "100vh", background: theme === "dark" ? "#1a1a2e" : "#f8fafc" }}>
      {/* Header */}
      <header style={{
        background: theme === "dark" ? "#16213e" : "#ffffff",
        borderBottom: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`,
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>⚖️</span>
          <span style={{ fontSize: "18px", fontWeight: "600", color: theme === "dark" ? "#ffffff" : "#1e293b" }}>
            PortraitPay AI
          </span>
          <span style={{
            background: "#3b82f6",
            color: "#fff",
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "4px",
            fontWeight: "500"
          }}>
            {isZh ? "律师端" : "Lawyer"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Title */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: theme === "dark" ? "#ffffff" : "#1e293b", margin: 0 }}>
            {isZh ? "律师工作台" : "Lawyer Dashboard"}
          </h1>
          <p style={{ color: theme === "dark" ? "#94a3b8" : "#64748b", marginTop: "8px" }}>
            {isZh ? "管理您的肖像权保护案件" : "Manage your portrait rights protection cases"}
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div style={{
            background: theme === "dark" ? "#16213e" : "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`
          }}>
            <div style={{ fontSize: "14px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              {isZh ? "待处理案件" : "Pending Cases"}
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b", marginTop: "8px" }}>
              {cases.filter(c => c.status === "PENDING").length}
            </div>
          </div>
          <div style={{
            background: theme === "dark" ? "#16213e" : "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`
          }}>
            <div style={{ fontSize: "14px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              {isZh ? "处理中案件" : "In Progress"}
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: "#3b82f6", marginTop: "8px" }}>
              {cases.filter(c => c.status === "IN_PROGRESS").length}
            </div>
          </div>
          <div style={{
            background: theme === "dark" ? "#16213e" : "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`
          }}>
            <div style={{ fontSize: "14px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              {isZh ? "已解决案件" : "Resolved"}
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e", marginTop: "8px" }}>
              {cases.filter(c => c.status === "RESOLVED").length}
            </div>
          </div>
          <div style={{
            background: theme === "dark" ? "#16213e" : "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`
          }}>
            <div style={{ fontSize: "14px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              {isZh ? "案件总数" : "Total Cases"}
            </div>
            <div style={{ fontSize: "32px", fontWeight: "700", color: theme === "dark" ? "#ffffff" : "#1e293b", marginTop: "8px" }}>
              {cases.length}
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div style={{
          background: theme === "dark" ? "#16213e" : "#ffffff",
          borderRadius: "12px",
          border: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`
        }}>
          <div style={{
            padding: "20px",
            borderBottom: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}`
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: theme === "dark" ? "#ffffff" : "#1e293b", margin: 0 }}>
              {isZh ? "案件列表" : "Cases List"}
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              {isZh ? "加载中..." : "Loading..."}
            </div>
          ) : cases.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
              {isZh ? "暂无案件" : "No cases yet"}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme === "dark" ? "#1a1a2e" : "#f8fafc" }}>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: theme === "dark" ? "#94a3b8" : "#64748b", textTransform: "uppercase" }}>
                      {isZh ? "案件编号" : "Case ID"}
                    </th>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: theme === "dark" ? "#94a3b8" : "#64748b", textTransform: "uppercase" }}>
                      {isZh ? "原告" : "Plaintiff"}
                    </th>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: theme === "dark" ? "#94a3b8" : "#64748b", textTransform: "uppercase" }}>
                      {isZh ? "被告" : "Defendant"}
                    </th>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: theme === "dark" ? "#94a3b8" : "#64748b", textTransform: "uppercase" }}>
                      {isZh ? "状态" : "Status"}
                    </th>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: theme === "dark" ? "#94a3b8" : "#64748b", textTransform: "uppercase" }}>
                      {isZh ? "创建时间" : "Created"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${theme === "dark" ? "#2d2d44" : "#e2e8f0"}` }}>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: theme === "dark" ? "#ffffff" : "#1e293b" }}>
                        #{c.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: theme === "dark" ? "#ffffff" : "#1e293b" }}>
                        {c.plaintiffName}
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: theme === "dark" ? "#ffffff" : "#1e293b" }}>
                        {c.defendantName}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: "500",
                          background: `${statusColors[c.status]}20`,
                          color: statusColors[c.status]
                        }}>
                          {statusLabels[c.status]}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
