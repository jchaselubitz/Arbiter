# Changelog

## [0.2.0] - 2026-04-16:11:25

### Added
- `Overview` screen with repo-aware agent cards, risk status, and high-risk findings display.
- “Permit Bash Command” UI to preview and safely scope per-agent bash command writes.
- “Open in Finder” button for quickly revealing writable config file locations on macOS.
- Unit tests for `AgentDetail` tab rendering and tab-change callback behavior.

### Fixed
- None.

### Changed
- Refined the agent detail experience (tabs, diagnostics banner, file rows, and rules rendering).
- Updated UI layout and supporting state management to support the expanded overview/detail flow.

### Security
- Scoped permitted bash command writes to safe-write settings sources (reducing accidental unsafe writes).

### Removed
- None.

### Deprecated
- None.

### Performance
- None.

### Refactor
- None.

### Test
- Added `AgentDetail` tests.

### Documentation
- README expanded with clearer local-first behavior and build/run prerequisites.

### Chore
- None.


## [0.1.0] - 2026-04-16:07:47

### Added
- Initial desktop app for reviewing and editing native permission files for Claude Code, OpenAI Codex, Cursor, Gemini, Antigravity, and OpenCode.
- Repo-aware workflow with overview, permissions, files, change review, backups, documentation, and settings views.
- Local backup-first write flow with diff previews before saving changes.
- Offline-first operation with no runtime enforcement, account, database, or background daemon.

### Fixed
- None.

### Changed
- None.

### Security
- None.

### Removed
- None.

### Deprecated
- None.

### Performance
- None.

### Refactor
- None.

### Test
- None.

### Documentation
- Expand the README with a clearer app overview and supported-agent summary.

### Chore
- None.

