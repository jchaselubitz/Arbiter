import type { DiscoveryResult } from "@agent-permissions-editor/core";
import { agentStatus, riskLevel } from "../../lib/viewModels";
import { StatusPill } from "../../components/ui/StatusPill";

export function Overview({ result, repoPath, onSelectAgent }: { result: DiscoveryResult | null; repoPath: string | null; onSelectAgent: (agentId: string) => void }) {
  const risk = riskLevel(result);
  if (!result) {
    return (
      <section className="stack">
        <h2>Review local agent permissions</h2>
        <p>No background service is required. Changes remain effective after you close the app because they are written to native config files.</p>
        <p>Choose a repository folder, or inspect only user-level configs from the sidebar.</p>
      </section>
    );
  }
  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h2>Overview</h2>
          <p>{repoPath ? repoPath : "User-level configs only"}</p>
        </div>
        <StatusPill tone={risk === "high" ? "danger" : risk === "medium" ? "warn" : "ok"}>{risk} risk</StatusPill>
      </div>
      <div className="card-grid">
        {result.summaries.map((summary) => (
          <button className="agent-card" key={summary.agentId} type="button" onClick={() => onSelectAgent(summary.agentId)}>
            <span>{summary.displayName}</span>
            <strong>{agentStatus(summary)}</strong>
            <small>{summary.sources.filter((source) => source.exists).length} files found, {summary.unknownCount} unknown keys</small>
          </button>
        ))}
      </div>
      <section>
        <h3>High-risk findings</h3>
        {result.highRiskFindings.length ? (
          <ul className="finding-list">
            {result.highRiskFindings.map((finding) => <li key={finding}>{finding}</li>)}
          </ul>
        ) : (
          <p>No high-risk finding was detected from supported fields.</p>
        )}
      </section>
    </section>
  );
}
