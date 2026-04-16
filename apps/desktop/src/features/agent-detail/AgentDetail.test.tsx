import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AgentSummary } from "@agent-permissions-editor/core";
import { AgentDetail } from "./AgentDetail";

const summary: AgentSummary = {
  agentId: "claude-code",
  displayName: "Claude Code",
  status: "found",
  sources: [
    {
      id: "claude-repo-settings",
      agentId: "claude-code",
      scope: "repo",
      kind: "settings",
      path: "/repo/.claude/settings.json",
      exists: true,
      format: "json",
      precedence: 1,
      writableByApp: true,
      writeSupport: "safe-write",
      adapterVersion: "0.1.0",
      docsReviewedAt: "2026-04-15",
      content: "{}"
    }
  ],
  rules: [
    {
      id: "rule-1",
      sourceId: "claude-repo-settings",
      capability: "shell.execute",
      effect: "deny",
      raw: "Bash(rm *)",
      label: "Claude deny",
      explanation: "Blocks risky shell commands.",
      confidence: "known",
      specificity: "command",
      diagnostics: []
    }
  ],
  effective: [],
  diagnostics: [],
  unknownCount: 0,
  highRiskFindings: [],
  extensions: [
    {
      id: "claude-code:skills:claude-skills",
      agentId: "claude-code",
      kind: "skills",
      label: "Claude skills",
      status: "configured",
      confidence: "known",
      scope: "repo",
      sourceIds: ["claude-repo-settings"],
      locations: ["/repo/.claude/settings.json"],
      configuration: "Skill directories are loaded from user-level and repo-level `.claude/skills` locations.",
      notes: ["Repo skills can change agent behavior for this workspace."]
    }
  ]
};

describe("AgentDetail", () => {
  it("renders the caller-selected tab when returning to the permissions screen", () => {
    const view = render(
      <AgentDetail
        summary={summary}
        activeTab="files"
        onTabChange={vi.fn()}
        onSelectSource={vi.fn()}
        onNavigateHome={vi.fn()}
      />
    );

    expect(view.getByText("/repo/.claude/settings.json")).toBeVisible();
  });

  it("reports tab changes to the caller", async () => {
    const onTabChange = vi.fn();
    const view = render(
      <AgentDetail
        summary={summary}
        activeTab="permissions"
        onTabChange={onTabChange}
        onSelectSource={vi.fn()}
        onNavigateHome={vi.fn()}
      />
    );

    await userEvent.click(view.getByRole("tab", { name: "Rules (1)" }));

    expect(onTabChange).toHaveBeenCalledWith("rules");
  });

  it("renders modeled skills and plugin surfaces", async () => {
    const view = render(
      <AgentDetail
        summary={summary}
        activeTab="extensions"
        onTabChange={vi.fn()}
        onSelectSource={vi.fn()}
        onNavigateHome={vi.fn()}
      />
    );

    expect(view.getByText("Claude skills")).toBeVisible();
    expect(view.getByText("Configured")).toBeVisible();
  });
});
