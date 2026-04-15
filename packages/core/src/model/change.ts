import type { AgentId } from "./agent";
import type { Diagnostic } from "./diagnostics";

export type PermissionIntent =
  | "add-allow-rule"
  | "add-ask-rule"
  | "add-deny-rule"
  | "remove-allow-rule"
  | "remove-ask-rule"
  | "remove-deny-rule"
  | "set-default-mode"
  | "set-sandbox-network";

export interface PermissionIntentDefinition {
  id: PermissionIntent;
  label: string;
  risk: "low" | "medium" | "high";
}

export interface PlanChangeInput {
  sourceId: string;
  currentContent: string | null;
  intent: PermissionIntent;
  value: string | boolean;
  actionLabel: string;
}

export interface ChangePlan {
  ok: boolean;
  agentId: AgentId;
  sourceId: string;
  path: string;
  actionLabel: string;
  before: string;
  after: string;
  diff: string;
  willCreate: boolean;
  warnings: string[];
  diagnostics: Diagnostic[];
}
