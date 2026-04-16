# Arbiter

Arbiter is a local-first desktop app for inspecting and editing the native permission files used by AI coding agents. It discovers the files those agents already read, explains the likely effective permissions, previews diffs before every write, and stores local backups first. The app does not enforce permissions at runtime.

## What It Does

- Discovers user-level and repository-level agent config files.
- Shows exact source paths, scopes, precedence, and parsed permission rules.
- Summarizes likely effective permissions without hiding agent-specific behavior.
- Shows raw file content and diagnostics for unsupported or invalid config.
- Plans narrow, high-confidence edits with a diff before write.
- Creates local backups before every write.
- Works offline during normal use.

## What It Does Not Do

- It does not run a daemon, proxy, wrapper command, kernel extension, or background service.
- It does not require an account, database, Overlord, Supabase, or cloud service.
- It does not send config file contents anywhere.
- It does not rewrite unsupported files wholesale.
- It does not replace native agent permission models with a universal policy.

## Supported Agents

- Claude Code: settings files, permission arrays, default mode, selected sandbox settings.
- OpenAI Codex: TOML config and AGENTS.md instruction sources, read-first MVP behavior.
- Cursor: CLI JSON permissions and repo rule/instruction sources.
- Gemini: config sources discovered by the core adapter layer.
- Antigravity: config sources discovered by the core adapter layer.
- OpenCode: config sources discovered by the core adapter layer.

## Supported Platforms

The first target platforms are macOS and Linux through Tauri 2.

## Backups

Before every write, the Tauri command layer stores the original file content under the app data directory and appends a manifest record containing hashes, adapter metadata, action label, and a diff summary. Backups are local files and are not encrypted in this MVP.

## Run From Source

```bash
npm install
npm run dev
```

## Build

The desktop bundle requires the Rust toolchain because Tauri compiles a native shell. Install Rust from <https://rustup.rs/> and restart your shell before running the Tauri build. Verify the prerequisite with:

```bash
cargo --version
```

```bash
npm run build
npm run tauri -- build
```

## Add An Adapter

Add a package under `packages/core/src/adapters/<agent>/` that implements the `AgentAdapter` contract. Include official docs links, reviewed date, supported paths, precedence, read/write support, preservation strategy, validation rules, and fixtures.
