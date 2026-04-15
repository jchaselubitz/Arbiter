import type { AgentId } from "../model/agent";
import type { Diagnostic } from "../model/diagnostics";
import type { Capability, EffectivePermission, PermissionRule, RuleEffect } from "../model/permission";
import type { SourceFile, SourceFormat, SourceKind, PermissionScope, WriteSupport } from "../model/source";

export function makeSource(args: {
  agentId: AgentId;
  scope: PermissionScope;
  kind: SourceKind;
  path: string;
  exists?: boolean;
  content?: string | null;
  format: SourceFormat;
  precedence: number | null;
  writableByApp?: boolean;
  writeSupport: WriteSupport;
  adapterVersion: string;
  docsReviewedAt: string;
}): SourceFile {
  return {
    id: `${args.agentId}:${args.path}`,
    agentId: args.agentId,
    scope: args.scope,
    kind: args.kind,
    path: args.path,
    exists: args.exists ?? false,
    content: args.content ?? null,
    format: args.format,
    precedence: args.precedence,
    writableByApp: args.writableByApp ?? true,
    writeSupport: args.writeSupport,
    adapterVersion: args.adapterVersion,
    docsReviewedAt: args.docsReviewedAt
  };
}

export function classifyToken(raw: string): { capability: Capability; target?: string; specificity: PermissionRule["specificity"] } {
  const token = raw.trim();
  const call = /^([A-Za-z]+)\((.*)\)$/.exec(token);
  const name = call?.[1] ?? token;
  const target = call?.[2];
  if (name === "Bash" || name === "Shell") return { capability: "shell.execute", target, specificity: target ? "command" : "global" };
  if (name === "Read") return { capability: "filesystem.read", target, specificity: target ? "path" : "global" };
  if (name === "Write" || name === "Edit" || name === "MultiEdit") return { capability: "filesystem.write", target, specificity: target ? "path" : "global" };
  if (name === "WebFetch" || name === "WebSearch") return { capability: "network.fetch", target, specificity: target ? "domain" : "global" };
  if (name.startsWith("mcp__") || name === "Mcp") return { capability: "mcp.use", target, specificity: "tool" };
  return { capability: "unknown", target, specificity: target ? "tool" : "unknown" };
}

export function makeRule(sourceId: string, raw: string, effect: RuleEffect, index: number, labelPrefix = "Rule"): PermissionRule {
  const classified = classifyToken(raw);
  return {
    id: `${sourceId}:${effect}:${index}:${raw}`,
    sourceId,
    capability: classified.capability,
    effect,
    raw,
    label: `${labelPrefix}: ${raw}`,
    explanation: explainRule(raw, effect, classified.capability),
    confidence: classified.capability === "unknown" ? "unknown" : "known",
    specificity: classified.specificity,
    target: classified.target,
    diagnostics: []
  };
}

export function explainRule(raw: string, effect: RuleEffect, capability: Capability): string {
  if (effect === "informational") return raw;
  const verb = effect === "allow" ? "allows" : effect === "deny" ? "denies" : effect === "ask" ? "asks before" : "configures";
  const capabilityLabel = capability.replace(".", " ");
  return `This ${verb} ${capabilityLabel} for ${raw}.`;
}

export function effectiveFromRules(agentId: AgentId, rules: PermissionRule[]): EffectivePermission[] {
  const capabilities: Capability[] = [
    "shell.execute",
    "filesystem.read",
    "filesystem.write",
    "network.fetch",
    "mcp.use",
    "approval.mode",
    "sandbox.mode",
    "instructions.load"
  ];

  return capabilities.map((capability) => {
    const related = rules.filter((rule) => rule.capability === capability);
    const denied = related.filter((rule) => rule.effect === "deny");
    const asks = related.filter((rule) => rule.effect === "ask");
    const allowed = related.filter((rule) => rule.effect === "allow" || rule.effect === "configure" || rule.effect === "informational");
    const status = denied.length ? "denied" : asks.length ? "asks" : allowed.length ? "partially-allowed" : "unknown";
    const confidence = related.length && related.every((rule) => rule.confidence === "known") ? "known" : related.length ? "inferred" : "unknown";
    return {
      agentId,
      capability,
      status,
      confidence,
      explanation: related.length ? `${related.length} source rule${related.length === 1 ? "" : "s"} contribute to this capability.` : "No supported source rule was found for this capability.",
      contributingRuleIds: allowed.concat(asks).map((rule) => rule.id),
      blockingRuleIds: denied.map((rule) => rule.id),
      caveats: confidence === "unknown" ? ["Unknown or unsupported config may affect this result."] : []
    };
  });
}

export function collectDiagnostics(parsed: Array<{ diagnostics: Diagnostic[] }>): Diagnostic[] {
  return parsed.flatMap((item) => item.diagnostics);
}

export function arrayFromUnknown(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function nestedObject(root: Record<string, unknown>, key: string): Record<string, unknown> {
  const current = root[key];
  if (current && typeof current === "object" && !Array.isArray(current)) return current as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  root[key] = next;
  return next;
}
