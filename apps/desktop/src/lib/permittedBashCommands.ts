import type { AgentId, AgentSummary, SourceFile } from "@agent-permissions-editor/core";

const bashCommandAgents: Partial<Record<AgentId, { valuePrefix: "Bash" | "Shell"; label: string }>> = {
  "claude-code": { valuePrefix: "Bash", label: "Claude Code" },
  cursor: { valuePrefix: "Shell", label: "Cursor" }
};

const scopePreference = new Map([
  ["local", 4],
  ["repo", 3],
  ["workspace", 2],
  ["user", 1]
]);

export function supportsPermittedBashCommands(agentId: AgentId): boolean {
  return agentId in bashCommandAgents;
}

export function permittedBashCommandValue(agentId: AgentId, command: string): string {
  const config = bashCommandAgents[agentId];
  if (!config) throw new Error(`${agentId} does not support permitted bash command writes.`);
  return `${config.valuePrefix}(${command.trim()})`;
}

export function permittedBashCommandLabel(agentId: AgentId): string {
  return bashCommandAgents[agentId]?.label ?? agentId;
}

export function getPermittedBashCommandTarget(summary: AgentSummary): SourceFile | null {
  if (!supportsPermittedBashCommands(summary.agentId)) return null;

  return summary.sources
    .filter((source) => source.kind === "settings")
    .filter((source) => source.writeSupport === "safe-write")
    .sort((a, b) => {
      const scopeDelta = (scopePreference.get(b.scope) ?? 0) - (scopePreference.get(a.scope) ?? 0);
      if (scopeDelta !== 0) return scopeDelta;
      return (b.precedence ?? 0) - (a.precedence ?? 0);
    })[0] ?? null;
}

