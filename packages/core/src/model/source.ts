import type { AgentId } from "./agent";

export type PermissionScope = "managed" | "user" | "workspace" | "repo" | "local" | "runtime" | "unknown";
export type SourceKind = "settings" | "permissions" | "instructions" | "mcp" | "ide-settings" | "managed-policy" | "unknown";
export type SourceFormat = "json" | "jsonc" | "toml" | "markdown" | "yaml" | "unknown";
export type WriteSupport = "safe-write" | "read-only" | "partial" | "unsupported";

export interface PermissionSource {
  id: string;
  agentId: AgentId;
  scope: PermissionScope;
  kind: SourceKind;
  path: string;
  exists: boolean;
  format: SourceFormat;
  precedence: number | null;
  writableByApp: boolean;
  writeSupport: WriteSupport;
  adapterVersion: string;
  docsReviewedAt: string;
}

export interface SourceFile extends PermissionSource {
  content: string | null;
  isSymlink?: boolean;
  resolvedPath?: string | null;
}
