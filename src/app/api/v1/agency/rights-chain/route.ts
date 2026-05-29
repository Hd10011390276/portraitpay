/**
 * GET /api/v1/agency/rights-chain
 * 获取当前机构的授权链展示数据
 * Rights Chain 逻辑（后端强校验）:
 * - 子节点授权范围 ⊆ 父节点授权范围
 * - 子节点地域范围 ⊆ 父节点地域范围
 * - 校验失败时返回 chainValidation.error
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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

function validateScopeSubset(childScopes: string[], parentScopes: string[]): boolean {
  if (!parentScopes || parentScopes.length === 0) return true; // root has all
  return childScopes.every(s => parentScopes.includes(s));
}

function validateTerritorialSubset(childTerritory: string, parentTerritory: string): boolean {
  const hierarchy: Record<string, number> = {
    global: 0,
    americas: 1,
    europe: 1,
    asia: 1,
    china: 2,
    hong_kong: 2,
    taiwan: 2,
  };
  const childLevel = hierarchy[childTerritory] ?? 99;
  const parentLevel = hierarchy[parentTerritory] ?? 99;
  return childLevel >= parentLevel;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const agency = await prisma.agencyAccount.findUnique({
      where: { userId: session.userId },
      include: {
        parentAgency: { select: { id: true, agencyName: true, agencyType: true, rightsScope: true } },
        childAgencies: { select: { id: true, agencyName: true, agencyType: true, rightsScope: true } },
      },
    });

    if (!agency) {
      return NextResponse.json({ success: false, error: "Agency not found" }, { status: 404 });
    }

    // Build the chain from root to current agency
    const chain: ChainNode[] = [];
    let current: any = agency;

    // Traverse up to root
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      const rightsScope = typeof current.rightsScope === "string"
        ? JSON.parse(current.rightsScope)
        : (current.rightsScope || { scopes: [], territorialScope: "global", exclusivity: false });

      chain.unshift({
        id: current.id,
        name: current.agencyName,
        type: current.agencyType,
        scopes: rightsScope.scopes || [],
        territorialScope: rightsScope.territorialScope || "global",
        exclusivity: rightsScope.exclusivity || false,
        isAgency: true,
        parentId: current.parentAgencyId,
        status: current.status,
      });
      current = current.parentAgency;
    }

    // Also add child agencies as sub-nodes
    const childNodes: ChainNode[] = agency.childAgencies.map(child => {
      const rightsScope = typeof child.rightsScope === "string"
        ? JSON.parse(child.rightsScope)
        : ({ scopes: [], territorialScope: "global", exclusivity: false });
      return {
        id: child.id,
        name: child.agencyName,
        type: child.agencyType,
        scopes: rightsScope.scopes || [],
        territorialScope: rightsScope.territorialScope || "global",
        exclusivity: rightsScope.exclusivity || false,
        isAgency: true,
        parentId: agency.id,
        status: "ACTIVE",
      };
    });

    // Validate child ≤ parent constraints
    const chainValidation: { valid: boolean; errors: string[] } = { valid: true, errors: [] };
    for (let i = 1; i < chain.length; i++) {
      const parent = chain[i - 1];
      const child = chain[i];
      if (!validateScopeSubset(child.scopes, parent.scopes)) {
        chainValidation.valid = false;
        chainValidation.errors.push(`Scopes violation: ${child.name} scopes exceed ${parent.name}`);
      }
      if (!validateTerritorialSubset(child.territorialScope, parent.territorialScope)) {
        chainValidation.valid = false;
        chainValidation.errors.push(`Territory violation: ${child.name} territory exceeds ${parent.name}`);
      }
    }

    const fullChain = [...chain, ...childNodes];

    return NextResponse.json({
      success: true,
      chain: fullChain,
      chainValidation,
      rootAgency: chain[0] || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch rights chain";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}