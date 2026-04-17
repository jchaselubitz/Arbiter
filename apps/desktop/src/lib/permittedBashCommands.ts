import type { AgentId, AgentSummary, SourceFile } from "@arbiter/core";

export interface CommonAgentPermissionPreset {
  id: string;
  label: string;
  description: string;
  risk: "low" | "medium" | "high";
  commands: string[];
}

const bashCommandAgents: Partial<
  Record<AgentId, { valuePrefix: "Bash" | "Shell"; label: string }>
> = {
  "claude-code": { valuePrefix: "Bash", label: "Claude Code" },
  cursor: { valuePrefix: "Shell", label: "Cursor" },
};

export const commonAgentPermissionPresets: CommonAgentPermissionPreset[] = [
  {
    id: "package-metadata",
    label: "Package metadata lookup",
    description: "Package name and version lookup before dependency work.",
    risk: "low",
    commands: ["npm view", "npm search"],
  },
  {
    id: "test-runners",
    label: "Common test runners",
    description: "Focused local test commands commonly approved during implementation.",
    risk: "low",
    commands: ["node --test", "swift test", "cargo test", "yarn test:e2e", "yarn test:e2e:ci", "yarn fix-js-lint-tests"],
  },
  {
    id: "local-dev",
    label: "Local dev servers",
    description: "Project dev servers for manual and browser verification.",
    risk: "medium",
    commands: ["yarn dev", "npm run dev"],
  },
  {
    id: "dependency-install",
    label: "Dependency installation",
    description: "Project dependency add and install commands.",
    risk: "medium",
    commands: ["yarn add", "pod install"],
  },
  {
    id: "overlord-protocol",
    label: "Overlord ticket protocol",
    description: "Overlord ticket attachment and progress updates.",
    risk: "low",
    commands: ["ovld protocol", "npx overlord protocol", "node bin/ovld.mjs protocol"],
  },
  {
    id: "supabase-cli",
    label: "Supabase CLI",
    description: "Supabase project commands for database work.",
    risk: "medium",
    commands: ["supabase"],
  },
];

const scopePreference = new Map([
  ["local", 4],
  ["repo", 3],
  ["workspace", 2],
  ["user", 1],
]);

export function supportsPermittedBashCommands(agentId: AgentId): boolean {
  return agentId in bashCommandAgents;
}

export function permittedBashCommandValue(
  agentId: AgentId,
  command: string,
): string {
  const config = bashCommandAgents[agentId];
  if (!config)
    throw new Error(
      `${agentId} does not support permitted bash command writes.`,
    );
  return `${config.valuePrefix}(${command.trim()})`;
}

export function permittedBashCommandLabel(agentId: AgentId): string {
  return bashCommandAgents[agentId]?.label ?? agentId;
}

export function getPermittedBashCommandTarget(
  summary: AgentSummary,
): SourceFile | null {
  if (!supportsPermittedBashCommands(summary.agentId)) return null;

  return (
    summary.sources
      .filter((source) => source.kind === "settings")
      .filter((source) => source.writeSupport === "safe-write")
      .sort((a, b) => {
        const scopeDelta =
          (scopePreference.get(b.scope) ?? 0) -
          (scopePreference.get(a.scope) ?? 0);
        if (scopeDelta !== 0) return scopeDelta;
        return (b.precedence ?? 0) - (a.precedence ?? 0);
      })[0] ?? null
  );
}
