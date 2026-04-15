import { adapters } from "@agent-permissions-editor/core";

export function DocsStatus() {
  return (
    <section className="stack">
      <h2>Documentation Status</h2>
      <p>Manual documentation checks are not wired to network access in the MVP. Normal app use remains offline.</p>
      <table className="matrix">
        <thead>
          <tr><th>Agent</th><th>Adapter</th><th>Docs reviewed</th><th>Status</th></tr>
        </thead>
        <tbody>
          {adapters.map((adapter) => (
            <tr key={adapter.id}>
              <td>{adapter.displayName}</td>
              <td>{adapter.adapterVersion}</td>
              <td>{adapter.docsReviewedAt}</td>
              <td>unchecked</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
