# Agent Permissions Editor Product Specification

Last updated: 2026-04-15

## Summary

Build a standalone, local-first desktop app for managing AI coding agent permissions. The app is a GUI-based editor for the native configuration files that leading AI agents already read. It is not a runtime enforcement layer, does not require a database, does not require a background daemon, and does not need to be running for permissions to remain effective.

The first product should support macOS and Linux, use Tauri for the desktop shell, TypeScript for the core and UI, and ship as a lightweight app that can later be embedded into Overlord or distributed independently.

The app should begin with a conservative MVP:

- Discover Claude Code, OpenAI Codex, and Cursor user-level and repo-level permission/config files.
- Surface the source files, scopes, precedence, and likely effective permissions.
- Explain permissions in human terms without hiding agent-specific behavior.
- Safely edit a small set of high-confidence native permission settings.
- Show a diff before write.
- Back up every file before write.
- Validate and re-read after write.
- Preserve unknown fields, comments, and formatting whenever the format supports it.
- Work fully offline during normal usage.

## Intentions

The product exists because local AI coding agents increasingly have access to shells, files, MCP tools, network requests, browser automation, IDE integrations, and project-specific instructions. Each agent exposes these controls differently. Users need a single place to inspect and manage those permissions without adopting a new hosted service or trusting another runtime layer.

The app should feel like a security-conscious local editor:

- The native files remain the source of truth.
- The user can close the app and the configured permissions still apply.
- The app makes exact file changes visible.
- The app is honest when it does not know how an agent will interpret a setting.
- The app never silently loosens permissions.
- The app can be removed without breaking agent behavior.

## Goals

- Provide a fast local GUI for managing agent-native permission files.
- Support standalone distribution from the start.
- Prioritize macOS and Linux.
- Avoid any required network, database, account, or Overlord dependency.
- Treat agent-native files as authoritative state.
- Discover both user-level and repository-level config.
- Explain configured and likely effective permissions by agent and scope.
- Preserve unsupported or unknown config content.
- Make all writes reversible through local backups.
- Provide enough structure that future agents can be added by implementing adapters.
- Keep the codebase small, testable, and easy to audit.

## Non-Goals

- Do not enforce permissions at runtime.
- Do not require a daemon, proxy, wrapper command, kernel extension, launch agent, or background process.
- Do not store canonical permission state in a database.
- Do not require Overlord, Supabase, or any hosted service.
- Do not replace each agent's own permission model with a fake universal model.
- Do not edit unsupported files by rewriting them wholesale.
- Do not make broad cross-agent policy projection the initial core product.
- Do not auto-change adapter behavior only because documentation changed.
- Do not support Windows in the first production target, though the design should avoid blocking it later.

## Product Name

Working name: Agent Permissions Editor

The final name can change, but the product language should stay concrete:

- "Manage agent permission files"
- "Review local agent permissions"
- "Edit native config"
- "Back up and write changes"

Avoid language that implies the app controls agents at runtime.

## Target Users

- Developers using multiple AI coding agents locally.
- Teams standardizing agent behavior across repos.
- Security-conscious users who want to understand what an agent can do before they run it.
- Power users who are comfortable with config files but want a safer editor.
- Future Overlord users who want a standalone local permissions panel without relying on the rest of the app.

## Primary User Stories

- As a developer, I can open a repo and see which agent permission files exist at user and repo scopes.
- As a developer, I can see whether Claude, Codex, and Cursor are configured to read, write, execute commands, or use network-related capabilities.
- As a developer, I can see the exact file path behind every permission summary.
- As a developer, I can edit a known safe permission setting through a GUI and review the raw diff before saving.
- As a developer, I can restore a previous version if a change causes problems.
- As a developer, I can keep using my agents after closing or uninstalling the app.
- As a team lead, I can identify risky repo-level settings before committing them.
- As a cautious user, I can see when the app does not understand a config key and leaves it untouched.

## Operating Principles

1. Native files are source of truth.
2. Reading is always safer than writing.
3. Unknown config must be preserved.
4. No write without a diff.
5. No write without a backup.
6. No silent broadening of permissions.
7. Documentation updates are advisory, not automatic behavior changes.
8. The core library must not import Tauri, React, Overlord, or database code.
9. Agent-specific behavior should be surfaced, not hidden.
10. The app must be useful without network access.

## Platform And Stack

### Required Stack

