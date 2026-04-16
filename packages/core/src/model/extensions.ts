import type { AgentId } from "./agent";
import type { Confidence } from "./permission";
import type { PermissionScope } from "./source";

export type AgentExtensionKind = "skills" | "plugins";
export type AgentExtensionStatus = "configured" | "available" | "not-found" | "unsupported" | "unknown";

export interface AgentExtensionConfig {
  id: string;
  agentId: AgentId;
  kind: AgentExtensionKind;
  label: string;
  status: AgentExtensionStatus;
  confidence: Confidence;
  scope: PermissionScope | "mixed";
  sourceIds: string[];
  locations: string[];
  configuration: string;
  notes: string[];
}
