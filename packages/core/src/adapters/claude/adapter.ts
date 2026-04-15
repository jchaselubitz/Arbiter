import type { AgentAdapter, AgentSummary, DiscoveryContext, ParsedSource } from "../types";
import { arrayFromUnknown, collectDiagnostics, effectiveFromRules, makeRule, makeSource, nestedObject } from "../common";
import type { ChangePlan, PlanChangeInput } from "../../model/change";
import type { PermissionRule } from "../../model/permission";
import type { SourceFile } from "../../model/source";
import { formatJson, getObject, parseJsonLike } from "../../formats/jsonc";
import { createLineDiff } from "../../planning/diff";

const adapterVersion = "0.1.0";
const docsReviewedAt = "2026-04-15";

export const claudeAdapter: AgentAdapter = {
  id: "claude-code",
  displayName: "Claude Code",
  adapterVersion,
  docsReviewedAt,
  docs: [
    { agentId: "claude-code", url: "https://code.claude.com/docs/en/settings", reviewedAt: docsReviewedAt, relevantSections: ["settings scopes", "precedence"] },
    { agentId: "claude-code", url: "https://code.claude.com/docs/en/permissions", reviewedAt: docsReviewedAt, relevantSections: ["permissions arrays", "default mode", "sandbox"] }
  ],
  discover(input: DiscoveryContext) {
    const sources: SourceFile[] = [
      makeSource({ agentId: "claude-code", scope: "managed", kind: "managed-policy", path: input.platform === "macos" ? "/Library/Application Support/ClaudeCode/managed-settings.json" : "/etc/claude-code/managed-settings.json", format: "json", precedence: 100, writableByApp: false, writeSupport: "read-only", adapterVersion, docsReviewedAt }),
      makeSource({ agentId: "claude-code", scope: "user", kind: "settings", path: `${input.homeDir}/.claude/settings.json`, format: "json", precedence: 10, writeSupport: "safe-write", adapterVersion, docsReviewedAt })
    ];
    if (input.repoPath) {
      sources.push(makeSource({ agentId: "claude-code", scope: "repo", kind: "settings", path: `${input.repoPath}/.claude/settings.json`, format: "json", precedence: 30, writeSupport: "safe-write", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "claude-code", scope: "local", kind: "settings", path: `${input.repoPath}/.claude/settings.local.json`, format: "json", precedence: 40, writeSupport: "safe-write", adapterVersion, docsReviewedAt }));
    }
    return sources;
  },
  parse(source: SourceFile): ParsedSource {
    if (!source.exists || source.content === null) {
      return { source, rules: [], diagnostics: [], unknownKeys: [], raw: null };
    }
    const parsed = parseJsonLike(source.content, source.path);
    const root = getObject(parsed.value);
    if (!root) return { source, rules: [], diagnostics: parsed.diagnostics, unknownKeys: [], raw: parsed.value };

    const permissions = getObject(root.permissions) ?? {};
    const sandbox = getObject(root.sandbox) ?? {};
    const filesystem = getObject(sandbox.filesystem) ?? {};
    const network = getObject(sandbox.network) ?? {};
    const rules: PermissionRule[] = [];

    for (const effect of ["allow", "ask", "deny"] as const) {
      arrayFromUnknown(permissions[effect]).forEach((raw, index) => rules.push(makeRule(source.id, raw, effect, index, `Claude ${effect}`)));
    }
    if (typeof permissions.defaultMode === "string") rules.push(configRule(source.id, "approval.mode", "permissions.defaultMode", permissions.defaultMode));
    if (typeof permissions.disableBypassPermissionsMode === "boolean") rules.push(configRule(source.id, "approval.mode", "permissions.disableBypassPermissionsMode", String(permissions.disableBypassPermissionsMode)));
    if (typeof sandbox.enabled === "boolean") rules.push(configRule(source.id, "sandbox.mode", "sandbox.enabled", String(sandbox.enabled)));
    arrayFromUnknown(filesystem.allowWrite).forEach((raw, index) => rules.push(makeRule(source.id, `Write(${raw})`, "allow", index, "Claude sandbox write")));
    arrayFromUnknown(filesystem.denyWrite).forEach((raw, index) => rules.push(makeRule(source.id, `Write(${raw})`, "deny", index, "Claude sandbox write")));
    arrayFromUnknown(filesystem.allowRead).forEach((raw, index) => rules.push(makeRule(source.id, `Read(${raw})`, "allow", index, "Claude sandbox read")));
    arrayFromUnknown(filesystem.denyRead).forEach((raw, index) => rules.push(makeRule(source.id, `Read(${raw})`, "deny", index, "Claude sandbox read")));
    arrayFromUnknown(network.allowedDomains).forEach((raw, index) => rules.push(makeRule(source.id, `WebFetch(${raw})`, "allow", index, "Claude sandbox network")));

    return {
      source: { ...source, writeSupport: parsed.hasComments || source.scope === "managed" ? "read-only" : source.writeSupport },
      rules,
      diagnostics: parsed.diagnostics,
      unknownKeys: Object.keys(root).filter((key) => !["$schema", "permissions", "sandbox"].includes(key)),
      raw: parsed.value
    };
  },
  summarize(parsed: ParsedSource[]): AgentSummary {
    const rules = parsed.flatMap((item) => item.rules);
    const diagnostics = collectDiagnostics(parsed);
    return {
      agentId: "claude-code",
      displayName: "Claude Code",
      status: diagnostics.some((item) => item.severity === "error") ? "parse-error" : parsed.some((item) => item.source.exists) ? "found" : "not-found",
      sources: parsed.map((item) => item.source),
      rules,
      effective: this.computeEffective(rules),
      diagnostics,
      unknownCount: parsed.reduce((sum, item) => sum + item.unknownKeys.length, 0),
      highRiskFindings: rules.filter((rule) => /bypass|danger/i.test(rule.raw)).map((rule) => `Claude Code risky setting: ${rule.raw}`)
    };
  },
  computeEffective(rules) {
    return effectiveFromRules("claude-code", rules);
  },
  getSupportedIntents() {
    return [
      { id: "add-allow-rule", label: "Add permissions.allow rule", risk: "medium" },
      { id: "add-ask-rule", label: "Add permissions.ask rule", risk: "low" },
      { id: "add-deny-rule", label: "Add permissions.deny rule", risk: "low" },
      { id: "remove-allow-rule", label: "Remove exact allow rule", risk: "medium" },
      { id: "remove-ask-rule", label: "Remove exact ask rule", risk: "medium" },
      { id: "remove-deny-rule", label: "Remove exact deny rule", risk: "high" },
      { id: "set-default-mode", label: "Set permissions.defaultMode", risk: "medium" }
    ];
  },
  planChange(input: PlanChangeInput, source: SourceFile): ChangePlan {
    const before = source.content ?? "{}\n";
    if (source.scope === "managed") return refused(input, source, before, "Managed Claude settings are read-only.");
    const parsed = parseJsonLike(before, source.path);
    if (parsed.hasComments) return refused(input, source, before, "Comment-preserving JSONC writes are not enabled.");
    const root = getObject(parsed.value) ?? {};
    const permissions = nestedObject(root, "permissions");
    const warnings: string[] = [];
    const arrayKey = intentArrayKey(input.intent);
    if (arrayKey) {
      const arr = arrayFromUnknown(permissions[arrayKey]);
      const value = String(input.value);
      let next = arr;
      if (input.intent.startsWith("add-")) {
        next = arr.includes(value) ? arr : [...arr, value];
      } else {
        next = arr.filter((item) => item !== value);
      }
      if (input.intent === "remove-deny-rule") warnings.push("Removing a deny rule can broaden what Claude Code may do.");
      permissions[arrayKey] = next;
    } else if (input.intent === "set-default-mode") {
      const value = String(input.value);
      if (/bypass|danger/i.test(value)) return refused(input, source, before, "Bypass or dangerous default modes cannot be set by this MVP writer.");
      permissions.defaultMode = value;
    } else {
      return refused(input, source, before, "Unsupported Claude change intent.");
    }
    const after = formatJson(root);
    return { ok: true, agentId: "claude-code", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after, diff: createLineDiff(before, after), willCreate: !source.exists, warnings, diagnostics: [] };
  }
};

function configRule(sourceId: string, capability: PermissionRule["capability"], key: string, value: string): PermissionRule {
  return { id: `${sourceId}:config:${key}`, sourceId, capability, effect: "configure", raw: `${key} = ${value}`, label: key, explanation: `Claude Code configures ${key} as ${value}.`, confidence: "known", specificity: "global", diagnostics: [] };
}

function intentArrayKey(intent: string): "allow" | "ask" | "deny" | null {
  if (intent.endsWith("allow-rule")) return "allow";
  if (intent.endsWith("ask-rule")) return "ask";
  if (intent.endsWith("deny-rule")) return "deny";
  return null;
}

function refused(input: PlanChangeInput, source: SourceFile, before: string, message: string): ChangePlan {
  return { ok: false, agentId: "claude-code", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after: before, diff: "No changes.", willCreate: !source.exists, warnings: [message], diagnostics: [{ severity: "error", message, path: source.path }] };
}
