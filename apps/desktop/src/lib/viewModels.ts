import type {
  AgentExtensionConfig,
  AgentExtensionStatus,
  AgentSummary,
  Capability,
  DiscoveryResult,
  EffectivePermission,
  PermissionRule,
  PermissionScope,
  SourceFile
} from "@agent-permissions-editor/core";

export const capabilityLabels: Record<Capability, string> = {
  "shell.execute": "Shell commands",
  "filesystem.read": "File reads",
  "filesystem.write": "File writes",
  "network.fetch": "Network access",
  "network.command": "Network commands",
  "mcp.use": "MCP tools",
  "browser.use": "Browser access",
  "approval.mode": "Approval mode",
  "sandbox.mode": "Sandbox mode",
  "instructions.load": "Instruction sources",
  "hooks.run": "Hooks",
  unknown: "Unknown"
};

const scopeLabels: Record<PermissionScope, string> = {
  managed: "Managed",
  user: "User-level",
  workspace: "Workspace-level",
  repo: "Repo-level",
  local: "Local override",
  runtime: "Runtime",
  unknown: "Unknown scope"
};

const kindLabels: Record<SourceFile["kind"], string> = {
  settings: "settings",
  permissions: "permissions",
  instructions: "instructions",
  skills: "skills",
  plugins: "plugins",
  mcp: "MCP config",
  "ide-settings": "IDE settings",
  "managed-policy": "managed policy",
  unknown: "config"
};

export const extensionKindLabels: Record<AgentExtensionConfig["kind"], string> = {
  skills: "Skills",
  plugins: "Plugins"
};

export const extensionStatusLabels: Record<AgentExtensionStatus, string> = {
  configured: "Configured",
  available: "Available",
  "not-found": "Not found",
  unsupported: "Unsupported",
  unknown: "Unknown"
};

export function sourceScopeLabel(source: SourceFile): string {
  return scopeLabels[source.scope];
}

export function sourceLabel(source: SourceFile): string {
  return `${sourceScopeLabel(source)} ${kindLabels[source.kind]}`;
}

export function sourceBasename(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

export function agentStatus(summary: AgentSummary): string {
  if (summary.status === "parse-error") return "Parse error";
  if (summary.status === "found") return "Found";
  if (summary.status === "partial") return "Partial";
  return "Not found";
}

export function riskLevel(result: DiscoveryResult | null): "low" | "medium" | "high" {
  if (!result) return "low";
  if (result.highRiskFindings.length > 0) return "high";
  if (result.summaries.some((summary) => summary.unknownCount > 0 || summary.diagnostics.length > 0)) return "medium";
  return "low";
}

export function rulesForSource(result: DiscoveryResult, sourceId: string): PermissionRule[] {
  return result.parsedSources.find((source) => source.source.id === sourceId)?.rules ?? [];
}

export function effectiveRows(summary: AgentSummary): EffectivePermission[] {
  return summary.effective.filter((row) => row.capability !== "unknown");
}
