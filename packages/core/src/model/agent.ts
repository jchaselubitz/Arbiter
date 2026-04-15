export type AgentId = "claude-code" | "openai-codex" | "cursor";

export interface DocumentationReference {
  agentId: AgentId;
  url: string;
  reviewedAt: string;
  reviewedHash?: string;
  relevantSections: string[];
}
