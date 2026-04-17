import type { AgentAdapter, AgentSummary, ParsedSource } from "../types";
import { arrayFromUnknown, collectDiagnostics, effectiveFromRules, extensionConfig, makeRule, makeSource, nestedObject, unsupportedExtension } from "../common";
import type { ChangePlan, PlanChangeInput } from "../../model/change";
import type { PermissionRule } from "../../model/permission";
import type { SourceFile } from "../../model/source";
import { formatJson, getObject, parseJsonLike } from "../../formats/jsonc";
import { createLineDiff } from "../../planning/diff";

const adapterVersion = "0.1.0";
const docsReviewedAt = "2026-04-15";

/** Cursor CLI `permissions.allow` / `permissions.deny` token shapes this adapter models. */
const CURSOR_PERMISSION_TOKEN_RE = /^(Shell|Read|Write|Mcp)\(.+\)$/;

export const cursorAdapter: AgentAdapter = {
  id: "cursor",
  displayName: "Cursor",
  adapterVersion,
  docsReviewedAt,
  docs: [
    { agentId: "cursor", url: "https://docs.cursor.com/cli/reference/permissions", reviewedAt: docsReviewedAt, relevantSections: ["CLI permissions"] },
    { agentId: "cursor", url: "https://docs.cursor.com/context/rules", reviewedAt: docsReviewedAt, relevantSections: ["rules", "AGENTS.md"] }
  ],
  discover(input) {
    const sources = [
      makeSource({ agentId: "cursor", scope: "user", kind: "settings", path: `${input.homeDir}/.cursor/cli-config.json`, format: "json", precedence: 10, writeSupport: "safe-write", adapterVersion, docsReviewedAt })
    ];
    if (input.repoPath) {
      sources.push(makeSource({ agentId: "cursor", scope: "repo", kind: "settings", path: `${input.repoPath}/.cursor/cli.json`, format: "json", precedence: 20, writeSupport: "safe-write", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "cursor", scope: "repo", kind: "instructions", path: `${input.repoPath}/AGENTS.md`, format: "markdown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "cursor", scope: "repo", kind: "skills", path: `${input.repoPath}/.cursor/rules`, format: "unknown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "cursor", scope: "repo", kind: "instructions", path: `${input.repoPath}/.cursorrules`, format: "markdown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
    }
    return sources;
  },
  parse(source: SourceFile): ParsedSource {
    if (!source.exists || source.content === null) return { source, rules: [], diagnostics: [], unknownKeys: [], raw: null };
    if (source.kind === "skills" || source.kind === "plugins") return { source, rules: [], diagnostics: [], unknownKeys: [], raw: source.content };
    if (source.kind === "instructions") {
      const rule = makeRule(source.id, `Instructions(${source.path})`, "informational", 0, "Cursor instructions");
      rule.capability = "instructions.load";
      return { source, rules: [rule], diagnostics: [], unknownKeys: [], raw: source.content };
    }
    const parsed = parseJsonLike(source.content, source.path);
    const root = getObject(parsed.value);
    if (!root) return { source, rules: [], diagnostics: parsed.diagnostics, unknownKeys: [], raw: parsed.value };
    const permissions = getObject(root.permissions) ?? {};
    const rules: PermissionRule[] = [];
    arrayFromUnknown(permissions.allow).forEach((raw, index) => rules.push(makeRule(source.id, raw, "allow", index, "Cursor allow")));
    arrayFromUnknown(permissions.deny).forEach((raw, index) => rules.push(makeRule(source.id, raw, "deny", index, "Cursor deny")));
    return { source: { ...source, writeSupport: parsed.hasComments ? "read-only" : source.writeSupport }, rules, diagnostics: parsed.diagnostics.concat(validateTokens(rules, source.path)), unknownKeys: Object.keys(root).filter((key) => key !== "permissions"), raw: parsed.value };
  },
  summarize(parsed: ParsedSource[]): AgentSummary {
    const rules = parsed.flatMap((item) => item.rules);
    const diagnostics = collectDiagnostics(parsed);
    const sources = parsed.map((item) => item.source);
    return { agentId: "cursor", displayName: "Cursor", status: diagnostics.some((item) => item.severity === "error") ? "parse-error" : parsed.some((item) => item.source.exists) ? "found" : "not-found", sources, rules, effective: this.computeEffective(rules), diagnostics, unknownCount: parsed.reduce((sum, item) => sum + item.unknownKeys.length, 0), highRiskFindings: rules.filter((rule) => rule.effect === "allow" && /^Shell\((rm|curl|wget|sudo)/.test(rule.raw)).map((rule) => `Cursor allows risky shell token: ${rule.raw}`), extensions: cursorExtensions(sources) };
  },
  computeEffective(rules) {
    return effectiveFromRules("cursor", rules);
  },
  getSupportedIntents() {
    return [
      { id: "add-allow-rule", label: "Add permissions.allow token", risk: "medium" },
      { id: "add-deny-rule", label: "Add permissions.deny token", risk: "low" },
      { id: "remove-allow-rule", label: "Remove exact allow token", risk: "medium" },
      { id: "remove-deny-rule", label: "Remove exact deny token", risk: "high" }
    ];
  },
  planChange(input: PlanChangeInput, source: SourceFile): ChangePlan {
    const before = source.content ?? "{}\n";
    const parsed = parseJsonLike(before, source.path);
    if (parsed.hasComments) return refused(input, source, before, "Comment-preserving JSONC writes are not enabled.");
    const root = getObject(parsed.value) ?? {};
    const permissions = nestedObject(root, "permissions");
    const key = input.intent.endsWith("allow-rule") ? "allow" : input.intent.endsWith("deny-rule") ? "deny" : null;
    if (!key) return refused(input, source, before, "Unsupported Cursor change intent.");
    const token = String(input.value);
    if (!CURSOR_PERMISSION_TOKEN_RE.test(token))
      return refused(
        input,
        source,
        before,
        "Cursor permission tokens must use Shell(...), Read(...), Write(...), or Mcp(...)."
      );
    const values = arrayFromUnknown(permissions[key]);
    const warnings: string[] = [];
    if (input.intent.startsWith("add-")) {
      if (!values.includes(token)) values.push(token);
    } else {
      permissions[key] = values.filter((item) => item !== token);
      if (key === "deny") warnings.push("Removing a deny token can broaden what Cursor may do.");
    }
    permissions[key] = input.intent.startsWith("remove-") ? permissions[key] : values;
    const after = formatJson(root);
    return { ok: true, agentId: "cursor", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after, diff: createLineDiff(before, after), willCreate: !source.exists, warnings, diagnostics: [] };
  }
};

function cursorExtensions(sources: SourceFile[]) {
  return [
    extensionConfig({
      agentId: "cursor",
      kind: "skills",
      label: "Cursor rules",
      configuration: "Cursor uses repo rules under `.cursor/rules` rather than this app's Codex/Claude-style skill folders.",
      notes: ["Rules are instruction-like context and are shown here as the closest Cursor equivalent to skills."],
      sources: sources.filter((source) => source.kind === "skills")
    }),
    unsupportedExtension("cursor", "plugins", "Cursor plugins", "Cursor plugin configuration is not modeled by this adapter.")
  ];
}

function validateTokens(rules: PermissionRule[], path: string) {
  return rules
    .filter((rule) => rule.effect !== "informational" && !CURSOR_PERMISSION_TOKEN_RE.test(rule.raw))
    .map((rule) => ({ severity: "warning" as const, message: `Unsupported Cursor permission token: ${rule.raw}`, path, code: "cursor-token" }));
}

function refused(input: PlanChangeInput, source: SourceFile, before: string, message: string): ChangePlan {
  return { ok: false, agentId: "cursor", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after: before, diff: "No changes.", willCreate: !source.exists, warnings: [message], diagnostics: [{ severity: "error", message, path: source.path }] };
}
