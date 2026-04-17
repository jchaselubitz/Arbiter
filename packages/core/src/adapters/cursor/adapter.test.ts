import { describe, expect, it } from "vitest";
import { analyzeSources, createDiscoveryContext, planSourceChange } from "../../index";
import { cursorAdapter } from "./adapter";

describe("cursor adapter", () => {
  it("parses allow and deny tokens", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = cursorAdapter.discover(context).find((item) => item.path === "/repo/.cursor/cli.json")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: '{"permissions":{"allow":["Shell(rm)"],"deny":["Write(/tmp/**)"]}}' }]);
    const summary = result.summaries.find((item) => item.agentId === "cursor");
    expect(summary?.rules).toHaveLength(2);
    expect(summary?.highRiskFindings).toContain("Cursor allows risky shell token: Shell(rm)");
  });

  it("rejects unsupported token writes", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = cursorAdapter.discover(context).find((item) => item.path === "/repo/.cursor/cli.json")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: "{}" }]);
    const plan = planSourceChange(result, { sourceId: source.id, currentContent: "{}", intent: "add-allow-rule", value: "Danger(*)", actionLabel: "Bad token" });
    expect(plan.ok).toBe(false);
  });

  it("accepts Mcp permission tokens", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = cursorAdapter.discover(context).find((item) => item.path === "/repo/.cursor/cli.json")!;
    const result = analyzeSources(context, [
      { ...source, exists: true, content: '{"permissions":{"allow":["Mcp(next-devtools:init)"]}}' }
    ]);
    const summary = result.summaries.find((item) => item.agentId === "cursor");
    expect(summary?.rules.map((r) => r.raw)).toContain("Mcp(next-devtools:init)");
    expect(summary?.diagnostics.filter((d) => d.code === "cursor-token")).toHaveLength(0);
  });

  it("plans add-allow-rule for Mcp tokens", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = cursorAdapter.discover(context).find((item) => item.path === "/repo/.cursor/cli.json")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: "{}" }]);
    const plan = planSourceChange(result, {
      sourceId: source.id,
      currentContent: "{}",
      intent: "add-allow-rule",
      value: "Mcp(next-devtools:init)",
      actionLabel: "Allow MCP"
    });
    expect(plan.ok).toBe(true);
    expect(plan.after).toContain("Mcp(next-devtools:init)");
  });

  it("treats Cursor rules as the skills-equivalent extension surface", () => {
    const context = createDiscoveryContext({ homeDir: "/home/me", repoPath: "/repo", platform: "linux" });
    const source = cursorAdapter.discover(context).find((item) => item.path === "/repo/.cursor/rules")!;
    const result = analyzeSources(context, [{ ...source, exists: true, content: null }]);
    const summary = result.summaries.find((item) => item.agentId === "cursor");
    expect(summary?.extensions.find((item) => item.kind === "skills")?.status).toBe("configured");
    expect(summary?.extensions.find((item) => item.kind === "plugins")?.status).toBe("unsupported");
  });
});
