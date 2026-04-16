import type { AgentAdapter, AgentSummary, ParsedSource } from "../types";
import { collectDiagnostics, effectiveFromRules, extensionConfig, makeRule, makeSource } from "../common";
import type { PermissionRule } from "../../model/permission";
import type { SourceFile } from "../../model/source";
import type { ChangePlan, PlanChangeInput } from "../../model/change";
import { parseTomlLite } from "../../formats/toml";
import { createLineDiff } from "../../planning/diff";

const adapterVersion = "0.1.0";
const docsReviewedAt = "2026-04-15";

export const codexAdapter: AgentAdapter = {
  id: "openai-codex",
  displayName: "OpenAI Codex",
  adapterVersion,
  docsReviewedAt,
  docs: [
    { agentId: "openai-codex", url: "https://developers.openai.com/codex/agent-approvals-security", reviewedAt: docsReviewedAt, relevantSections: ["sandbox", "approval policy"] },
    { agentId: "openai-codex", url: "https://developers.openai.com/codex/guides/agents-md", reviewedAt: docsReviewedAt, relevantSections: ["AGENTS.md discovery"] }
  ],
  discover(input) {
    const sources = [
      makeSource({ agentId: "openai-codex", scope: "user", kind: "settings", path: `${input.homeDir}/.codex/config.toml`, format: "toml", precedence: 10, writeSupport: "partial", adapterVersion, docsReviewedAt }),
      makeSource({ agentId: "openai-codex", scope: "user", kind: "instructions", path: `${input.homeDir}/.codex/AGENTS.md`, format: "markdown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }),
      makeSource({ agentId: "openai-codex", scope: "user", kind: "instructions", path: `${input.homeDir}/.codex/AGENTS.override.md`, format: "markdown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }),
      makeSource({ agentId: "openai-codex", scope: "user", kind: "skills", path: `${input.homeDir}/.codex/skills`, format: "unknown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }),
      makeSource({ agentId: "openai-codex", scope: "user", kind: "plugins", path: `${input.homeDir}/.codex/plugins`, format: "unknown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt })
    ];
    if (input.repoPath) {
      sources.push(makeSource({ agentId: "openai-codex", scope: "repo", kind: "instructions", path: `${input.repoPath}/AGENTS.md`, format: "markdown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "openai-codex", scope: "repo", kind: "instructions", path: `${input.repoPath}/AGENTS.override.md`, format: "markdown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "openai-codex", scope: "repo", kind: "skills", path: `${input.repoPath}/.agents/skills`, format: "unknown", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
      sources.push(makeSource({ agentId: "openai-codex", scope: "repo", kind: "plugins", path: `${input.repoPath}/.agents/plugins/marketplace.json`, format: "json", precedence: null, writeSupport: "read-only", adapterVersion, docsReviewedAt }));
    }
    return sources;
  },
  parse(source: SourceFile): ParsedSource {
    if (!source.exists || source.content === null) return { source, rules: [], diagnostics: [], unknownKeys: [], raw: null };
    if (source.kind === "skills" || source.kind === "plugins") return { source, rules: [], diagnostics: [], unknownKeys: [], raw: source.content };
    if (source.kind === "instructions") {
      const rule = makeRule(source.id, `Instructions(${source.path})`, "informational", 0, "Codex instructions");
      rule.capability = "instructions.load";
      return { source, rules: [rule], diagnostics: [], unknownKeys: [], raw: source.content };
    }
    const parsed = parseTomlLite(source.content, source.path);
    const rules: PermissionRule[] = [];
    addConfigRule(rules, source.id, "approval.mode", "approval_policy", parsed.values.approval_policy);
    addConfigRule(rules, source.id, "sandbox.mode", "sandbox_mode", parsed.values.sandbox_mode);
    addConfigRule(rules, source.id, "network.fetch", "sandbox_workspace_write.network_access", parsed.values["sandbox_workspace_write.network_access"]);
    for (const [key, value] of Object.entries(parsed.values)) {
      if (/^profiles\..+\.approval_policy$/.test(key)) addConfigRule(rules, source.id, "approval.mode", key, value, "profile");
      if (/^profiles\..+\.sandbox_mode$/.test(key)) addConfigRule(rules, source.id, "sandbox.mode", key, value, "profile");
    }
    return { source: { ...source, writeSupport: "partial" }, rules, diagnostics: parsed.diagnostics, unknownKeys: Object.keys(parsed.values).filter((key) => !/approval_policy|sandbox_mode|sandbox_workspace_write\.network_access|project_doc/.test(key)), raw: parsed.values };
  },
  summarize(parsed: ParsedSource[]): AgentSummary {
    const rules = parsed.flatMap((item) => item.rules);
    const diagnostics = collectDiagnostics(parsed);
    const sources = parsed.map((item) => item.source);
    return { agentId: "openai-codex", displayName: "OpenAI Codex", status: diagnostics.some((item) => item.severity === "error") ? "parse-error" : parsed.some((item) => item.source.exists) ? "found" : "not-found", sources, rules, effective: this.computeEffective(rules), diagnostics, unknownCount: parsed.reduce((sum, item) => sum + item.unknownKeys.length, 0), highRiskFindings: rules.filter((rule) => /danger-full-access|approval_policy = never|network_access = true/.test(rule.raw)).map((rule) => `Codex high-risk setting: ${rule.raw}`), extensions: codexExtensions(sources) };
  },
  computeEffective(rules) {
    return effectiveFromRules("openai-codex", rules);
  },
  getSupportedIntents() {
    return [
      { id: "set-default-mode", label: "Create conservative Codex config", risk: "medium" },
      { id: "set-sandbox-network", label: "Create workspace network setting", risk: "high" }
    ];
  },
  planChange(input: PlanChangeInput, source: SourceFile): ChangePlan {
    if (source.exists && source.content) return refused(input, source, source.content, "Existing Codex TOML files are read-only until comment-preserving TOML writes are proven.");
    const before = "";
    const network = input.intent === "set-sandbox-network" ? Boolean(input.value) : false;
    const after = `approval_policy = "on-request"\nsandbox_mode = "workspace-write"\n\n[sandbox_workspace_write]\nnetwork_access = ${network ? "true" : "false"}\n`;
    const warnings = network ? ["Network access for Codex workspace-write mode is a high-risk change."] : [];
    return { ok: true, agentId: "openai-codex", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after, diff: createLineDiff(before, after), willCreate: true, warnings, diagnostics: [] };
  }
};

function codexExtensions(sources: SourceFile[]) {
  return [
    extensionConfig({
      agentId: "openai-codex",
      kind: "skills",
      label: "Codex skills",
      configuration: "Codex skills are read from user-level `.codex/skills` and repo-managed `.agents/skills` locations when present.",
      notes: ["Repo skills are behavior instructions, so they are visible here without being treated as permissions."],
      sources: sources.filter((source) => source.kind === "skills")
    }),
    extensionConfig({
      agentId: "openai-codex",
      kind: "plugins",
      label: "Codex plugins",
      configuration: "Plugin discovery is represented by user-level `.codex/plugins` and repo marketplace metadata under `.agents/plugins`.",
      notes: ["Plugin manifests can expose skills, apps, and MCP servers; this app currently inspects their configured locations only."],
      sources: sources.filter((source) => source.kind === "plugins")
    })
  ];
}

function addConfigRule(rules: PermissionRule[], sourceId: string, capability: PermissionRule["capability"], key: string, value: unknown, specificity: PermissionRule["specificity"] = "global") {
  if (value === undefined) return;
  rules.push({ id: `${sourceId}:config:${key}`, sourceId, capability, effect: "configure", raw: `${key} = ${String(value)}`, label: key, explanation: `Codex configures ${key} as ${String(value)}.`, confidence: "known", specificity, diagnostics: [] });
}

function refused(input: PlanChangeInput, source: SourceFile, before: string, message: string): ChangePlan {
  return { ok: false, agentId: "openai-codex", sourceId: source.id, path: source.path, actionLabel: input.actionLabel, before, after: before, diff: "No changes.", willCreate: !source.exists, warnings: [message], diagnostics: [{ severity: "error", message, path: source.path }] };
}