- Desktop shell: Tauri 2
- UI: React + TypeScript
- Build tool: Vite
- Core logic: TypeScript package
- Tauri backend: Rust command layer for filesystem access, app directories, shell-safe validation commands, and OS integration
- Package manager: pnpm or npm; choose one at repository creation and use it consistently
- Tests: Vitest for TypeScript core and UI utilities; Rust tests for Tauri command boundary where useful
- E2E: Playwright or WebdriverIO only if needed after MVP; unit and fixture tests are higher priority

### Recommended Libraries

Keep dependencies intentionally small.

- `jsonc-parser` for comment-preserving JSON/JSONC edits.
- `@iarna/toml`, `smol-toml`, or another mature TOML parser for TOML read support.
- A TOML editing strategy that preserves formatting before enabling TOML writes.
- `yaml` only when a supported agent requires YAML.
- `zod` or `valibot` for internal schema validation.
- `fast-glob` or `tinyglobby` for repo discovery.
- `diff` or a small internal line-diff utility for preview generation.
- `chokidar` only if native Tauri file watching is not enough.

Avoid:

- Embedded databases.
- Heavy state management frameworks for MVP.
- Network clients in the core package.
- Full config-management DSLs.
- Shelling out for basic parsing.

## Repository Structure

Create a standalone repository with this shape:

```text
agent-permissions-editor/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  README.md
  LICENSE
  docs/
    product-spec.md
    adapter-authoring.md
    security-model.md
    supported-agents.md
  apps/
    desktop/
      index.html
      package.json
      src/
        main.tsx
        app/
          App.tsx
          routes.tsx
        features/
          overview/
          agent-detail/
          file-detail/
          change-review/
          backups/
        components/
          ui/
          layout/
          permission/
        lib/
          tauriClient.ts
          viewModels.ts
      src-tauri/
        Cargo.toml
        tauri.conf.json
        capabilities/
          default.json
        src/
          main.rs
          commands.rs
          fs.rs
          backup.rs
          validation.rs
  packages/
    core/
      package.json
      src/
        index.ts
        model/
          agent.ts
          permission.ts
          source.ts
          change.ts
          diagnostics.ts
        discovery/
          discoverWorkspace.ts
          discoverUserConfig.ts
          pathCandidates.ts
        adapters/
          types.ts
          claude/
            adapter.ts
            schema.ts
            parser.ts
            writer.ts
            fixtures/
          codex/
            adapter.ts
            schema.ts
            parser.ts
            writer.ts
            fixtures/
          cursor/
            adapter.ts
            schema.ts
            parser.ts
            writer.ts
            fixtures/
        formats/
          jsonc.ts
          toml.ts
          markdown.ts
        planning/
          planChange.ts
          diff.ts
        backups/
          manifest.ts
        validation/
          validateParsed.ts
        test/
          fixtures.ts
    docs-checker/
      package.json
      src/
        index.ts
        manifest.ts
        hashDocs.ts
        adapters.ts
    shared-ui/
      package.json
      src/
        components/
        tokens/
```

The first implementation may collapse `shared-ui` into `apps/desktop` until reuse is needed. Keep `packages/core` separate from day one.

## Runtime Architecture

```text
React UI
  calls typed Tauri commands

Tauri Rust command layer
  handles filesystem permissions
  reads and writes files
  creates backups
  exposes selected app directories
  optionally runs validation commands

TypeScript core
  discovers candidate files
  parses native config
  normalizes known permissions
  explains effective state
  plans patches
  validates parsed models
  generates diffs

Agent adapters
  implement agent-specific file paths
  parse agent-specific config
  map known fields to normalized summaries
  produce safe edits for supported settings
```

The TypeScript core should run in the frontend process for fast iteration, but all filesystem access should go through Tauri commands. The core should accept file contents and path metadata as inputs, then return parsed models, diagnostics, and planned writes.

## Data Flow

### Discovery Flow

1. User selects or confirms a repository path.
2. UI asks Tauri for workspace metadata and candidate files.
3. Tauri returns only file metadata and contents for allowed candidate paths.
4. Core runs all enabled agent adapters against the workspace and user home context.
5. Core returns discovered sources, parsed permissions, diagnostics, and unsupported content markers.
6. UI displays overview, agent detail, and file detail views.

### Edit Flow

1. User chooses a high-level intent or edits a supported rule.
2. Core adapter creates a proposed file patch.
3. Core computes a diff and validation diagnostics.
4. UI shows summary and raw diff.
5. User confirms write.
6. Tauri creates a backup.
7. Tauri writes the new content atomically.
8. Tauri re-reads the file.
9. Core parses the new content and confirms expected state.
10. UI shows success, warning, or rollback option.

