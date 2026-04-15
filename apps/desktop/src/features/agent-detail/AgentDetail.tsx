import type { AgentSummary } from "@agent-permissions-editor/core";
import { PermissionMatrix } from "../../components/permission/PermissionMatrix";
import { StatusPill } from "../../components/ui/StatusPill";
import { sourceLabel } from "../../lib/viewModels";

export function AgentDetail({ summary, onSelectSource }: { summary: AgentSummary | null; onSelectSource: (sourceId: string) => void }) {
  if (!summary) return <p>Select an agent from the overview.</p>;
  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h2>{summary.displayName}</h2>
          <p>Adapter {summary.sources[0]?.adapterVersion ?? "0.1.0"}, docs reviewed {summary.sources[0]?.docsReviewedAt ?? "2026-04-15"}</p>
        </div>
        <StatusPill tone={summary.status === "parse-error" ? "danger" : summary.status === "found" ? "ok" : "muted"}>{summary.status}</StatusPill>
      </div>
      <PermissionMatrix summary={summary} />
      <section>
        <h3>Source files</h3>
        <div className="source-list">
          {summary.sources.map((source) => (
            <button key={source.id} type="button" onClick={() => onSelectSource(source.id)}>
              <strong>{source.path}</strong>
              <span>{sourceLabel(source)} · {source.exists ? "exists" : "missing target"} · {source.writeSupport}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Known rules</h3>
        <div className="rule-list">
          {summary.rules.map((rule) => (
            <article key={rule.id}>
              <strong>{rule.label}</strong>
              <span>{rule.effect} · {rule.capability} · {rule.confidence}</span>
              <p>{rule.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
