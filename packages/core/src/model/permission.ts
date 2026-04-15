import type { AgentId } from "./agent";
import type { Diagnostic } from "./diagnostics";

export type Capability =
  | "shell.execute"
  | "filesystem.read"
  | "filesystem.write"
  | "network.fetch"
  | "network.command"
  | "mcp.use"
  | "browser.use"
  | "approval.mode"
  | "sandbox.mode"
  | "instructions.load"
  | "hooks.run"
  | "unknown";

export type RuleEffect = "allow" | "ask" | "deny" | "configure" | "informational" | "unknown";
export type Confidence = "known" | "inferred" | "unknown";

export interface PermissionRule {
  id: string;
  sourceId: string;
  capability: Capability;
  effect: RuleEffect;
  raw: string;
  label: string;
  explanation: string;
  confidence: Confidence;
  specificity: "global" | "path" | "command" | "domain" | "tool" | "profile" | "unknown";
  target?: string;
  diagnostics: Diagnostic[];
}

export interface EffectivePermission {
  agentId: AgentId;
  capability: Capability;
  status: "allowed" | "denied" | "asks" | "partially-allowed" | "unknown";
  confidence: Confidence;
  explanation: string;
  contributingRuleIds: string[];
  blockingRuleIds: string[];
  caveats: string[];
}