### External Change Flow

1. File watcher notices a source file changed.
2. UI marks stale parsed state.
3. If there are no unsaved local edits, re-read and re-parse.
4. If there are unsaved local edits, show a conflict state and require the user to discard or rebase.

## Core Domain Model

Use explicit confidence and write support. Do not pretend all agent settings map cleanly.

```ts
export type AgentId =
  | "claude-code"
  | "openai-codex"
  | "cursor";

export type PermissionScope =
  | "managed"
  | "user"
  | "workspace"
  | "repo"
  | "local"
  | "runtime"
  | "unknown";

export type SourceKind =
  | "settings"
  | "permissions"
  | "instructions"
  | "mcp"
  | "ide-settings"
  | "managed-policy"
  | "unknown";

export type Capability =
  | "shell.execute"
  | "filesystem.read"
  | "filesystem.write"
  | "network.fetch"
  | "network.command"
  | "mcp.use"
  | "browser.use"
  | "approval.mode"
  | "sandbox.mode"
  | "instructions.load"
  | "hooks.run"
  | "unknown";

export type RuleEffect =
  | "allow"
  | "ask"
  | "deny"
  | "configure"
  | "informational"
  | "unknown";

export type Confidence =
  | "known"
  | "inferred"
  | "unknown";

export type WriteSupport =
  | "safe-write"
  | "read-only"
  | "partial"
  | "unsupported";

export interface PermissionSource {
  id: string;
  agentId: AgentId;
  scope: PermissionScope;
  kind: SourceKind;
  path: string;
  exists: boolean;
  format: "json" | "jsonc" | "toml" | "markdown" | "yaml" | "unknown";
  precedence: number | null;
  writableByApp: boolean;
  writeSupport: WriteSupport;
  adapterVersion: string;
  docsReviewedAt: string;
}

export interface PermissionRule {
  id: string;
  sourceId: string;
  capability: Capability;
  effect: RuleEffect;
  raw: string;
  label: string;
  explanation: string;
  confidence: Confidence;
  specificity: "global" | "path" | "command" | "domain" | "tool" | "profile" | "unknown";
  target?: string;
  diagnostics: Diagnostic[];
}

export interface EffectivePermission {
  agentId: AgentId;
  capability: Capability;
  status: "allowed" | "denied" | "asks" | "partially-allowed" | "unknown";
  confidence: Confidence;
  explanation: string;
  contributingRuleIds: string[];
  blockingRuleIds: string[];
  caveats: string[];
}
```

## Adapter Contract

Every agent adapter should implement:

```ts
export interface AgentAdapter {
  id: AgentId;
  displayName: string;
  adapterVersion: string;
  docsReviewedAt: string;
  docs: DocumentationReference[];

  discover(input: DiscoveryInput): Promise<DiscoveredSource[]>;
  parse(input: ParseInput): Promise<ParsedSource>;
  summarize(input: SummarizeInput): Promise<AgentSummary>;
  computeEffective(input: EffectiveInput): Promise<EffectivePermission[]>;
  getSupportedIntents(): PermissionIntentDefinition[];
  planChange(input: PlanChangeInput): Promise<ChangePlan>;
  validate(input: ValidateInput): Promise<ValidationResult>;
}
```

Rules:

- `discover` may return files that do not exist yet if they are valid creation targets.
- `parse` must preserve raw content and unknown fields.
- `planChange` must refuse unsupported writes.
- `planChange` must never remove unknown fields.
- `validate` must include both parser validation and agent-specific warnings.
- Adapters should prefer read-only support over risky writes.

## Agent Support Matrix

### Claude Code

Research snapshot:

- Official settings docs describe managed, user, project, and local scopes.
- User settings: `~/.claude/settings.json`.
- Project settings: `.claude/settings.json`.
- Local project settings: `.claude/settings.local.json`.
- Managed settings can be delivered through server-managed settings, MDM/OS policy, or file-based managed settings in system directories.
- Settings precedence is managed, command line arguments, local project, shared project, user.
- Permission settings include `permissions.allow`, `permissions.ask`, `permissions.deny`, `permissions.additionalDirectories`, `permissions.defaultMode`, `permissions.disableBypassPermissionsMode`, and `permissions.skipDangerousModePermissionPrompt`.
- Permission rule syntax uses `Tool` or `Tool(specifier)`.
- Rule evaluation is deny first, ask second, allow third.
- Sandbox settings include filesystem and network controls under `sandbox`.
- Arrays may merge across scopes.

