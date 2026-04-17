import { describe, expect, it } from "vitest";
import { analyzeSources, createDiscoveryContext, planSourceChange } from "../../index";
import { claudeAdapter } from "./adapter";

describe("claude adapter", () => {
  it("parses permission arrays and preserves unknown top-level keys", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = claudeAdapter.discover(context).find((item) => item.path === "/repo/.claude/settings.json");
    expect(source).toBeTruthy();
    const result = analyzeSources(context, [{ ...source!, exists: true, content: '{"permissions":{"allow":["Bash(npm test)"],"deny":["WebFetch(*)"],"defaultMode":"ask"},"custom":true}' }]);
    const summary = result.summaries.find((item) => item.agentId === "claude-code");
    expect(summary?.rules.map((rule) => rule.raw)).toContain("Bash(npm test)");
    expect(summary?.unknownCount).toBe(1);
  });

  it("plans exact allow rule add", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = claudeAdapter.discover(context).find((item) => item.path === "/repo/.claude/settings.json")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: '{"permissions":{"allow":[]}}' }]);
    const plan = planSourceChange(result, { sourceId: source.id, currentContent: source.content, intent: "add-allow-rule", value: "Bash(npm test)", actionLabel: "Allow npm test" });
    expect(plan.ok).toBe(true);
    expect(plan.after).toContain('"Bash(npm test)"');
  });

  it("uses currentContent when planning repeated edits to the same source", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = claudeAdapter.discover(context).find((item) => item.path === "/repo/.claude/settings.json")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: '{"permissions":{"allow":[]}}' }]);
    const hydratedSource = result.sources.find((item) => item.id === source.id)!;
    const first = planSourceChange(result, {
      sourceId: hydratedSource.id,
      currentContent: hydratedSource.content,
      intent: "add-allow-rule",
      value: "Bash(node --test)",
      actionLabel: "Allow node tests"
    });
    const second = planSourceChange(result, {
      sourceId: hydratedSource.id,
      currentContent: first.after,
      intent: "add-allow-rule",
      value: "Bash(swift test)",
      actionLabel: "Allow Swift tests"
    });

    expect(second.before).toBe(first.after);
    expect(second.after).toContain('"Bash(node --test)"');
    expect(second.after).toContain('"Bash(swift test)"');
  });

  it("summarizes configured skills and plugins separately from permissions", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const sources = claudeAdapter.discover(context);
    const skillSource = sources.find((item) => item.path === "/repo/.claude/skills")!;
    const pluginSource = sources.find((item) => item.path === "/home/me/.claude/plugins/installed_plugins.json")!;
    const result = analyzeSources(context, [
      { ...skillSource, exists: true, content: null },
      { ...pluginSource, exists: true, content: "{}" }
    ]);
    const summary = result.summaries.find((item) => item.agentId === "claude-code");
    expect(summary?.extensions.find((item) => item.kind === "skills")?.status).toBe("configured");
    expect(summary?.extensions.find((item) => item.kind === "plugins")?.status).toBe("configured");
  });
});
