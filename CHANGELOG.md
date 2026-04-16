# Changelog

## [0.3.0] - 2026-04-16:12:00

### Added
- `Overview` screen with repo-aware agent cards, risk status, and high-risk findings display.
- “Permit Bash Command” UI to preview and safely scope per-agent bash command writes.
- “Open in Finder” / reveal-in-file-manager button (wired into agent, file, change review, and backup views).
- Backups view for listing backups and revealing backup locations.
- Unit tests for `AgentDetail` tab rendering and tab-change callback behavior.

### Fixed
- None.

### Changed
- Refined the agent detail experience (tabs, diagnostics banner, file rows, and rules rendering).
- Improved file detail UX with “Plan edit” sheet, parsed rules section, raw content view, and edit gating by write support.
- Enhanced change review UX with multi-plan selection, warnings/diagnostics rendering, and sticky confirm/write actions.
- Updated editor + UI state management to support planning/confirming writes, rehydrating workspace state, and persisting UI theme/sidebar state.

### Security
- Scoped permitted bash command writes to safe-write settings sources (reducing accidental unsafe writes).
- Native-side permission writes now validate the planned `beforeHash` and refuse writes outside known agent config paths; backups are created locally prior to atomic writes.

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