Initial Claude adapter support:

- Read `~/.claude/settings.json`.
- Read `.claude/settings.json`.
- Read `.claude/settings.local.json`.
- Detect file-based managed settings on macOS and Linux as read-only.
- Parse `permissions.allow`, `permissions.ask`, `permissions.deny`.
- Parse `permissions.defaultMode`.
- Parse `permissions.disableBypassPermissionsMode`.
- Parse `sandbox.enabled`.
- Parse `sandbox.filesystem.allowWrite`, `denyWrite`, `allowRead`, `denyRead`.
- Parse `sandbox.network.allowedDomains`.
- Parse MCP-related allow/deny settings as read-only initially.
- Support safe writes for `permissions.allow`, `permissions.ask`, `permissions.deny`, and `permissions.defaultMode` in user/project/local settings only.
- Treat managed settings as read-only.

Creation targets:

- User: `~/.claude/settings.json`.
- Repo shared: `<repo>/.claude/settings.json`.
- Repo local: `<repo>/.claude/settings.local.json`.

Claude write constraints:

- Preserve `$schema`.
- Preserve unknown top-level keys.
- Preserve unknown `permissions` keys.
- Preserve comments if existing files are JSONC-like, but prefer strict JSON output for newly created files unless the adapter confirms comments are accepted.
- Never write `skipDangerousModePermissionPrompt` into shared project settings because official docs indicate it is ignored in project settings to prevent untrusted repos from auto-bypassing prompts.

References:

- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/permissions

### OpenAI Codex

Research snapshot:

- Official Codex docs describe local sandbox and approval controls.
- Codex CLI / IDE defaults include no network access and write permissions limited to the active workspace.
- Sandbox mode controls technical access, such as write roots and network.
- Approval policy controls when Codex asks before acting.
- Common modes include read-only, workspace-write with on-request approvals, untrusted approvals, and danger-full-access.
- Network access in `workspace-write` is configured with `[sandbox_workspace_write] network_access = true`.
- Codex uses `~/.codex/config.toml` for configuration.
- Profiles can be defined in TOML and selected with `codex --profile`.
- `AGENTS.md` files are instructions, not permission files, but they affect agent behavior and should be shown as instruction sources.
- Codex instruction discovery includes global `~/.codex/AGENTS.md` or `~/.codex/AGENTS.override.md`, then project files from repo root to current directory.
- Codex supports fallback instruction filenames via `project_doc_fallback_filenames`.

Initial Codex adapter support:

- Read `~/.codex/config.toml`.
- Read `~/.codex/AGENTS.md`.
- Read `~/.codex/AGENTS.override.md`.
- Discover repo `AGENTS.md` and `AGENTS.override.md` from repo root to selected workspace path.
- Parse `approval_policy`.
- Parse `sandbox_mode`.
- Parse `[sandbox_workspace_write].network_access`.
- Parse `[profiles.*].approval_policy`.
- Parse `[profiles.*].sandbox_mode`.
- Parse `[profiles.*.sandbox_workspace_write].network_access` if documented and validated by fixtures before write support.
- Parse `project_doc_fallback_filenames`.
- Parse `project_doc_max_bytes`.
- Treat `AGENTS.md` files as instruction sources, not permission rules.

Creation targets:

- User config: `~/.codex/config.toml`.
- Global instructions: `~/.codex/AGENTS.md`.
- Repo instructions: `<repo>/AGENTS.md`.

Codex write constraints:

- TOML write support must preserve existing comments and unknown keys before enabled for existing files.
- If preservation is not ready, Codex TOML files are read-only except for newly created minimal files.
- Never enable `danger-full-access`, `--yolo` equivalent behavior, or `approval_policy = "never"` through a one-click broadening action.
- Changing `sandbox_mode` to less restrictive modes must require an explicit warning.
- `AGENTS.md` edits are out of MVP scope unless implemented as raw markdown edit with diff; they are displayed first as instruction sources.

References:

- https://developers.openai.com/codex/agent-approvals-security
- https://developers.openai.com/codex/guides/agents-md

### Cursor

Research snapshot:

