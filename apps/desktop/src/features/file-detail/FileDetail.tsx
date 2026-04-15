import type { DiscoveryResult, SourceFile } from "@agent-permissions-editor/core";
import { rulesForSource, sourceLabel } from "../../lib/viewModels";
import { StatusPill } from "../../components/ui/StatusPill";

export function FileDetail({ result, source, onPlan }: { result: DiscoveryResult | null; source: SourceFile | null; onPlan: (source: SourceFile) => void }) {
  if (!result || !source) return <p>Select a file from an agent detail page.</p>;
  const parsed = result.parsedSources.find((item) => item.source.id === source.id);
  const rules = rulesForSource(result, source.id);
  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h2>{source.path}</h2>
          <p>{sourceLabel(source)} · precedence {source.precedence ?? "n/a"}</p>
        </div>
        <StatusPill tone={source.writeSupport === "safe-write" ? "ok" : source.writeSupport === "partial" ? "warn" : "muted"}>{source.writeSupport}</StatusPill>
      </div>
      {source.isSymlink ? <p className="warning">Symlink target: {source.resolvedPath}</p> : null}
      <div className="detail-grid">
        <section>
          <h3>Parsed settings</h3>
          <div className="rule-list">
            {rules.length ? rules.map((rule) => (
              <article key={rule.id}>
                <strong>{rule.raw}</strong>
                <span>{rule.effect} · {rule.capability}</span>
              </article>
            )) : <p>No supported rules were parsed from this source.</p>}
          </div>
        </section>
        <section>
          <h3>Diagnostics</h3>
          {parsed?.diagnostics.length ? parsed.diagnostics.map((diagnostic) => <p className={diagnostic.severity} key={`${diagnostic.code}-${diagnostic.message}`}>{diagnostic.message}</p>) : <p>No diagnostics.</p>}
        </section>
      </div>
      <section>
        <div className="section-heading">
          <h3>Raw content</h3>
          <button type="button" onClick={() => onPlan(source)} disabled={!["safe-write", "partial"].includes(source.writeSupport)}>Plan edit</button>
        </div>
        <pre className="raw">{source.content ?? "File does not exist yet."}</pre>
      </section>
    </section>
  );
}
