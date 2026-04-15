# Supported Agents

## Claude Code

Reads user, project, local project, and managed settings. Safe writes are limited to JSON settings files without comments and supported permission fields.

## OpenAI Codex

Reads user TOML config and AGENTS.md instruction sources. Existing TOML files are read-only in this MVP unless the change is generated for a new minimal file.

## Cursor

Reads user and repo CLI JSON files plus repo instruction sources. Safe writes are limited to `permissions.allow` and `permissions.deny` tokens in JSON files without comments.