- Cursor CLI permissions use permission tokens in CLI configuration.
- Global CLI config: `~/.cursor/cli-config.json`.
- Project CLI config: `<project>/.cursor/cli.json`.
- Permission token types include `Shell(commandBase)`, `Read(pathOrGlob)`, and `Write(pathOrGlob)`.
- Cursor docs state deny rules take precedence over allow rules.
- Cursor project rules are stored under `.cursor/rules`.
- Cursor user rules are global and defined in settings.
- Cursor supports `AGENTS.md` as a simple alternative to `.cursor/rules`.
- Legacy `.cursorrules` still exists but is not recommended.

Initial Cursor adapter support:

- Read `~/.cursor/cli-config.json`.
- Read `<repo>/.cursor/cli.json`.
- Discover `<repo>/.cursor/rules/**/*.mdc`.
- Discover `<repo>/AGENTS.md`.
- Discover `<repo>/.cursorrules` as legacy read-only.
- Parse `permissions.allow`.
- Parse `permissions.deny`.
- Normalize `Shell(...)`, `Read(...)`, and `Write(...)` permission tokens.
- Treat rules files as instruction sources, not permissions.

Creation targets:

- User CLI config: `~/.cursor/cli-config.json`.
- Repo CLI config: `<repo>/.cursor/cli.json`.
- Repo rules directory: `<repo>/.cursor/rules/`.

Cursor write constraints:

- Support safe writes for `permissions.allow` and `permissions.deny` in CLI JSON files.
- Preserve unknown top-level config keys.
- Treat `.cursor/rules`, `AGENTS.md`, and `.cursorrules` as read-only in MVP unless raw edit support is explicitly added.
- Do not assume Cursor IDE settings and Cursor CLI permissions are identical unless docs confirm the mapping.

References:

- https://docs.cursor.com/cli/reference/permissions
- https://docs.cursor.com/context/rules

## Future Agent Candidates

These should not block MVP, but the architecture should allow adapters for:

- Gemini CLI
- GitHub Copilot coding agent / agent mode
- Windsurf
- Continue
- Cline / Roo Code
- Aider
- Goose
- Sourcegraph Amp

Each future adapter must document:

- User-level config paths.
- Repo-level config paths.
- Precedence.
- Permission schema.
- Instruction file behavior.
- Whether safe writes are supported.
- Validation strategy.
- Documentation source and reviewed date.

## Normalized Permission Categories

Use normalized categories for overview only. Always preserve agent-specific details in agent views.

- Shell commands
- File reads
- File writes
- Network access
- Web fetch / browser access
- MCP tools
- Hooks / lifecycle commands
- Approval mode
- Sandbox mode
- Instruction sources
- Managed policy

Every normalized row should show confidence:

- Known: direct documented mapping.
- Inferred: strong mapping but not exact.
- Unknown: discovered config exists, but the app does not understand it.

## UX Specification

### Navigation

Primary sections:

- Overview
- Agents
- Files
- Backups
- Documentation Status
- Settings

### First Launch

First launch should not require sign-in or network.

Flow:

1. Show product purpose in one concise paragraph.
2. Ask user to choose a repository folder or inspect only user-level configs.
3. Run local discovery.
4. Show found agents, files, and warnings.

Copy direction:

- "This app edits local permission files used by your agents."
- "No background service is required."
- "Changes remain effective after you close the app because they are written to native config files."

### Overview Page

Display:

- Selected repository path.
- Agent cards for Claude Code, Codex, Cursor.
- Status per agent: found, not found, partial, stale adapter, parse error.
- User-level sources found.
- Repo-level sources found.
- Managed or read-only sources found.
- High-risk findings.
- Unsupported fields count.

Example high-risk findings:

- "Claude Code local settings allow bypass permissions mode."
- "Codex profile uses danger-full-access."
- "Cursor allows Shell(rm)."
- "Network access is enabled for Codex workspace-write mode."
- "A managed Claude policy exists and cannot be changed here."

### Agent Detail Page

Display:

- Agent name and adapter version.
- Docs reviewed date.
- Source files grouped by scope.
- Likely effective permission matrix.
- Known rules.
- Unknown or unsupported config.
- Instruction sources.
- Edit actions supported for this agent.

Matrix columns:

- Capability
- Effective status
- Confidence
- Source
- Notes

### File Detail Page

Display:

- Exact absolute path.
- Scope and precedence.
- Format.
- Writable status.
- Parsed known settings.
- Unknown preserved settings.
- Raw content preview.
- Diagnostics.
- Backup history for this file.

Actions:

