# Adapter Authoring

Every adapter must document:

- Official documentation links and review date.
- User-level and repo-level config paths.
- Precedence rules.
- Supported read behavior.
- Supported write behavior.
- Unknown-field preservation strategy.
- Fixtures for valid, invalid, unknown, duplicate, and missing-file cases.
- Validation rules.
- Manual test checklist.

Adapters must prefer read-only behavior over risky writes. Writers must refuse unsupported intents, preserve unknown fields, and generate a diff before the Tauri layer writes anything.
