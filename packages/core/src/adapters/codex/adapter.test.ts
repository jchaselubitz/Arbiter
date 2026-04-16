import { describe, expect, it } from "vitest";
import { analyzeSources, createDiscoveryContext, planSourceChange } from "../../index";
import { codexAdapter } from "./adapter";

describe("codex adapter", () => {
  it("parses approval, sandbox, and network settings", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = codexAdapter.discover(context).find((item) => item.path === "/home/me/.codex/config.toml")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: 'approval_policy = "on-request"\nsandbox_mode = "workspace-write"\n[sandbox_workspace_write]\nnetwork_access = true\n' }]);
    const summary = result.summaries.find((item) => item.agentId === "openai-codex");
    expect(summary?.rules.map((rule) => rule.raw)).toContain("sandbox_workspace_write.network_access = true");
    expect(summary?.highRiskFindings).toContain("Codex high-risk setting: sandbox_workspace_write.network_access = true");
  });

  it("creates conservative minimal config when missing", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: null, platform: "linux" });
    const source = codexAdapter.discover(context).find((item) => item.path === "/home/me/.codex/config.toml")!;
    const result = analyzeSources(context, [source]);
    const plan = planSourceChange(result, { sourceId: source.id, currentContent: null, intent: "set-default-mode", value: "workspace-write", actionLabel: "Create Codex config" });
    expect(plan.ok).toBe(true);
    expect(plan.after).toContain('approval_policy = "on-request"');
  });

  it("surfaces repo skills and plugin marketplace metadata", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const sources = codexAdapter.discover(context);
    const skillSource = sources.find((item) => item.path === "/repo/.agents/skills")!;
    const pluginSource = sources.find((item) => item.path === "/repo/.agents/plugins/marketplace.json")!;
    const result = analyzeSources(context, [
      { ...skillSource, exists: true, content: null },
      { ...pluginSource, exists: true, content: "{}" }
    ]);
    const summary = result.summaries.find((item) => item.agentId === "openai-codex");
    expect(summary?.extensions.map((item) => `${item.kind}:${item.status}`)).toContain("skills:configured");
    expect(summary?.extensions.map((item) => `${item.kind}:${item.status}`)).toContain("plugins:configured");
  });
});