- Reveal in file manager.
- Copy path.
- Open raw file in external editor.
- Create file if valid target.
- Restore backup.

### Change Review Page

Before every write, display:

- Plain-English summary.
- Files to be changed.
- Whether each file will be created or edited.
- Backup destination.
- Validation result.
- Raw diff.
- Risk warnings.

The primary button should be specific:

- "Write 1 file"
- "Create 2 files"
- "Back up and write"

Avoid vague labels like "Apply" for security-sensitive changes.

### Backups Page

Display:

- Backup records grouped by file.
- Timestamp.
- Agent.
- Action reason.
- Adapter version.
- Diff summary.
- Restore action.

Backup storage should live in the app data directory, not next to the edited files by default.

Recommended path:

- macOS: `~/Library/Application Support/Agent Permissions Editor/backups/`
- Linux: `${XDG_DATA_HOME:-~/.local/share}/agent-permissions-editor/backups/`

### Documentation Status Page

Display:

- Adapter version.
- Docs URL.
- Docs reviewed date.
- Last local check date.
- Current status: current, changed, unchecked, offline, unknown.
- Whether writes are enabled.

The docs checker must be optional. Normal app use must work offline.

## Supported Edit Intents For MVP

Start with a narrow set of high-confidence intents.

### Generic Intents

- Add allow rule.
- Add deny rule.
- Remove exact allow rule.
- Remove exact deny rule.
- Move exact rule from allow to deny.
- Move exact rule from deny to allow.
- Set default approval or permission mode when the agent has a documented field.
- Enable or disable network only when the agent has a documented field and the risk warning is clear.

### Claude MVP Intents

- Add `permissions.allow` rule.
- Add `permissions.ask` rule.
- Add `permissions.deny` rule.
- Remove exact rule from one of those arrays.
- Set `permissions.defaultMode` to a documented non-bypass value.
- Enable or disable `sandbox.enabled`.
- Add or remove `sandbox.network.allowedDomains`.

### Codex MVP Intents

- Set `approval_policy` to `on-request`, `untrusted`, or `never` only with explicit warning for `never`.
- Set `sandbox_mode` to `read-only` or `workspace-write`.
- Set `[sandbox_workspace_write].network_access`.
- Add a profile with conservative values.
- Edit existing profiles only after comment-preserving TOML write support is proven.

### Cursor MVP Intents

- Add `permissions.allow` token.
- Add `permissions.deny` token.
- Remove exact token from allow or deny.
- Create minimal `~/.cursor/cli-config.json` or `<repo>/.cursor/cli.json`.

## Write Safety Model

### Backup Manifest

Every write creates a backup manifest entry:

```ts
export interface BackupRecord {
  id: string;
  createdAt: string;
  appVersion: string;
  adapterId: AgentId;
  adapterVersion: string;
  originalPath: string;
  backupPath: string;
  contentSha256Before: string;
  contentSha256After: string;
  actionLabel: string;
  diffSummary: string;
}
```

### Atomic Writes

Use atomic write semantics:

1. Read original file.
2. Confirm content hash matches planned hash.
3. Write new content to temp file in same directory where possible.
4. fsync temp file if practical.
5. Rename temp file over original.
6. Re-read and hash.
7. Parse new content.

If any step fails, report a precise error and preserve backup.

### Symlink Handling

The app must detect symlinks before writing.

Default policy:

- Read symlink targets and show the resolved path.
- Do not write through symlinks without explicit confirmation.
- Never write through symlinks that resolve outside the expected user or repo config area unless the user explicitly chooses raw advanced mode.

### Permissions And Ownership

Before writing:

- Check file exists.
- Check file type is regular file.
- Check writable permissions.
- Check owner if supported.
- Warn if file is world-writable.
- Warn if parent directory is world-writable.

### Unsupported Files

If a parser cannot preserve unknown content, the file must be read-only.

The app may still offer:

- Raw preview.
- Copy path.
- Open externally.
- Create a separate supported file if the agent supports layering.

## Documentation Update Checker

The docs checker is optional and must never be required for ordinary read/edit flows.

Purpose:

- Detect when official docs changed since adapter review.
- Warn that write behavior may need review.
- Help maintainers update adapters.

Non-purpose:

- Do not scrape docs and automatically infer new config behavior.
- Do not auto-change writer behavior from a docs diff.
- Do not block read-only inspection when offline.

Design:

