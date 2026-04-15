# Security Model

Agent Permissions Editor is a local file editor, not a runtime enforcement system.

- Native config files remain the source of truth.
- Normal use makes no network requests.
- No telemetry is included in the MVP.
- File writes happen only after a proposed diff is shown.
- Every write creates a backup first.
- Symlinks and unexpected paths are surfaced before writes.
- Raw instruction content is displayed as text, never trusted HTML.
- Shell execution is not used for MVP validation.
