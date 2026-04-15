import type { ChangePlan } from "@agent-permissions-editor/core";

export function ChangeReview({ plan, saving, error, onWrite }: { plan: ChangePlan | null; saving: boolean; error: string | null; onWrite: () => void }) {
  if (!plan) return <p>No pending change. Choose “Plan edit” from a file detail page.</p>;
  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h2>Change Review</h2>
          <p>{plan.actionLabel}</p>
        </div>
        <button type="button" onClick={onWrite} disabled={!plan.ok || saving}>{plan.willCreate ? "Create 1 file" : "Back up and write"}</button>
      </div>
      <section>
        <h3>Files to change</h3>
        <p>{plan.path}</p>
        {plan.warnings.map((warning) => <p className="warning" key={warning}>{warning}</p>)}
        {plan.diagnostics.map((diagnostic) => <p className={diagnostic.severity} key={diagnostic.message}>{diagnostic.message}</p>)}
        {error ? <p className="error">{error}</p> : null}
      </section>
      <section>
        <h3>Raw diff</h3>
        <pre className="diff">{plan.diff}</pre>
      </section>
    </section>
  );
}