```ts
export interface DocsReference {
  agentId: AgentId;
  url: string;
  reviewedAt: string;
  reviewedHash?: string;
  relevantSections: string[];
}

export interface DocsCheckResult {
  agentId: AgentId;
  status: "unchanged" | "changed" | "unreachable" | "unchecked";
  checkedAt: string;
  urlResults: Array<{
    url: string;
    status: "unchanged" | "changed" | "unreachable";
    previousHash?: string;
    currentHash?: string;
  }>;
  recommendedWriteMode: "normal" | "read-only-for-stale-fields" | "read-only";
}
```

Behavior:

- Store docs metadata in app cache.
- Let user manually check for updates.
- Later, optionally check on launch only if user enables it.
- If docs changed, mark adapter stale.
- For stale adapters, continue reads.
- Disable writes only for fields whose docs are stale if the adapter can identify them; otherwise disable writes for that adapter.

## Tauri Permissions

Use a restrictive Tauri capability set.

The app needs:

- Dialog permission for folder selection.
- Filesystem read permission for selected repo, known user config paths, and app data/cache directories.
- Filesystem write permission only for known config paths and backup directories.
- Shell permission should be disabled by default.
- Network permission should be disabled by default.

If validation later shells out to agent binaries, make it opt-in and narrowly scoped.

## Validation Strategy

### Always Available

- Re-parse file after edit.
- Validate known schema fields.
- Confirm intended rule appears exactly once unless duplicates are allowed.
- Confirm unknown fields were preserved.
- Confirm generated diff only touches expected regions.

### Agent-Specific

Claude:

- Validate JSON syntax.
- Validate known permission arrays.
- Optionally validate against official JSON schema if bundled locally.
- Do not fetch schema during normal use.

Codex:

- Validate TOML syntax.
- Validate enum values for known settings.
- Optionally offer "Run codex status/debug validation" later, but not MVP.

Cursor:

- Validate JSON syntax.
- Validate permission token grammar for `Shell`, `Read`, and `Write`.
- Validate allow/deny arrays.

## UI Design Direction

This is a utility/security app. It should be calm, fast, and information-dense without feeling like a database admin panel.

Principles:

- Start with discovered state, not empty settings.
- Use exact paths.
- Prefer short direct copy.
- Make dangerous states visible but not theatrical.
- Keep raw file access one click away.
- Make diffs readable.
- Avoid animations that slow review.
- Avoid large marketing surfaces.
- Optimize for keyboard and mouse.

Recommended visual layout:

- Left sidebar with sections and selected repo.
- Main content with overview or detail.
- Right inspector panel for selected source/rule.
- Bottom or modal change review for writes.

Accessibility:

- Full keyboard navigation.
- High contrast diff colors.
- No color-only risk indicators.
- Text labels for all statuses.

## Performance Requirements

Targets for macOS and Linux:

- Cold launch under 1.5 seconds on a typical developer laptop after install.
- Discovery of user + repo config under 300 ms for common repos.
- Discovery should avoid full repo traversal except for known path globs like `.cursor/rules`.
- Parsing should be incremental per file.
- UI should remain responsive while reading files.
- App idle memory should stay meaningfully below Electron equivalents; target under 150 MB after initial load.

## Privacy And Security Requirements

- No telemetry in MVP.
- No network requests unless user manually runs docs update check.
- No account system.
- No cloud sync.
- No database.
- No sending config file contents anywhere.
- No shell execution unless a future validation feature explicitly asks for it.
- Treat repo files as untrusted input.
- Do not render raw Markdown instruction files as trusted HTML.
- Escape all raw file content in the UI.
- Keep backup files local.

## Error Handling

Common error states:

- File missing.
- Invalid JSON/TOML.
- Permission denied.
- File changed since discovery.
- Symlink requires confirmation.
- Unknown config key.
- Unsupported adapter version.
- Docs stale.
- Backup failed.
- Write failed.
- Validation failed after write.

Every error should include:

- What happened.
- Which file path is affected.
- Whether anything was written.
- Whether a backup exists.
- Suggested next action.

## Testing Plan

### Core Fixture Tests

For each adapter:

- Empty config.
- Minimal valid config.
- Full example config.
- Unknown keys.
- Comments if format supports them.
- Invalid syntax.
- Duplicate rules.
- User + repo precedence.
- Managed/read-only source.
- Missing file creation.
- Exact rule add/remove.
- Round-trip preservation.
- Diff contains expected hunk only.

### Platform Path Tests

