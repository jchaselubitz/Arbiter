export interface DocsReference {
  agentId: "claude-code" | "openai-codex" | "cursor";
  url: string;
  reviewedAt: string;
  reviewedHash?: string;
  relevantSections: string[];
}

export interface DocsCheckResult {
  agentId: DocsReference["agentId"];
  status: "unchanged" | "changed" | "unreachable" | "unchecked";
  checkedAt: string;
  urlResults: Array<{
    url: string;
    status: "unchanged" | "changed" | "unreachable";
    previousHash?: string;
    currentHash?: string;
  }>;
  recommendedWriteMode: "normal" | "read-only-for-stale-fields" | "read-only";
}

export const docsManifest: DocsReference[] = [
  { agentId: "claude-code", url: "https://code.claude.com/docs/en/settings", reviewedAt: "2026-04-15", relevantSections: ["settings"] },
  { agentId: "claude-code", url: "https://code.claude.com/docs/en/permissions", reviewedAt: "2026-04-15", relevantSections: ["permissions"] },
  { agentId: "openai-codex", url: "https://developers.openai.com/codex/agent-approvals-security", reviewedAt: "2026-04-15", relevantSections: ["sandbox", "approvals"] },
  { agentId: "openai-codex", url: "https://developers.openai.com/codex/guides/agents-md", reviewedAt: "2026-04-15", relevantSections: ["instructions"] },
  { agentId: "cursor", url: "https://docs.cursor.com/cli/reference/permissions", reviewedAt: "2026-04-15", relevantSections: ["permissions"] },
  { agentId: "cursor", url: "https://docs.cursor.com/context/rules", reviewedAt: "2026-04-15", relevantSections: ["rules"] }
];
