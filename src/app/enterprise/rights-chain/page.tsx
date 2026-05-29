/**
 * /enterprise/rights-chain - Rights Chain Visualization
 * Read-only tree visualization of authorization chain: Triumph → PortraitPay → Venue → Sub-agency
 */
"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

interface ChainNode {
  id: string;
  name: string;
  type: string;
  scopes: string[];
  territorialScope: string;
  exclusivity: boolean;
  isAgency: boolean;
  parentId: string | null;
  status: string;
}

interface NodeDetail {
  name: string;
  type: string;
  status: string;
  scopes: string[];
  territorialScope: string;
  exclusivity: boolean;
  usageScenes?: string[];
  platforms?: string[];
  territories?: string[];
  prohibitedUses?: string[];
}

const BADGE_COLORS: Record<string, string> = {
  ROOT_SPONSOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  ENTERTAINMENT_AGENCY: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  SUB_AGENCY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  VENUE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

const LEVEL_COLORS = [
  { bg: "bg-purple-500", text: "text-white", ring: "ring-purple-200" },
  { bg: "bg-indigo-500", text: "text-white", ring: "ring-indigo-200" },
  { bg: "bg-blue-500", text: "text-white", ring: "ring-blue-200" },
  { bg: "bg-gray-500", text: "text-white", ring: "ring-gray-200" },
];

const LEVEL_LABELS = ["Root", "Platform", "Venue", "Sub-agency"];

function buildTree(chain: ChainNode[]): { nodes: ChainNode[]; children: Map<string, ChainNode[]> } {
  const nodeMap = new Map<string, ChainNode>();
  const childrenMap = new Map<string, ChainNode[]>();

  chain.forEach(node => {
    nodeMap.set(node.id, node);
    if (!childrenMap.has(node.id)) childrenMap.set(node.id, []);
  });

  chain.forEach(node => {
    if (node.parentId && childrenMap.has(node.parentId)) {
      childrenMap.get(node.parentId)!.push(node);
    }
  });

  const roots = chain.filter(n => !n.parentId || !nodeMap.has(n.parentId));
  return { nodes: roots.length > 0 ? roots : chain.slice(0, 1), children: childrenMap };
}

function TreeNode({
  node,
  level,
  index,
  totalCount,
  selectedId,
  onSelect,
  children,
}: {
  node: ChainNode;
  level: number;
  index: number;
  totalCount: number;
  selectedId: string | null;
  onSelect: (n: ChainNode) => void;
  children: ChainNode[];
}) {
  const colorIdx = Math.min(level, LEVEL_COLORS.length - 1);
  const colors = LEVEL_COLORS[colorIdx];
  const isSelected = selectedId === node.id;
  const typeLabel = LEVEL_LABELS[colorIdx] || `Level ${level + 1}`;
  const badgeClass = BADGE_COLORS[node.type] || BADGE_COLORS.default;

  return (
    <div className="relative">
      {/* Connector line to parent */}
      {level > 0 && (
        <div className="absolute -left-6 top-0 flex flex-col items-center" style={{ height: "100%" }}>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        {/* Node number circle */}
        <button
          onClick={() => onSelect(node)}
          className={`relative flex-shrink-0 w-10 h-10 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center text-sm font-bold shadow-sm ring-2 ${isSelected ? colors.ring.replace("ring-", "ring-4 ") + " ring-offset-2" : ""} transition-all hover:scale-105`}
        >
          {index + 1}
          {/* Vertical line below */}
          {index < totalCount - 1 && (
            <div className="absolute top-full left-1/2 w-px h-4 -translate-x-1/2 bg-gray-300 dark:bg-gray-600" />
          )}
        </button>

        {/* Node content card */}
        <button
          onClick={() => onSelect(node)}
          className={`flex-1 min-w-0 text-left rounded-xl border p-4 transition-all hover:shadow-md ${isSelected ? "border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">{node.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{node.territorialScope}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${badgeClass}`}>
                {typeLabel}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full text-xs ${node.exclusivity ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                {node.exclusivity ? "Exclusive" : "Non-exclusive"}
              </span>
            </div>
          </div>

          {node.scopes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {node.scopes.map((scope: string) => (
                <span key={scope} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded">
                  {scope}
                </span>
              ))}
            </div>
          )}

          {children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Sub-agencies ({children.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {children.slice(0, 3).map((child: ChainNode) => (
                  <span key={child.id} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                    {child.name}
                  </span>
                ))}
                {children.length > 3 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded">
                    +{children.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function DetailPanel({
  node,
  onClose,
}: {
  node: ChainNode;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const td = t.enterpriseRightsChain || {};

  const detail: NodeDetail = {
    name: node.name,
    type: node.type,
    status: node.status,
    scopes: node.scopes,
    territorialScope: node.territorialScope,
    exclusivity: node.exclusivity,
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{td.nodeDetails || "Node Details"}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Node name and type */}
      <div className="mb-4">
        <div className="text-lg font-bold text-gray-900 dark:text-white">{detail.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{detail.type.replace("_", " ")}</div>
        <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${detail.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
          {detail.status}
        </span>
      </div>

      {/* Exclusivity */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{td.exclusivity || "Exclusivity"}</div>
        <div className={`text-sm font-medium ${detail.exclusivity ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
          {detail.exclusivity ? "Exclusive License" : "Non-exclusive License"}
        </div>
      </div>

      {/* Territorial Scope */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{td.territorialScope || "Territorial Scope"}</div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
          {detail.territorialScope.charAt(0).toUpperCase() + detail.territorialScope.slice(1)}
        </div>
      </div>

      {/* Rights Scopes */}
      {detail.scopes.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{td.rightsScopes || "Rights Scopes"}</div>
          <div className="flex flex-wrap gap-1.5">
            {detail.scopes.map((scope: string) => (
              <span key={scope} className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800">
                {scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder for scope details from the spec */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
        <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">Scope breakdown</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Usage Scenes</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">Commercial, Streaming</div>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Platforms</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">iOS, Android, Web</div>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Territories</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">CN, HK, TW</div>
          </div>
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-gray-500 dark:text-gray-400 mb-1">Prohibited Uses</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">Resale, Modification</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  const td = t.enterpriseRightsChain || {};

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        {td.noRightsChain || "No rights chain recorded"}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
        {td.noRightsChainDesc || "Authorization chain data will appear here once agencies establish licensing relationships."}
      </p>
    </div>
  );
}

export default function RightsChainPage() {
  const { t } = useLanguage();
  const td = t.enterpriseRightsChain || {};

  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState<ChainNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ChainNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRightsChain() {
      try {
        const res = await fetch("/api/v1/agency/rights-chain", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setChain(data.chain || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rights chain");
      } finally {
        setLoading(false);
      }
    }

    fetchRightsChain();
  }, []);

  // Build tree structure
  const { nodes: rootNodes, children: childrenMap } = buildTree(chain);

  return (
    <DashboardShell>
      <div className="p-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {td.title || "Rights Chain"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {td.subtitle || "Authorization hierarchy visualization"}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        ) : chain.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex gap-6">
            {/* Tree visualization */}
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {td.chainVisualization || "Chain Visualization"}
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {chain.length} {td.nodes || "nodes"}
                  </span>
                </div>

                {/* Tree structure */}
                <div className="relative pl-8">
                  {/* Vertical guide line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-indigo-200 to-blue-200 dark:from-purple-800 dark:via-indigo-800 dark:to-blue-800 rounded" />

                  <div className="space-y-2">
                    {chain.map((node, idx) => {
                      const children = childrenMap.get(node.id) || [];
                      const level = idx;
                      return (
                        <TreeNode
                          key={node.id}
                          node={node}
                          level={level}
                          index={idx}
                          totalCount={chain.length}
                          selectedId={selectedNode?.id || null}
                          onSelect={setSelectedNode}
                          children={children}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">{td.legend || "Legend"}:</span>
                {[
                  { label: "Root (IP Owner)", color: "bg-purple-500" },
                  { label: "Platform", color: "bg-indigo-500" },
                  { label: "Venue/Agent", color: "bg-blue-500" },
                  { label: "Sub-agency", color: "bg-gray-500" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="w-80 flex-shrink-0">
              {selectedNode ? (
                <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sticky top-4 text-center">
                  <div className="text-4xl mb-3">👆</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {td.clickNodeToView || "Click a node to view its details"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}