- macOS user paths.
- Linux XDG user paths.
- Home directory expansion.
- Repo root detection.
- Nested workspace path.
- Symlink detection.

### UI Tests

- First launch with no repo.
- Select repo.
- Overview renders found and missing agents.
- Agent detail displays effective matrix.
- File detail displays raw content.
- Change review blocks write until confirmation.
- Backup appears after write.
- External file change shows stale/conflict state.

### Security Tests

- Path traversal attempts.
- Symlink outside expected area.
- World-writable config file warning.
- Raw Markdown escaping.
- Read-only managed policy cannot be edited.

## Build Milestones

### Milestone 1: Standalone Skeleton

Deliver:

- Tauri + React + TypeScript app.
- `packages/core` workspace.
- Folder selection.
- Basic app shell.
- No agent support yet.

Acceptance:

- App launches on macOS and Linux dev machines.
- User can select a repo folder.
- No network request is made on launch.

### Milestone 2: Discovery And Read Model

Deliver:

- Claude, Codex, Cursor adapters with read-only discovery.
- Source list with paths and scopes.
- Fixture tests.

Acceptance:

- App finds known user and repo files.
- App shows missing valid creation targets.
- Invalid files produce diagnostics, not crashes.

### Milestone 3: Permission Summaries

Deliver:

- Normalized permission categories.
- Agent detail pages.
- Effective/likely effective summaries.
- Unknown config surfacing.

Acceptance:

- User can answer "what can this agent do in this repo?"
- UI distinguishes known, inferred, and unknown findings.

### Milestone 4: Safe Writes

Deliver:

- Claude JSON permission edits.
- Cursor JSON permission edits.
- Conservative Codex TOML creation/edit support only where preservation is proven.
- Diff preview.
- Backups.
- Atomic write path.

Acceptance:

- No write occurs without confirmation.
- Backups are created before every write.
- Files are re-read and validated after write.
- Unknown fields are preserved.

### Milestone 5: Documentation Status

Deliver:

- Local docs manifest.
- Manual docs update check.
- Stale adapter warning.
- Read/write behavior gates for stale adapters.

Acceptance:

- App works fully offline.
- Manual check reports changed/unreachable/unchanged.
- Changed docs do not automatically change adapter behavior.

### Milestone 6: Packaging

Deliver:

- Signed or documented unsigned macOS build.
- Linux AppImage or deb/rpm target.
- Release checklist.
- Security review checklist.

Acceptance:

- A user can install and run the app without Overlord.
- Permissions remain effective after the app closes.

## Initial README Requirements

The standalone repo README should include:

- What the app does.
- What it does not do.
- Supported agents.
- Supported platforms.
- Local-only privacy statement.
- How backups work.
- How to run from source.
- How to build.
- How to add an adapter.

## Adapter Authoring Guide Requirements

The adapter docs should require:

- Official docs links.
- Reviewed date.
- Supported file paths.
- Precedence model.
- Read support.
- Write support.
- Unknown preservation strategy.
- Fixtures.
- Validation rules.
- Manual test checklist.

## Open Questions

- Should the first standalone repo live under Cooperativ ownership or under a neutral product name?
- Should Overlord embed the standalone app as a Tauri sidecar later, or should it deep-link/open the standalone app?
- Should the app support raw editing in MVP, or only open external editor?
- Should backups be encrypted, or is local app-data storage sufficient for MVP?
- Should docs update checks be entirely manual in MVP, or opt-in at launch?
- Should the app include a CLI inspector from the start?
- Should repo discovery support multiple selected repos in MVP, or one repo at a time?

## Build Acceptance Criteria

Another agent building from this spec should produce:

- A standalone Tauri + TypeScript repository.
- A working macOS/Linux desktop app.
- A local-only discovery flow.
- Claude, Codex, and Cursor adapters.
- Overview, agent detail, file detail, change review, backups, and docs status screens.
- Read-only inspection for all supported source types.
- Safe writes for a narrow set of supported permission settings.
- Local backups and restore.
- Fixture tests for adapter parsing and writes.
- No required DB, account, network, daemon, or Overlord dependency.

## Source Notes

Official documentation reviewed on 2026-04-15:

- Claude Code settings: https://code.claude.com/docs/en/settings
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- OpenAI Codex agent approvals and security: https://developers.openai.com/codex/agent-approvals-security
- OpenAI Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- Cursor CLI permissions: https://docs.cursor.com/cli/reference/permissions
- Cursor rules: https://docs.cursor.com/context/rules
