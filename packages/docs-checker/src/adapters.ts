import { docsManifest, type DocsCheckResult, type DocsReference } from "./manifest";

export function uncheckedDocsStatus(now = new Date()): DocsCheckResult[] {
  const grouped = new Map<DocsReference["agentId"], DocsReference[]>();
  for (const reference of docsManifest) {
    grouped.set(reference.agentId, [...(grouped.get(reference.agentId) ?? []), reference]);
  }
  return [...grouped.entries()].map(([agentId, references]) => ({
    agentId,
    status: "unchecked",
    checkedAt: now.toISOString(),
    urlResults: references.map((reference) => ({ url: reference.url, status: "unreachable" })),
    recommendedWriteMode: "normal"
  }));
}
