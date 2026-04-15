import type { BackupRecord } from "@agent-permissions-editor/core";

export function Backups({ backups }: { backups: BackupRecord[] }) {
  return (
    <section className="stack">
      <h2>Backups</h2>
      {backups.length ? (
        <div className="source-list">
          {backups.map((backup) => (
            <article key={backup.id}>
              <strong>{backup.originalPath}</strong>
              <span>{backup.createdAt} · {backup.actionLabel}</span>
              <p>{backup.diffSummary}</p>
              <small>{backup.backupPath}</small>
            </article>
          ))}
        </div>
      ) : (
        <p>No backups have been created yet.</p>
      )}
    </section>
  );
}
