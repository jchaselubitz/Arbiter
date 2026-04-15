import type { AgentId, DocumentationReference } from "../model/agent";
import type { ChangePlan, PermissionIntentDefinition, PlanChangeInput } from "../model/change";
import type { Diagnostic } from "../model/diagnostics";
import type { EffectivePermission, PermissionRule } from "../model/permission";
import type { PermissionSource, SourceFile } from "../model/source";

export interface DiscoveryContext {
  homeDir: string;
  repoPath: string | null;
  platform: "macos" | "linux" | "windows" | "unknown";
}

export interface ParsedSource {
  source: SourceFile;
  rules: PermissionRule[];
  diagnostics: Diagnostic[];
  unknownKeys: string[];
  raw: unknown;
}

export interface AgentSummary {
  agentId: AgentId;
  displayName: string;
  status: "found" | "not-found" | "partial" | "parse-error";
  sources: SourceFile[];
  rules: PermissionRule[];
  effective: EffectivePermission[];
  diagnostics: Diagnostic[];
  unknownCount: number;
  highRiskFindings: string[];
}

export interface AgentAdapter {
  id: AgentId;
  displayName: string;
  adapterVersion: string;
  docsReviewedAt: string;
  docs: DocumentationReference[];
  discover(input: DiscoveryContext): SourceFile[];
  parse(source: SourceFile): ParsedSource;
  summarize(parsed: ParsedSource[]): AgentSummary;
  computeEffective(rules: PermissionRule[]): EffectivePermission[];
  getSupportedIntents(): PermissionIntentDefinition[];
  planChange(input: PlanChangeInput, source: SourceFile): ChangePlan;
}
